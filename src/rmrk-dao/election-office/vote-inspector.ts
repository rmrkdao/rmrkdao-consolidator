import { Vote } from '@prisma/client'
import { NFTConsolidated } from 'rmrk-tools/dist/tools/consolidator/consolidator'
import { isNftBurnedAtBlock, getNftRootOwnerAtBlock } from '../../rmrk2/utils'
import { VotesWithNfts, VoteSummary } from './types'

/**
 * Qualifies VOTEs while associating VOTEs with NFTs and totaling up total
 * unburned NFTs in selected collections as well as Kusama addresses of
 * root owners of unburned NFTs.
 */
export class VoteInspector {
  /** Qualified votes with their qualified NFTs */
  private qualifiedVotesWithNfts: VotesWithNfts = new Map()

  /** Total unburned NFTs */
  private _totalUnburnedNfts: number = 0

  /** Total unburned Kusama addresses */
  private _totalAddressesOfUnburnedNfts: Set<string> = new Set()

  constructor(
    /** VOTEs to be checked */
    private unverifiedVotes: Vote[],
    /** Block at which time specific tests should be checked against */
    private snapshotBlock: number
  ) {}

  /**
   * Process a collections NFTs for the VOTEs in the PROPOSAL
   * @param {NFTConsolidated[]} nfts
   */
  public processCollection(nfts: NFTConsolidated[]) {
    // Keep track of non-burned total NFTs in a collection
    let unburnedNfts = nfts.length

    for (const nft of nfts) {
      const burned = isNftBurnedAtBlock(nft, this.snapshotBlock)

      if (burned) {
        unburnedNfts--
        continue
      }

      // Get qualified NFTs at the time of the snapshot for the voter's address
      const rootOwner = getNftRootOwnerAtBlock(nft, this.snapshotBlock)

      if (!rootOwner) {
        console.warn(
          `Unable to determine root owner of NFT ${nft.id} at block ${this.snapshotBlock}`
        )
        continue
      }

      for (const vote of this.unverifiedVotes) {
        if (rootOwner === vote.caller) {
          this.addQualifiedNftForVote(nft, vote)
        }
      }

      this._totalAddressesOfUnburnedNfts.add(rootOwner)
    }

    this._totalUnburnedNfts += unburnedNfts
  }

  /** Total unburned NFTs */
  public get totalUnburnedNfts(): number {
    return this._totalUnburnedNfts
  }

  /** Total unburned Kusama addresses */
  public get totalWalletsOfUnburnedNfts(): number {
    return this._totalAddressesOfUnburnedNfts.size
  }

  /**
   * Get vote summaries
   * @returns {VoteSummary[]}
   */
  public getVoteSummaries() {
    const counts: VoteSummary[] = []

    this.qualifiedVotesWithNfts.forEach((value) => {
      counts.push({
        voteId: value.vote.id,
        option: value.vote.option,
        weight: value.nfts.size,
      })
    })

    return counts
  }

  /**
   * Match a qualified NFT to a VOTE and add the VOTE to the qualified VOTEs (if not already added)
   * @param {NFTConsolidated[]} nft
   * @param {Vote} vote
   */
  private addQualifiedNftForVote(nft: NFTConsolidated, vote: Vote) {
    const voteInfo = this.qualifiedVotesWithNfts.get(vote.id)
    if (voteInfo) {
      voteInfo.nfts.set(nft.id, nft)
    } else {
      this.qualifiedVotesWithNfts.set(vote.id, {
        vote,
        nfts: new Map().set(nft.id, nft),
      })
    }
  }
}
