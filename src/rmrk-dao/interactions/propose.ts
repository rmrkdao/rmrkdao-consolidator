import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import Joi from 'joi'
import { getRemarkData } from 'rmrk-tools'
import {
  kusamaAddressValidator,
  kusamaEncodeAddress,
  proposalOptionsValidator,
  validateRemarkDaoBase,
} from '../../utils'
import { INTERACTION_TYPES } from '../../app-constants'
import {
  IProposal,
  IProposePayload,
  isIValidatedPayload,
  IValidatedProposePayload,
  ProposalOptions,
} from '../../types'
import { getIssuerAtBlock } from '../../rmrk2/utils'
import { IRmrkDaoDatabaseAdapter } from '../database-adapter/'

export class Propose implements IProposal {
  block: number
  id: string
  custodian: string // TODO: Consider checking that the custodian already exist and is active?
  name: string
  description: string
  collections: string[] // TODO: Should there be a max number of collections?
  options: ProposalOptions
  passingThreshold: number | null
  startDate: number
  snapshot: number
  endDate: number
  nftWeight: boolean
  electorate: boolean
  owner: string

  constructor(block: number, owner: string, payload: IValidatedProposePayload) {
    this.block = block
    this.owner = owner
    this.id = payload.id
    this.custodian = payload.custodian
    this.name = payload.name
    this.description = payload.description
    this.collections = payload.collections
    this.options = payload.options
    this.passingThreshold = payload.passingThreshold
    this.startDate = payload.startDate
    this.snapshot = payload.snapshot
    this.endDate = payload.endDate
    this.nftWeight = payload.nftWeight
    this.electorate = payload.electorate
  }

  // TODO: Store validation errors in database (could be one table for all RMRK::DAO errors)
  static async fromRemark(
    remark: Remark,
    db: IRmrkDaoDatabaseAdapter
  ): Promise<Propose> {
    const [_prefix, _interactionType, _version, dataString] =
      remark.remark.split('::')

    // Validate remark
    // TODO: Double check that all of the validations are enforced in code
    validateRemarkDaoBase(remark.remark, INTERACTION_TYPES.PROPOSE)

    const data = Propose.parseData(dataString)

    // Check that PROPOSAL's id is unique
    if (await db.doesProposalExist(data.id)) {
      throw new Error(`Non-unique PROPOSAL id ${data.id}`)
    }

    // Check that Custodian exists
    const custodian = await db.getCustodian(data.custodian)
    if (!custodian) {
      throw new Error(`Custodian (${data.custodian}) does not exist`)
    }

    // Check that the custodian's max options rule is honored
    const optionLength = Object.keys(data.options).length
    if (optionLength > custodian.maxOptions) {
      throw new Error(
        `CUSTODIAN only allows a max of ${custodian.maxOptions} but the PROPOSAL has ${optionLength}`
      )
    }

    // Validate that caller is authorized to create this proposal
    // Check that the correct amount of payment was sent to the custodian
    // @see https://polkadot.js.org/docs/substrate/extrinsics#transferdest-multiaddress-value-compactu128
    const validBalanceTransfer = remark.extra_ex
      ?.filter((el) => el.call === 'balances.transfer')
      .find((el) => {
        const [owner, planck] = el.value.split(',') // Value is the concatenated args
        const ownerKusamaAddress = kusamaEncodeAddress(owner)
        return (
          ownerKusamaAddress === data.custodian &&
          BigInt(planck) >= BigInt(custodian.proposalFee)
        )
      })
    if (!validBalanceTransfer) {
      throw new Error('Missing valid balance transfer')
    }

    // Check that the caller was the owner of the collection before the block the PROPOSAL was added
    const collections = await db.getCollections(data.collections)
    for (let collection of collections) {
      const issuer = getIssuerAtBlock(collection, remark.block)
      if (!issuer) {
        throw new Error(`Collection ${collection.id} does not exist yet`)
      }
      // Assumes that the remark.caller is in Kusama format
      if (issuer != remark.caller) {
        throw new Error(
          `PROPOSAL caller was not the issuer of collection ${collection.id} at time of PROPOSE interaction`
        )
      }
    }

    // Get the unix timestamp milliseconds of the remark's block
    const remarkBlockTimestamp = await db.getBlockTime(remark.block)

    if (remarkBlockTimestamp === null) {
      throw new Error(`Unable to find block time for block ${remark.block}`)
    }

    // Set dates if optional dates where not set
    data.startDate = data.startDate || remarkBlockTimestamp
    data.snapshot = data.snapshot || data.endDate

    // Check that the start time is before the end time
    if (data.startDate > data.endDate) {
      throw new Error('Start time cannot be after end time')
    }

    // Check that the proposal startDate is not before the remark block
    if (data.startDate < remarkBlockTimestamp) {
      throw new Error(`Start time cannot be before remark's block time`)
    }

    // TODO: Check that: must be at least 1 minute after startDate and at most 365 days after startDate

    if (isIValidatedPayload(data)) {
      // TODO: Consider removing isIValidatedPayload method and instead type cast
      return new Propose(remark.block, remark.caller, data)
    } else {
      throw new Error('Data is not validated payload')
    }
  }

  /**
   * Saves PROPOSAL entity in consolidated data store and returns consolidated PROPOSAL
   */
  async save(db: IRmrkDaoDatabaseAdapter) {
    await db.saveProposal(this)
  }

  /**
   * Parse data into payload object
   * @param {string} dataString
   * @returns {IProposePayload}
   * @throws {Joi.ValidationError}
   */
  static parseData(dataString: string): IProposePayload {
    const data = getRemarkData(dataString)
    const result = proposePayloadSchema.validate(data) // TODO: Consider passing just the data string after URIDecoding
    if (result.error) {
      throw result.error
    }
    return result.value
  }
}

export const proposePayloadSchema = Joi.object<IProposePayload>({
  id: Joi.string().alphanum().length(10).required(),
  custodian: Joi.string().custom(kusamaAddressValidator).required(),
  name: Joi.string().max(10000).required(),
  description: Joi.string().max(10000).required().allow(''),
  collections: Joi.array().items(Joi.string().required()).required(),
  options: Joi.object().custom(proposalOptionsValidator).required(),
  passingThreshold: Joi.number().min(0).max(100).optional(),
  startDate: Joi.number().optional(),
  snapshot: Joi.number().optional(),
  endDate: Joi.number().required(),
  nftWeight: Joi.boolean().required(),
  electorate: Joi.boolean().required(),
})
