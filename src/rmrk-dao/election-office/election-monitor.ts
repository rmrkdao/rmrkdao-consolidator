import { ProposalStatus } from '@prisma/client'
import exitHook from 'async-exit-hook'
import { getApiWithReconnect } from 'rmrk-tools'
import { KUSAMA_NODE_WS } from '../../app-constants'
import { prisma } from '../../db'
import '../../patch'
import { PgAdapter } from '../../rmrk2/pg-adapter'
import { ConsolidationLock } from '../../services/consolidation-lock'
import { PgDatabaseAdapter } from '../database-adapter/pg-database-adapter'
import { getSecretSeed as getSecret } from './helpers'
import { SecretaryOfState } from './secretary-of-state'
import { TallyMachine } from './tally-machine'

// TODO: Check for proposals that are ready to count votes for. There could be a field on the proposal table that signals this.

const lock = new ConsolidationLock('election-monitor-2.0.0')

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
  const secretSeed = await getSecret({
    secretId: SECRET_SEED_ID,
    region: AWS_REGION,
  })
  const secretaryOfState = await SecretaryOfState.create(api, secretSeed)

  console.log(`Custodian ready: ${secretaryOfState.getKusamaAddress()}`)

  // Lock to be used to prevent multiple blocks to be processed simultaneously
  let syncLock = false

  // Subscribe to the new headers on-chain. The callback is fired when new headers
  // are found, the call itself returns a promise with a subscription that can be
  // used to unsubscribe from the newHead subscription
  const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header) => {
    try {
      // Check if the lock is taken
      if (syncLock) {
        return
      }
      // Lock
      syncLock = true

      const blockNumber = Number(header.number)
      console.log(`Chain is at block: #${blockNumber}`)

      // Check for PROPOSALs ready to be counted for this custodian
      const proposals = await prisma.proposal.findMany({
        where: {
          status: ProposalStatus.ready_to_count,
          custodian: secretaryOfState.getKusamaAddress(), // TODO: Consider a wallet with multiple addresses
        },
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

        // Submit RESULT to blockchain
        // TODO: Consider the case where the process is killed after transaction starts but before the proposal status is updated in the database
        const hash = await secretaryOfState.submitResult(api, result)

        console.log(
          `SUBMIT (for proposal ${proposal.id}) interaction extrinsic successfully finalized on chain`,
          hash
        )

        // TODO: Consider case where the proposal isn't able to be saved (which would lead to multiple RESULTs being submitted on chain)
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: { status: { set: ProposalStatus.counted } },
        })
      }

      // Unlock
      syncLock = false
    } catch (e) {
      unsubscribe()
      await api.disconnect()
      throw e
    }
  })
}
