import { ProposalStatus } from '@prisma/client'
import exitHook from 'async-exit-hook'
import { getApiWithReconnect } from 'rmrk-tools'
import { KUSAMA_NODE_WS } from '../../app-constants'
import { prisma } from '../../db'
import '../../patch'
import { PgAdapter } from '../../rmrk2/pg-adapter'
import { ConsolidationLock } from '../../services/consolidation-lock'
import { PgDatabaseAdapter } from '../database-adapter/pg-database-adapter'
import { TallyMachine } from './tally-machine'
import { IResult } from './types'

// TODO: Check for proposals that are ready to count votes for. There could be a field on the proposal table that signals this.

const lock = new ConsolidationLock('election-monitor-2.0.0')

/**
 * The target custodian Kusama address which shall be used for processing matching PROPOSALs and creating RESULTs
 */
const CUSTODIAN_KUSAMA_ADDRESS = process.env.CUSTODIAN_KUSAMA_ADDRESS

if (!CUSTODIAN_KUSAMA_ADDRESS) {
  throw new Error('CUSTODIAN_KUSAMA_ADDRESS env variable must be set')
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
          custodian: CUSTODIAN_KUSAMA_ADDRESS,
        },
      })

      for (const proposal of proposals) {
        const unverifiedVotes = await prisma.vote.findMany({
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
          unverifiedVotes,
          snapshotBlock,
          rmrkDb
        )
        const result = await tallyMachine.prepareResult(
          CUSTODIAN_KUSAMA_ADDRESS,
          false
        )

        // Submit RESULT to blockchain
        await submitResult(result)

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

async function submitResult(result: IResult) {
  throw new Error('Function not implemented.')
}
