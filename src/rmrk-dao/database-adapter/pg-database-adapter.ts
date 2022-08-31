import { IRmrkDaoDatabaseAdapter } from './database-adapter-interface'
import { prisma } from '../../db'
import { Collection2, Proposal } from '@prisma/client'
import { Propose } from '../interactions/propose'

/**
 * Postgres database adapter.
 */
export class PgDatabaseAdapter implements IRmrkDaoDatabaseAdapter {
  async doesProposalExist(proposalId: string): Promise<boolean> {
    const count = await prisma.proposal.count({ where: { id: proposalId } })
    return count > 0
  }

  async getCustodian(custodianId: string) {
    const custodian = await prisma.custodian.findUnique({
      where: { custodian: custodianId },
    })
    return custodian
  }

  async getCollections(collectionIds: string[]): Promise<Collection2[]> {
    const collections = await prisma.collection2.findMany({
      where: {
        id: { in: collectionIds },
      },
    })
    return collections
  }

  async saveProposal(propose: Propose): Promise<Proposal> {
    const result = await prisma.proposal.create({
      data: {
        id: propose.id,
        block: propose.block,
        custodian: propose.custodian,
        name: propose.name,
        description: propose.description,
        collections: propose.collections,
        options: propose.options,
        passingThreshold: propose.passingThreshold,
        startDate: propose.startDate,
        snapshot: propose.snapshot,
        endDate: propose.endDate,
        nftWeight: propose.nftWeight,
        electorate: propose.electorate,
      },
    })

    return result
  }

  // TODO: (#2r7h63y)
  getBlockTime(block: number): Promise<number | null> {
    throw new Error('Function not implemented.')
  }
}
