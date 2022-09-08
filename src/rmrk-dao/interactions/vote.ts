import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import { kusamaEncodeAddress, validateRemarkDaoBase } from '../../utils'
import { INTERACTION_TYPES } from '../../app-constants'
import { IRmrkDaoDatabaseAdapter } from '../database-adapter'
import { ProposalOptions } from '../../types'

export class VoteInteraction {
  constructor(
    public block: number,
    public id: string,
    public caller: string,
    public proposalId: string,
    public option: string
  ) {}

  // TODO: Store validation errors in database (could be one table for all RMRK::DAO errors)
  static async fromRemark(
    remark: Remark,
    db: IRmrkDaoDatabaseAdapter
  ): Promise<VoteInteraction> {
    const [_prefix, _interactionType, _version, proposalId, encodedOption] =
      remark.remark.split('::')

    // Validate remark
    validateRemarkDaoBase(remark.remark, INTERACTION_TYPES.VOTE)

    if (encodedOption === undefined) {
      throw new Error(`Missing option`)
    }

    const option = VoteInteraction.parseData(encodedOption)

    // Check that PROPOSAL exists
    const proposal = await db.getProposal(proposalId)
    if (!proposal) {
      throw new Error(`Proposal (${proposalId}) does not exist`)
    }

    // Check that the option is available in the PROPOSAL
    if (!(option in (proposal.options as ProposalOptions))) {
      // TODO: @see https://github.com/adamsteeber/rmrkdao-spec/issues/13
      throw new Error(
        `Option ${option} is not available in PROPOSAL ${proposalId}`
      )
    }

    // Check that the correct amount of payment was sent to the custodian
    const custodian = await db.getCustodian(proposal.custodian)

    if (!custodian) {
      throw new Error(
        `CUSTODIAN ${proposal.custodian} does not exist for PROPOSAL ${proposalId}`
      )
    }

    // Validate that caller is authorized to vote

    // @see https://polkadot.js.org/docs/substrate/extrinsics#transferdest-multiaddress-value-compactu128
    const validBalanceTransfer = remark.extra_ex
      ?.filter((el) => el.call === 'balances.transfer')
      .find((el) => {
        const [owner, planck] = el.value.split(',') // Value is the concatenated args
        const ownerKusamaAddress = kusamaEncodeAddress(owner)
        return (
          ownerKusamaAddress === custodian.id &&
          BigInt(planck) >= BigInt(custodian.voteFee)
        )
      })
    if (!validBalanceTransfer) {
      throw new Error('Missing valid balance transfer')
    }

    // Get the unix timestamp milliseconds of the remark's block
    const remarkBlockTimestamp = await db.getBlockTime(remark.block)
    if (remarkBlockTimestamp === null) {
      throw new Error(`Unable to get block timestamp for block ${remark.block}`)
    }

    // Check that the vote was before the PROPOSAL's endDate
    if (remarkBlockTimestamp >= proposal.endDate) {
      throw new Error(`Cannot vote on or after PROPOSAL's endDate`)
    }

    return new VoteInteraction(
      remark.block,
      `${proposalId}-${remark.caller}`,
      remark.caller,
      proposalId,
      option
    )
  }

  /**
   * Parse data into option string
   * @param {string} dataString
   * @returns {string}
   */
  static parseData(dataString: string): string {
    const data = decodeURIComponent(dataString)
    return data
  }

  /**
   * Saves VOTE entity in consolidated data store and returns consolidated VOTE
   */
  async save(db: IRmrkDaoDatabaseAdapter) {
    return await db.upsertVote(this)
  }
}
