import { LatestConsolidatingRmrkStatus } from '@prisma/client'
import exitHook from 'async-exit-hook'
import { Gauge } from 'prom-client'
import { fetchRemarks, getApiWithReconnect } from 'rmrk-tools'
import { KUSAMA_NODE_WS, KUSAMA_SS58_FORMAT } from '../app-constants'
import { prisma } from '../db'
import { metricsServer } from '../metrics-server'
import '../patch'
import { consolidate } from '../rmrk2/consolidator'
import { prefixes } from '../rmrk2/utils'
import { getAndSaveBlockTime } from '../services/block-time'
import { ConsolidationLock } from '../services/consolidation-lock'

const lock = new ConsolidationLock('2.0.0')

const main = async () => {
  // Acquire lock
  console.log('waiting for consolidation lock...')
  if (!(await lock.wait(30000))) {
    throw new Error('Unable to acquire consolidation lock')
  }
  console.log(
    `Acquired consolidation lock ${lock.key} for version ${lock.version} and user ${lock.user}`
  )

  // Start listening for new blocks and processing them
  await listenAndProcess()

  metricsServer()
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
 * Listen to new blocks and process unprocessed blocks
 */
const listenAndProcess = async () => {
  const latestConsolidatedGauge = new Gauge({
    name: 'latest_consolidated_block',
    help: 'Last Kusama block consolidated',
  })
  const targetBlock = new Gauge({
    name: 'target_block',
    help: 'The current target block',
  })
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

      const info = await prisma.consolidationInfo.findUnique({
        where: { version: '2.0.0' },
      })
      if (!info) {
        throw new Error('Missing consolidation info')
      }

      targetBlock.set(blockNumber)
      // TODO: Consider making logic more clear for getting the latest consolidated block
      latestConsolidatedGauge.set(info.latestBlock - 1)

      // info.latestBlock should be the next block that needs to be processed
      for (let x = info.latestBlock; x <= blockNumber; x++) {
        // Save block unix timestamp
        await getAndSaveBlockTime(api, x)

        const extracted = await fetchRemarks(
          api,
          x,
          x,
          prefixes,
          KUSAMA_SS58_FORMAT
        )

        if (extracted.length) {
          await consolidate(extracted, KUSAMA_SS58_FORMAT)
        }

        latestConsolidatedGauge.set(x)
      }

      // Update consolidation info for what should be the next block to be processed
      await prisma.consolidationInfo.update({
        where: { version: '2.0.0' },
        data: {
          latestBlock: blockNumber + 1, // TODO: Consider renaming this to "nextBlock"
          latestRmrkOffset: 0,
          status: LatestConsolidatingRmrkStatus.processing,
        },
      })

      // Unlock
      syncLock = false
    } catch (e) {
      unsubscribe()
      await api.disconnect()
      throw e
    }
  })
}
