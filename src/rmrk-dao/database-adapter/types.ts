import { Collection2, Custodian, Proposal, Vote } from '@prisma/client'
import { Propose } from '../interactions/propose'
import { Register } from '../interactions/register'
import { VoteInteraction } from '../interactions/vote'

/**
 * RMRKDAO database adapter
 */
export interface IRmrkDaoDatabaseAdapter {
  /**
   * Create or update CUSTODIAN from register interaction
   * @param {Register} register
   * @returns {Promise<Custodian>}
   */
  upsertCustodian(register: Register): Promise<Custodian>

  /**
   * Check if a proposal already exists in database
   * @param {string} proposalId
   * @return {boolean}
   */
  doesProposalExist(proposalId: string): Promise<boolean>

  /**
   * Get a consolidated custodian object
   * @param {string} custodianId
   * @return {Custodian | null}
   */
  getCustodian(custodianId: string): Promise<Custodian | null>

  /**
   * Get consolidated collection objects
   * @param {string[]} collectionIds
   * @return {Collection2[]}
   */
  getCollections(collectionIds: string[]): Promise<Collection2[]>

  /**
   * Adds proposal to the consolidation
   * @param {Propose} propose
   * @throws {Error} if unable to create proposal
   */
  saveProposal(propose: Propose): Promise<Proposal>

  /**
   * Get a PROPOSAL with a given id
   * @param {string} proposalId
   * @return {Promise<Proposal | null>}
   */
  getProposal(proposalId: string): Promise<Proposal | null>

  /**
   * Upsert a VOTE
   * @param {VoteInteraction} voteInteraction
   * @return {Promise<Vote | null>}
   */
  upsertVote(voteInteraction: VoteInteraction): Promise<Vote | null>

  /**
   * Get the unix time in milliseconds of a block
   * @param {number} block
   */
  getBlockTime(block: number): Promise<number | null>
}

export interface VoteChange {
  block: number
  option: string
}
