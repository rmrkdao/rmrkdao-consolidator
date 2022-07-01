import { prisma } from './db'

const main = async () => {
  console.log(await prisma.nft.findMany())
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
