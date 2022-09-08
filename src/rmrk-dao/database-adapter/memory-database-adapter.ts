import {
  Custodian,
  Collection2,
  Proposal,
  Prisma,
  Vote,
  VoteStatus,
} from '@prisma/client'
import { Propose } from '../interactions/propose'
import { Register } from '../interactions/register'
import { VoteInteraction } from '../interactions/vote'
import { IRmrkDaoDatabaseAdapter, VoteChange } from './types'

/**
 * In-memory RMRKDAO database adapter (useful for testing purposes)
 */
export class MemoryDatabaseAdapter implements IRmrkDaoDatabaseAdapter {
  custodians: Record<string, Custodian> = {}
  proposals: Record<string, Proposal> = {}
  collections: Record<string, Collection2> = {}
  blockTimes: Record<number, number> = {}
  votes: Record<string, Vote> = {}

  async upsertCustodian(register: Register): Promise<Custodian> {
    const existingCustodian = this.custodians[register.id]

    if (!existingCustodian) {
      this.custodians[register.id] = {
        block: register.block,
        id: register.id,
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
      this.custodians[register.id] = {
        block: register.block,
        id: register.id,
        voteFee: register.voteFee,
        proposalFee: register.proposalFee,
        recertifyFee: register.recertifyFee,
        maxOptions: register.maxOptions,
        changes,
      }
    }

    return this.custodians[register.id]
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
      owner: propose.owner,
    }
    this.proposals[propose.id] = proposal
    return proposal
  }

  async getProposal(proposalId: string): Promise<Proposal | null> {
    return this.proposals[proposalId] || null
  }

  async upsertVote(voteInteraction: VoteInteraction): Promise<Vote | null> {
    const previousVote = this.votes[voteInteraction.id]
    if (previousVote) {
      return await this.updateVote(previousVote, voteInteraction)
    } else {
      return await this.createVote(voteInteraction)
    }
  }

  async createVote(voteInteraction: VoteInteraction): Promise<Vote | null> {
    this.votes[voteInteraction.id] = {
      id: voteInteraction.id,
      block: voteInteraction.block,
      caller: voteInteraction.caller,
      proposalId: voteInteraction.proposalId,
      option: voteInteraction.option,
      status: VoteStatus.pending,
      changes: [],
    }

    return this.votes[voteInteraction.id]
  }

  async updateVote(
    previousVote: Vote,
    voteInteraction: VoteInteraction
  ): Promise<Vote | null> {
    const changes: VoteChange[] = [
      // @ts-ignore
      ...(previousVote.changes as VoteChange[]),
      {
        block: previousVote.block,
        option: previousVote.option,
      },
    ]

    const vote = this.votes[previousVote.id]

    vote.id = previousVote.id
    vote.block = voteInteraction.block
    vote.caller = voteInteraction.caller
    vote.proposalId = voteInteraction.proposalId
    vote.option = voteInteraction.option
    // @ts-ignore
    vote.changes = changes
    return vote
  }

  async getBlockTime(block: number): Promise<number | null> {
    return this.blockTimes[block] || null
  }
}
