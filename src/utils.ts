import { encodeAddress } from '@polkadot/keyring'
import { CustomValidator } from 'joi'
import {
  INTERACTION_TYPES,
  KUSAMA_SS58_FORMAT,
  RMRK_DAO_PREFIX,
  VERSION,
} from './app-constants'
import { IResult } from './rmrk-dao/election-office/types'

/**
 * Throws if the RMRK_DAO base is not valid
 * @param {string} remark
 * @param {INTERACTION_TYPES} targetInteraction
 * @throws {Error}
 */
export const validateRemarkDaoBase = (
  remark: string,
  targetInteraction: INTERACTION_TYPES
) => {
  const [prefix, interaction, version] = remark.split('::')
  if (prefix.toUpperCase() !== RMRK_DAO_PREFIX) {
    throw new Error(`Invalid remark - does not start with ${RMRK_DAO_PREFIX}`)
  }
  if (interaction !== targetInteraction) {
    throw new Error(
      `The op code needs to be ${targetInteraction}, but it is ${interaction}`
    )
  }
  if (version !== VERSION) {
    throw new Error(
      `This remark was issued under version ${version} instead of ${VERSION}`
    )
  }
}

/**
 * Takes an address in some format and encodes it into a Kusama formatted address
 * @param {string} address
 * @returns  {string} Kusama encoded address
 */
export const kusamaEncodeAddress = (address: string) => {
  return encodeAddress(address, KUSAMA_SS58_FORMAT)
}

/**
 * Custom Joi validator that checks if the number is a u128 (Rust type) and
 * returns the value as a BigInt
 * @param {any} value
 * @param _helpers
 * @returns {string}
 * @throws
 */
export const u128Validator: CustomValidator = (
  value: any,
  _helpers
): string => {
  let int: BigInt | undefined
  try {
    int = BigInt(value)
  } catch (e) {
    throw new Error('Value must be able to be parsed as BigInt')
  }
  if (int >= BigInt('340282366920938463463374607431768211456')) {
    throw new Error('Value is larger than max u128')
  }
  if (int < BigInt(0)) {
    throw new Error('Value cannot be negative')
  }
  return int.toString()
}

/**
 * Custom Joi validator that checks that the input value is an address and
 * returns it as a Kusama formatted address
 * @param {any} value
 * @param _helpers
 * @returns {string} Kusama formatted address
 * @throws
 */
export const kusamaAddressValidator: CustomValidator = (value, _helpers) => {
  return kusamaEncodeAddress(value)
}

/**
 * Custom Joi validator that checks that the input value is an object of with numeric strings
 * as keys and strings as values
 * @param {any} value
 * @param _helpers
 */
export const proposalOptionsValidator: CustomValidator = (value, _helpers) => {
  // Make sure it is an object
  if (!isObject(value)) {
    throw new Error('Value must be a object dictionary')
  }

  let count = 0
  for (const key of Object.keys(value)) {
    count++

    if (!isIntegerString(key)) {
      throw new Error('Keys must be non-negative integer string')
    }

    // Make sure the values are strings
    const option = value[key]
    if (typeof option !== 'string') {
      throw new Error('Option values must be strings')
    }
    if (option.length > 10000) {
      throw new Error('Options cannot have a text length larger than 10000')
    }
  }
  if (count < 2) {
    throw new Error('Must have at least 2 options')
  }

  return value
}

/**
 * Custom Joi validator that checks that the input value is an object of with numeric strings
 * as keys and numbers as values
 * @param {any} value
 * @param _helpers
 * @return {IResult['count']}
 */
export const resultCountObjectValidator: CustomValidator = (
  value: any,
  _helpers
): IResult['count'] => {
  // Make sure it is an object
  if (!isObject(value)) {
    throw new Error('Value must be a object dictionary')
  }

  for (const key of Object.keys(value)) {
    if (!isIntegerString(key)) {
      throw new Error('Keys must be non-negative integer string')
    }

    // Make sure the values are numbers
    const option = value[key]
    if (typeof option !== 'number') {
      throw new Error('Option values must be numbers')
    }
  }

  return value
}

export function isObject(value: any): value is Object {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Make sure the keys are numeric strings no larger than max int
export function isIntegerString(value: string): boolean {
  if (value.includes('.')) {
    return false
  }
  const x = parseInt(value)
  if (!Number.isInteger(x) || x < 0) {
    return false
  }

  return true
}
