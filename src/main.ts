import { prisma } from './db'

const main = async () => {
  console.log(await prisma.nft2.findFirst())
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
