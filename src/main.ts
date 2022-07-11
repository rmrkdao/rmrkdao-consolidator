import { ApiPromise } from '@polkadot/api'
import { LatestConsolidatingRmrkStatus } from '@prisma/client'
import { fetchRemarks } from 'rmrk-tools'
import { prisma } from './db'
import './patch'
import { consolidate } from './rmrk2/consolidator'
import { getApi, prefixes } from './rmrk2/utils'

const main = async () => {
  const ws = process.env.KUSAMA_NODE_WS || ''
  const api = await getApi(ws)
  console.log('got api connection')

  const systemProperties = await api.rpc.system.properties()
  const { ss58Format: chainSs58Format } = systemProperties.toHuman()

  const ss58Format = (chainSs58Format as number) || 2

  // Lock to be used to prevent multiple blocks to be processed simultaneously
  let syncLock = false

  // Subscribe to the new headers on-chain. The callback is fired when new headers
  // are found, the call itself returns a promise with a subscription that can be
  // used to unsubscribe from the newHead subscription
  const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header) => {
    // Check if the lock is taken
    if (syncLock) {
      return
    }

    // Lock
    syncLock = true

    const blockNumber = Number(header.number)
    console.log(`Chain is at block: #${blockNumber}`)

    const info = await prisma.consolidationInfo.findUnique({
      where: { version: '2.0.0' },
    })
    if (!info) {
      throw new Error('Missing consolidation info')
    }

    for (let x = info.latestBlock; x <= blockNumber; x++) {
      console.log(`Fetching block ${x} (latest: ${blockNumber})`)

      const extracted = await fetchRemarks(api, x, x, prefixes, ss58Format)
      if (extracted.length) {
        await consolidate(extracted, ss58Format)
      }
    }

    // Update consolidation info for what should be the next block to be processed
    await prisma.consolidationInfo.update({
      where: { version: '2.0.0' },
      data: {
        latestBlock: blockNumber + 1,
        latestRmrkOffset: 0,
        status: LatestConsolidatingRmrkStatus.processing,
      },
    })

    // Unlock
    syncLock = false
  })
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
