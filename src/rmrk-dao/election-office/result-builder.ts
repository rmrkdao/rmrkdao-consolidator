import { Proposal } from '@prisma/client'
import { VoteSummary, IResult } from './types'

/**
 * Builder class responsible for creating an IResult
 */
export class ResultBuilder {
  /** Map of option counts */
  private allCounts: Map<string, number> = new Map()

  /** Id of the RESULT */
  private id?: string

  /** The total could potentially be 0 if no one voted */
  private thresholdDenominator?: number

  constructor(private proposal: Proposal, private recertify: boolean) {}

  /**
   * Creates an id
   * @todo Decide on id format
   * @param custodianKusamaAddress
   * @returns
   */
  public createId(custodianKusamaAddress: string) {
    this.id = `${this.proposal.id}-${custodianKusamaAddress}-${Date.now()}`
    return this
  }

  /**
   * Count validated votes
   * Assumes all inputted votes have already been validated
   * @param {VoteSummary[]} votes
   */
  public countValidatedVotes(votes: VoteSummary[]) {
    for (const vote of votes) {
      this.addVote(vote)
    }
    return this
  }

  /**
   * Calculate threshold denominator
   * The maxTurnout parameter should be set depending on two variables:
   * 1. the PROPOSAL is an electorate
   * 1. the PROPOSAL is nftWeight
   * If the PROPOSAL is not an electorate, then pass undefined and the
   * threshold denominator will be calculated by summing all option counts.
   * Otherwise, if the PROPOSAL is nftWeight based, then the maxTurnout should
   * be the total number of unique Kusama addresses of root owners
   * of unburned NFTs in the selected COLLECTIONs at the snapshot time.
   * Otherwise, the maxTurnout should be the total number of unburned NFTs in
   * all of the selected COLLECTIONs at the snapshot time.
   * @param {number} maxTurnout
   */
  public calcThresholdDenominator(maxTurnout?: number) {
    if (this.proposal.electorate) {
      if (!maxTurnout || maxTurnout < 0) {
        throw new Error(
          'maxTurnout must be set to positive number if electorate is true'
        )
      }
      this.thresholdDenominator = maxTurnout
    } else {
      // Calculate the sum total of all options
      let total = 0
      this.allCounts.forEach((value) => {
        total += value
      })

      this.thresholdDenominator = total
    }

    return this
  }

  /**
   * Builds the IResult object if the required fields have been set
   * @returns {IResult}
   */
  public build(): IResult {
    if (!this.id) {
      throw new Error('Need to create id first')
    }
    if (!this.thresholdDenominator) {
      throw new Error('Need to calculate threshold denominator first')
    }

    return {
      id: this.id,
      count: this.getOptionCounts(),
      winningOptions: this.calcWinningOptions(this.thresholdDenominator),
      electorate: this.proposal.electorate,
      thresholdDenominator: this.thresholdDenominator,
      recertify: this.recertify,
    }
  }

  /**
   * Adds a single vote
   * @param {VoteSummary} vote
   */
  private addVote(vote: VoteSummary) {
    const count = this.allCounts.get(vote.option) || 0

    this.allCounts.set(vote.option, count + vote.weight)
  }

  /**
   * Creates option counts object
   * @returns {IResult["count"]}
   */
  private getOptionCounts(): IResult['count'] {
    const count: IResult['count'] = {}

    this.allCounts.forEach((value, key) => {
      count[key] = value
    })

    return count
  }

  /**
   * Calculate the winning options
   * @param {number} denominator Should only be zero if there are no votes
   * @returns {string[]}
   */
  private calcWinningOptions(denominator: number): IResult['winningOptions'] {
    if (this.allCounts.size > 0 && denominator === 0) {
      throw new Error('denominator should only be 0 if there are no votes')
    }

    let max = 0
    let winners: string[] = []

    for (const [option, value] of this.allCounts.entries()) {
      if (value > max) {
        max = value
        winners = [option]
      } else if (value === max) {
        winners.push(option)
      }
    }

    const passingThreshold = this.proposal.passingThreshold
    if (passingThreshold) {
      winners = winners.filter((option) => {
        // This code should not be running if the denominator is 0 as then there should be no options that were voted on
        let percentage = ((this.allCounts.get(option) || 0) / denominator) * 100
        return percentage >= passingThreshold
      })
    }

    return winners
  }
}
