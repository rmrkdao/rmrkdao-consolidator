import { Custodian, Collection2, Proposal, Prisma } from '@prisma/client'
import { Propose } from '../interactions/propose'
import { Register } from '../interactions/register'
import { IRmrkDaoDatabaseAdapter } from './types'

/**
 * In-memory RMRKDAO database adapter (useful for testing purposes)
 */
export class MemoryDatabaseAdapter implements IRmrkDaoDatabaseAdapter {
  custodians: Record<string, Custodian> = {}
  proposals: Record<string, Proposal> = {}
  collections: Record<string, Collection2> = {}
  blockTimes: Record<number, number> = {}

  async upsertCustodian(register: Register): Promise<Custodian> {
    const existingCustodian = this.custodians[register.custodian]

    if (!existingCustodian) {
      this.custodians[register.custodian] = {
        block: register.block,
        custodian: register.custodian,
        voteFee: register.voteFee,
        proposalFee: register.proposalFee,
        recertifyFee: register.recertifyFee,
        maxOptions: register.maxOptions,
        changes: [],
      }
    } else {
      // Update existing CUSTODIAN entity (@see https://github.com/adamsteeber/rmrkdao-spec/issues/10)
      let changes = existingCustodian.changes as Prisma.JsonArray
      changes.push({ ...existingCustodian, changes: undefined }) // TODO: Consider more optimal changes schema
      this.custodians[register.custodian] = {
        block: register.block,
        custodian: register.custodian,
        voteFee: register.voteFee,
        proposalFee: register.proposalFee,
        recertifyFee: register.recertifyFee,
        maxOptions: register.maxOptions,
        changes,
      }
    }

    return this.custodians[register.custodian]
  }

  async doesProposalExist(proposalId: string): Promise<boolean> {
    return !!this.proposals[proposalId]
  }

  async getCustodian(custodianId: string): Promise<Custodian | null> {
    return this.custodians[custodianId]
  }

  async getCollections(collectionIds: string[]): Promise<Collection2[]> {
    return collectionIds.map((id) => this.collections[id]).filter((x) => !!x)
  }

  async saveProposal(propose: Propose): Promise<Proposal> {
    if (propose.id in this.proposals) {
      throw new Error('Proposal already exists!')
    }
    const proposal = {
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
    }
    this.proposals[propose.id] = proposal
    return proposal
  }

  async getBlockTime(block: number): Promise<number | null> {
    return this.blockTimes[block] || null
  }
}