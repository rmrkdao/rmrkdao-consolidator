import { Proposal, Vote } from '@prisma/client'
import { IConsolidatorAdapter } from 'rmrk-tools/dist/tools/consolidator/adapters/types'
import { ResultBuilder } from './result-builder'
import { IResult } from './types'
import { VoteInspector } from './vote-inspector'

/**
 * Tallies the votes and creates a IResult object
 */
export class TallyMachine {
  constructor(
    private proposal: Proposal,
    private unverifiedVotes: Vote[],
    private snapshotBlock: number,
    private rmrkDb: IConsolidatorAdapter
  ) {}

  /**
   * Inspects all VOTEs in a PROPOSAL, tallies them up, and creates a RESULT
   * @param {string} custodianKusamaAddress
   * @param {boolean} recertify
   * @returns {Promise<IResult>}
   */
  public async prepareResult(
    custodianKusamaAddress: string,
    recertify: boolean
  ): Promise<IResult> {
    const inspector = await this.tallyVotes()

    // If the proposal is electorate, pass total number of possible addresses if per-wallet proposal or total number of possible unburned NFTs
    const maxTurnout = this.proposal.electorate
      ? this.proposal.nftWeight
        ? inspector.totalUnburnedNfts
        : inspector.totalWalletsOfUnburnedNfts
      : undefined

    return new ResultBuilder(this.proposal, recertify)
      .createId(custodianKusamaAddress)
      .countValidatedVotes(inspector.getVoteSummaries())
      .calcThresholdDenominator(maxTurnout)
      .build()
  }

  /**
   * Tallies votes for all COLLECTIONs in a PROPOSAL
   * @returns {VoteInspector}
   */
  private async tallyVotes(): Promise<VoteInspector> {
    const inspector = new VoteInspector(
      this.unverifiedVotes,
      this.snapshotBlock
    )

    if (
      !Array.isArray(this.proposal.collections) ||
      this.proposal.collections.length === 0
    ) {
      throw new Error(`Proposal ${this.proposal.id} is missing collections`)
    }

    // Looping over a collection only once and checking the votes against each nft in the collection once as it is more likely that there will be less votes than number of NFTs in a collection on average
    for (const collectionId of this.proposal.collections as string[]) {
      // TODO: Consider creating an index on the nft2 table that tracks all past and current owners of the NFT
      // TODO: Check if undefined is returned only if there are no NFTs. If undefined is returned if there is an error, then this function should throw in that case.
      const collectionNfts =
        (await this.rmrkDb.getNFTsByCollection(collectionId)) || []

      inspector.processCollection(collectionNfts)
    }

    return inspector
  }
}
