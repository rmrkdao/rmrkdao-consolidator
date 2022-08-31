import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import Joi from 'joi'
import { getRemarkData } from 'rmrk-tools'
import { u128Validator, validateRemarkDaoBase } from '../../utils'
import { INTERACTION_TYPES } from '../../app-constants'
import { ICustodian, IRegisterPayload } from '../../types'

export class Register implements ICustodian {
  block: number
  custodian: string // TODO: consider renaming
  proposalFee: string
  voteFee: string
  recertifyFee: string
  maxOptions: number

  constructor(block: number, custodian: string, payload: IRegisterPayload) {
    this.block = block
    this.custodian = custodian
    this.proposalFee = payload.proposalFee
    this.voteFee = payload.voteFee
    this.recertifyFee = payload.recertifyFee
    this.maxOptions = payload.maxOptions
  }

  static fromRemark(remark: Remark): Register {
    const [_prefix, _interactionType, _version, dataString] =
      remark.remark.split('::')
    // Validate remark
    validateRemarkDaoBase(remark.remark, INTERACTION_TYPES.REGISTER)
    let payload = Register.parseData(dataString)

    // Assumes that the remark.caller is in Kusama format
    return new Register(remark.block, remark.caller, payload)
  }

  /**
   * Parse data into payload object
   * @param {string} dataString
   * @returns {IRegisterPayload}
   * @throws {Joi.ValidationError}
   */
  static parseData(dataString: string): IRegisterPayload {
    const data = getRemarkData(dataString)
    const result = schema.validate(data) // TODO: Consider passing just the data string after URIDecoding
    if (result.error) {
      throw result.error
    }
    return result.value
  }
}

const schema = Joi.object<IRegisterPayload>({
  proposalFee: Joi.custom(u128Validator).required(), // TODO: @see https://github.com/adamsteeber/rmrkdao-spec/pull/7#issuecomment-1213517848
  voteFee: Joi.custom(u128Validator).required(),
  recertifyFee: Joi.custom(u128Validator).required(),
  maxOptions: Joi.number().integer().required(),
})
