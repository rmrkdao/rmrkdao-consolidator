import '../patch'
const fs = require('fs')
import { prisma } from '../db'
import arg from 'arg'
import { LatestConsolidatingRmrkStatus } from '@prisma/client'
import { batch } from '../rmrk2/utils'

const main = async () => {
  const args = arg({
    // Types
    '--in': String,

    // Aliases
    '-i': '--in',
  })

  console.log(args)

  // Check args
  if (!args['--in']) {
    throw new Error('Missing --in argument')
  }

  try {
    const content = fs.readFileSync(args['--in'])
    const data = JSON.parse(content)

    await prisma.nft2.deleteMany()
    await prisma.collection2.deleteMany()
    await prisma.base2.deleteMany()
    await prisma.consolidationInfo.deleteMany()
    // nfts, collections, bases, consolidationInfo
    for (const nftBatch of batch(data.nfts, 1000)) {
      await prisma.nft2.createMany({
        // @ts-ignore
        data: nftBatch.map((x: { forsale: string }) => ({
          ...x,
          forsale: BigInt(x.forsale),
        })),
      })
    }
    for (const collectionsBatch of batch(data.collections, 1000)) {
      await prisma.collection2.createMany({
        // @ts-ignore
        data: collectionsBatch,
      })
    }
    for (const basesBatch of batch(data.bases, 1000)) {
      await prisma.base2.createMany({
        // @ts-ignore
        data: basesBatch,
      })
    }
    // Import file must either have 'lastBlock' or 'consolidationInfoBatch' data
    if ('lastBlock' in data) {
      // Signal that the next remark to be processed should be the first in the next block
      await prisma.consolidationInfo.createMany({
        data: {
          version: '2.0.0',
          latestBlock: data.lastBlock + 1,
          latestRmrkOffset: 0,
          status: LatestConsolidatingRmrkStatus.processing,
        },
      })
    } else {
      for (const consolidationInfoBatch of batch(
        data.consolidationInfo,
        1000
      )) {
        await prisma.consolidationInfo.createMany({
          // @ts-ignore
          data: consolidationInfoBatch,
        })
      }
    }
    await prisma.history2.deleteMany()
  } catch (err) {
    console.error(err)
  }
}

main()
