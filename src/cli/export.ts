import '../patch'
const fs = require('fs')
import { prisma } from '../db'
import arg from 'arg'

const main = async () => {
  const args = arg({
    // Types
    '--out': String,

    // Aliases
    '-o': '--out',
  })

  console.log(args)

  // Check args
  if (!args['--out']) {
    throw new Error('Missing --out argument')
  }

  const nfts = await prisma.nft2.findMany()
  const collections = await prisma.collection2.findMany()
  const bases = await prisma.base2.findMany()
  const consolidationInfo = await prisma.consolidationInfo.findMany()

  try {
    fs.writeFileSync(
      args['--out'],
      JSON.stringify({ nfts, collections, bases, consolidationInfo }, null, 2)
    )
  } catch (err) {
    console.error(err)
  }
}

main()
