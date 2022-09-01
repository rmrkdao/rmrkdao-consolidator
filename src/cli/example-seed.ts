import { prisma } from '../db'
import {
  randAlpha,
  randAlphaNumeric,
  randBoolean,
  randCatchPhrase,
  randFloat,
  randNumber,
  randParagraph,
  randPhrase,
} from '@ngneat/falso'
import { Proposal } from '@prisma/client'

/**
 * Create random custodians and proposals and add them to the database
 */
async function main() {
  const custodianData = Array(20)
    .fill('')
    .map(() => ({
      custodian: randAlphaNumeric({ length: 47 }).join(''),
      block: randNumber({ min: 8000000, max: 15000000 }),
      proposalFee: randNumber({ min: 100, max: 10000000 }).toString(),
      voteFee: randNumber({ min: 100, max: 10000000 }).toString(),
      recertifyFee: randNumber({ min: 100, max: 10000000 }).toString(),
      maxOptions: randNumber({ min: 2, max: 1000 }),
      changes: [],
    }))
  await prisma.custodian.createMany({
    data: custodianData,
  })
  console.log(`created ${custodianData.length} custodians`)

  const proposalData: Proposal[] = custodianData
    .map((custodian) => {
      return Array(10)
        .fill('')
        .map(() => ({
          id: randAlphaNumeric({ length: 10 }).join(''),
          block: randNumber({ min: 8000000, max: 15000000 }),
          custodian: custodian.custodian,
          name: randCatchPhrase(),
          description: randParagraph(),
          collections: Array(randNumber({ min: 1, max: 4 }))
            .fill('')
            .map(() => randAlphaNumeric({ length: 64 }).join('')),
          options: Array(randNumber({ min: 1, max: 20 }))
            .fill('')
            .map(() => randPhrase()),
          passingThreshold: randFloat({ min: 1, max: 100 }),
          startDate: randNumber({
            min: Date.now(),
            max: Date.now() + 1000 * 60 * 60 * 24 * 365,
          }),
          snapshot: randNumber({
            min: Date.now(),
            max: Date.now() + 1000 * 60 * 60 * 24 * 365,
          }),
          endDate: randNumber({
            min: Date.now(),
            max: Date.now() + 1000 * 60 * 60 * 24 * 365,
          }),
          nftWeight: randBoolean(),
          electorate: randBoolean(),
        }))
    })
    .flat()
  await prisma.proposal.createMany({
    // @ts-ignore
    data: proposalData,
  })
  console.log(`created ${proposalData.length} proposals`)
}

main()
