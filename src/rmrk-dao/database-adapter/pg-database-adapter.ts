import { Collection2, Custodian, Prisma, Proposal, Vote } from '@prisma/client'
import { getApiWithReconnect } from 'rmrk-tools'
import { KUSAMA_NODE_WS } from '../../app-constants'
import { prisma } from '../../db'
import { getAndSaveBlockTime } from '../../services/block-time'
import { Propose } from '../interactions/propose'
import { Register } from '../interactions/register'
import { VoteInteraction } from '../interactions/vote'
import { IRmrkDaoDatabaseAdapter, VoteChange } from './types'

/**
 * Postgres database adapter.
 */
export class PgDatabaseAdapter implements IRmrkDaoDatabaseAdapter {
  // Find possible CUSTODIAN entity with matching caller's address
  async upsertCustodian(registerInteraction: Register): Promise<Custodian> {
    const existingCustodian = await prisma.custodian.findUnique({
      where: { id: registerInteraction.id },
    })

    if (!existingCustodian) {
      return await prisma.custodian.create({
        data: {
          block: registerInteraction.block,
          id: registerInteraction.id,
          voteFee: registerInteraction.voteFee,
          proposalFee: registerInteraction.proposalFee,
          recertifyFee: registerInteraction.recertifyFee,
          maxOptions: registerInteraction.maxOptions,
          changes: [],
        },
      })
    } else {
      // Update existing CUSTODIAN entity (@see https://github.com/adamsteeber/rmrkdao-spec/issues/10)
      let changes = existingCustodian.changes as Prisma.JsonArray
      changes.push({ ...existingCustodian, changes: undefined }) // TODO: Consider more optimal changes schema
      return await prisma.custodian.update({
        where: { id: registerInteraction.id },
        data: {
          block: registerInteraction.block,
          id: registerInteraction.id,
          voteFee: registerInteraction.voteFee,
          proposalFee: registerInteraction.proposalFee,
          recertifyFee: registerInteraction.recertifyFee,
          maxOptions: registerInteraction.maxOptions,
          changes,
        },
      })
    }
  }
  async doesProposalExist(proposalId: string): Promise<boolean> {
    const count = await prisma.proposal.count({ where: { id: proposalId } })
    return count > 0
  }

  async getCustodian(custodianId: string) {
    const custodian = await prisma.custodian.findUnique({
      where: { id: custodianId },
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

  async getProposal(proposalId: string): Promise<Proposal | null> {
    return await prisma.proposal.findUnique({ where: { id: proposalId } })
  }

  async upsertVote(voteInteraction: VoteInteraction): Promise<Vote | null> {
    const previousVote = await prisma.vote.findUnique({
      where: { id: voteInteraction.id },
    })
    if (previousVote) {
      return await this.updateVote(previousVote, voteInteraction)
    } else {
      return await this.createVote(voteInteraction)
    }
  }

  async createVote(voteInteraction: VoteInteraction): Promise<Vote | null> {
    return await prisma.vote.create({
      data: {
        id: voteInteraction.id,
        block: voteInteraction.block,
        caller: voteInteraction.caller,
        proposalId: voteInteraction.proposalId,
        option: voteInteraction.option,
      },
    })
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

    return await prisma.vote.update({
      where: { id: previousVote.id },
      data: {
        block: voteInteraction.block,
        caller: voteInteraction.caller,
        proposalId: voteInteraction.proposalId,
        option: voteInteraction.option,
        // @ts-ignore
        changes,
      },
    })
  }

  /**
   * Get the unix time in milliseconds of a block via database first then blockchain if not in database
   * @param {number} block
   * @returns  {Promise<number|null>}
   * @throws
   */
  async getBlockTime(block: number): Promise<number | null> {
    const result = await prisma.blockTime.findUnique({ where: { block } })

    if (result) {
      return result.unixMilliseconds
    } else {
      try {
        // TODO: Temporary solution while database is not synced with block time stamps
        const api = await getApiWithReconnect([KUSAMA_NODE_WS])
        return await getAndSaveBlockTime(api, block)
      } catch (e) {
        console.error(e)
        return null
      }
    }
  }
}
