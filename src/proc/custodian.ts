import { Proposal, ResultCreationQueueStatus } from '@prisma/client'
import exitHook from 'async-exit-hook'
import { getApiWithReconnect } from 'rmrk-tools'
import { KUSAMA_NODE_WS, VERSION } from '../app-constants'
import { prisma } from '../db'
import '../patch'
import { PgAdapter } from '../rmrk2/pg-adapter'
import { ConsolidationLock } from '../services/consolidation-lock'
import { PgDatabaseAdapter } from '../rmrk-dao/database-adapter/pg-database-adapter'
import { getSecretSeed } from '../rmrk-dao/election-office/helpers'
import { SecretaryOfState } from '../rmrk-dao/election-office/secretary-of-state'
import { TallyMachine } from '../rmrk-dao/election-office/tally-machine'

// TODO: Rename class/table to something more generic
const lock = new ConsolidationLock('election-monitor-2.0.0')

/**
 * AWS ARN or ID of the custodian wallet seed secret
 */
const SECRET_SEED_ID = process.env.SECRET_SEED_ID
if (!SECRET_SEED_ID) {
  throw new Error('Missing SECRET_SEED_ID')
}

const AWS_REGION = process.env.AWS_REGION
if (!AWS_REGION) {
  throw new Error('Missing AWS_REGION')
}

const main = async () => {
  // Acquire lock
  console.log('waiting for consolidation lock...')
  if (!(await lock.wait(30000))) {
    throw new Error('Unable to acquire consolidation lock')
  }
  console.log(
    `Acquired consolidation lock ${lock.key} for version ${lock.version} and user ${lock.user}`
  )

  // Start listening for new blocks and check for PROPOSALs that are ready to count
  await listenAndProcess()
}

// Release the acquired consolidation lock from the database, if any
exitHook(async (callback) => {
  console.log('gracefully exiting')
  if (lock.key) {
    const result = await lock.unlock()
    if (result) {
      console.log(`Released lock ${result}`)
    } else {
      console.log(`Unable to release lock ${lock.key}`)
    }
  }

  await prisma.$disconnect()

  callback()
})

// Start
main().catch(console.error)

/**
 * Listen for new blocks and check for PROPOSALs that are ready to count
 */
const listenAndProcess = async () => {
  const api = await getApiWithReconnect([KUSAMA_NODE_WS])
  console.log('got api connection')

  // Create secretary of state (object responsible for submitting RESULTs on-chain)
  const secretSeed = await getSecretSeed({
    secretId: SECRET_SEED_ID,
    region: AWS_REGION,
  })

  const secretaryOfState = await SecretaryOfState.create({ secretSeed })

  console.log(`Custodian ready: ${secretaryOfState.getKusamaAddress()}`)

  // Lock to be used to prevent multiple PROPOSALs to be processed simultaneously (one at a time!)
  let syncLock = false

  /**
   * Continuously loop forever checking approximately every 10 seconds for
   * ready-to-process PROPOSALs and process them.
   */
  const unsubscribe = setInterval(async () => {
    try {
      // Check if the lock is taken
      if (syncLock) {
        return
      }
      // Lock
      syncLock = true

      await syncResultCreationQueue({
        custodianKusamaAddress: secretaryOfState.getKusamaAddress(),
      })

      const proposals = await getReadyProposals({
        custodianKusamaAddress: secretaryOfState.getKusamaAddress(),
      })

      for (const proposal of proposals) {
        const partiallyVerifiedVotes = await prisma.vote.findMany({
          where: { proposalId: proposal.id },
        })
        const rmrkdaoDb = new PgDatabaseAdapter()
        const rmrkDb = new PgAdapter()

        const snapshotBlock = await rmrkdaoDb.getLatestBlockAtTime(
          proposal.snapshot
        )

        if (snapshotBlock === null) {
          throw new Error(
            `Unable to find latest block at proposal snapshot time ${proposal.snapshot}`
          )
        }

        // Create a RESULT for the PROPOSAL
        const tallyMachine = new TallyMachine(
          proposal,
          partiallyVerifiedVotes,
          snapshotBlock,
          rmrkDb
        )
        const result = await tallyMachine.prepareResult(false)

        console.log(`About to SUBMIT (for proposal ${proposal.id})`)

        // Considers the case where the process is killed after Kusama
        // transaction starts but before the result_creation_queue status
        // is updated in the database. The syncResultCreationQueue function
        // will update the status from `about_to_submit` to `failed_to_submit`
        // for records with the `about_to_submit` status. After the Kusama
        // transaction succeeds, the queue record will have its status
        // updated to `result_submitted`.
        await prisma.resultCreationQueue.update({
          where: { proposalId: proposal.id },
          data: { status: ResultCreationQueueStatus.about_to_submit },
        })

        // Submit RESULT to blockchain
        const hash = await secretaryOfState.submitResult(api, result)

        console.log(
          `SUBMIT (for proposal ${proposal.id}) interaction extrinsic successfully finalized on chain`,
          hash
        )

        // Save submission to database
        await prisma.resultSubmission.create({
          data: {
            extrinsic: hash,
            proposalId: result.proposalId,
            count: result.count,
            winningOptions: result.winningOptions,
            thresholdDenominator: result.thresholdDenominator,
            recertify: result.recertify,
            custodian: secretaryOfState.getKusamaAddress(),
          },
        })

        // Set queue record status as `result_submitted`
        await prisma.resultCreationQueue.update({
          where: { proposalId: proposal.id },
          data: { status: ResultCreationQueueStatus.result_submitted },
        })
      }

      // Unlock
      syncLock = false
    } catch (e) {
      clearInterval(unsubscribe)
      await api.disconnect()
      throw e
    }
  }, 10 * 1000)
}

/**
 * Update result_creation_queue table:
 * - Bring new PROPOSALs that request the current custodian into the queue table
 * - Fail queue records that have a status of `about_to_submit`
 * @param {CustodianAddressInput} input
 */
const syncResultCreationQueue = async ({
  custodianKusamaAddress,
}: CustodianAddressInput) => {
  // Get PROPOSALs that are not already in the queue for the current custodian
  const proposals = await prisma.proposal.findMany({
    where: {
      // @see https://github.com/prisma/prisma/discussions/2772#discussioncomment-1712222
      queue: { none: {} }, // TODO: Will need to allow  for adding to queue when the same proposal has a RECERTIFY #3kghj5c
      custodian: custodianKusamaAddress, // TODO: Consider a wallet with multiple addresses
    },
  })

  await prisma.resultCreationQueue.createMany({
    data: proposals.map((proposal) => ({
      proposalId: proposal.id,
      custodian: custodianKusamaAddress,
    })),
  })

  // Fail queue records that have a status of about_to_submit
  await prisma.resultCreationQueue.updateMany({
    where: { status: ResultCreationQueueStatus.about_to_submit },
    data: { status: ResultCreationQueueStatus.failed_to_submit },
  })
}

/**
 * Get PROPOSALs that are ready to be processed and RESULT generated for based
 * on the latest consolidated block the consolidator process consolidated and
 * the result_creation_queue.
 * @param {CustodianAddressInput}
 * @returns {Promise<Proposal[]>}
 * @throws
 */
const getReadyProposals = async ({
  custodianKusamaAddress,
}: CustodianAddressInput): Promise<Proposal[]> => {
  const consolidationInfo = await prisma.consolidationInfo.findUnique({
    where: { version: VERSION },
  })
  if (!consolidationInfo) {
    throw new Error('Unable to read consolidation_info table')
  }
  // TODO: Consider making latestBlock column more clear
  const latestConsolidatedBlock = consolidationInfo.latestBlock - 1
  const blockTimeObj = await prisma.blockTime.findUnique({
    where: { block: latestConsolidatedBlock },
  })
  if (blockTimeObj === null) {
    throw new Error(
      `Unable to find block time for block ${latestConsolidatedBlock}`
    )
  }

  // Get proposals that have at least one relationship with a proposal_request_queue record that has
  // status = waiting, the proposal endDate is less than the latest consolidated block time, and
  // the current custodian matches the proposal.custodian field.
  const proposals = await prisma.proposal.findMany({
    where: {
      // Double check that the custodian matches as it is possible for the queue
      // table to reference proposals for another custodian if the process's
      // custodian's Kusama address changes for some reason
      custodian: custodianKusamaAddress,
      queue: {
        // @see https://github.com/prisma/prisma/discussions/2772#discussioncomment-1712222
        some: {
          status: ResultCreationQueueStatus.waiting,
        },
      },
      endDate: { lt: blockTimeObj.unixMilliseconds },
    },
  })

  return proposals
}

interface CustodianAddressInput {
  custodianKusamaAddress: string
}
