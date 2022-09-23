import { Vote } from '@prisma/client'
import { NFTConsolidated } from 'rmrk-tools/dist/tools/consolidator/consolidator'

export interface QualifiedNftInfo {
  /** Total number of non-burned NFTs */
  totalUnburnedNfts: number
  /** List of qualified NFTs */
  qualifiedNfts: NFTConsolidated[]
}

export interface ValidVoteWithExtraInfo {
  vote: Vote
  qualifiedNfts: NFTConsolidated[]
}

export type VotesWithNfts = Map<
  string,
  { vote: Vote; nfts: Map<string, NFTConsolidated> }
>

export interface IResult {
  proposalId: string
  count: Record<string, number>
  winningOptions: number[]
  thresholdDenominator: number
  recertify: boolean
}

export interface VoteSummary {
  voteId: string
  option: string
  nftCount: number
}
