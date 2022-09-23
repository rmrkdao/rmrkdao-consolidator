import Joi from 'joi'
import { getRemarkData } from 'rmrk-tools'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import { INTERACTION_TYPES } from '../../app-constants'
import { ProposalOptions } from '../../types'
import { resultCountObjectValidator, validateRemarkDaoBase } from '../../utils'
import { IRmrkDaoDatabaseAdapter } from '../database-adapter'
import { IResult } from '../election-office/types'
import { proposalIdSchema } from './shared-logic'

export interface ISubmitInteraction {
  block: number
  custodian: string
  resultData: IResult
}

export class SubmitInteraction implements ISubmitInteraction {
  block: number
  custodian: string
  resultData: IResult

  public constructor(input: ISubmitInteraction) {
    this.block = input.block
    this.custodian = input.custodian
    this.resultData = input.resultData
  }

  public get id() {
    return `${this.resultData.proposalId}-${this.custodian}-${this.block}`
  }

  // TODO: Store validation errors in database (could be one table for all RMRK::DAO errors)
  public static async fromRemark(
    remark: Remark,
    db: IRmrkDaoDatabaseAdapter
  ): Promise<SubmitInteraction> {
    const [_prefix, _interactionType, _version, dataString] =
      remark.remark.split('::')

    // Validate remark
    validateRemarkDaoBase(remark.remark, INTERACTION_TYPES.SUBMIT)

    const data = SubmitInteraction.parseData(dataString)

    // Check that PROPOSAL exists
    const proposal = await db.getProposal(data.proposalId)
    if (!proposal) {
      throw new Error(`Proposal (${data.proposalId}) does not exist`)
    }

    // Check that proposal-custodian pair exists
    // TODO: Will need to update logic after implementing RECERTIFY as it will be possible for other CUSTODIAN to create SUBMIT interaction
    if (proposal.custodian !== remark.caller) {
      throw new Error(
        `PROPOSAL ${data.proposalId} does not list CUSTODIAN ${remark.caller}`
      )
    }

    // Check that CUSTODIAN exists
    const custodian = await db.getCustodian(remark.caller)
    if (!proposal) {
      throw new Error(`Proposal (${data.proposalId}) does not exist`)
    }

    // Check that the count object keys are listed in the proposal options
    for (const [option, value] of Object.entries(data.count)) {
      if (!(option in (proposal.options as ProposalOptions))) {
        throw new Error(
          `${option} not found in PROPOSAL ${proposal.id} options`
        )
      }
    }

    // Check that the winning options are included in the result's count object
    for (const option of data.winningOptions) {
      if (!(option in data.count)) {
        throw new Error(`${option} not found in RESULT count object`)
      }
    }

    return new SubmitInteraction({
      resultData: data,
      block: remark.block,
      custodian: remark.caller,
    })
  }

  /**
   * Parse data into payload object
   * @param {string} dataString
   * @returns {IResult}
   * @throws {Joi.ValidationError}
   */
  static parseData(dataString: string): IResult {
    const data = getRemarkData(dataString)
    const result = submitPayloadSchema.validate(data) // TODO: Consider passing just the data string after URIDecoding
    if (result.error) {
      throw result.error
    }
    return result.value
  }

  /**
   * Saves RESULT entity in consolidated data store and returns consolidated RESULT
   */
  async save(db: IRmrkDaoDatabaseAdapter) {
    return await db.saveResult(this)
  }
}

export const submitPayloadSchema = Joi.object<IResult>({
  proposalId: proposalIdSchema,
  count: Joi.custom(resultCountObjectValidator).required(),
  winningOptions: Joi.array().items(Joi.number().required()).required(),
  thresholdDenominator: Joi.number().required(),
  recertify: Joi.boolean().required(),
})
