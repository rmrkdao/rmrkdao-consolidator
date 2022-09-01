import { ApiPromise } from '@polkadot/api'
import { prisma } from '../db'

/**
 * Save block time to the database
 * @param {ApiPromise} api
 * @param {number} blockNumber
 * @returns {Promise<number>}
 * @throws
 */
export async function getAndSaveBlockTime(
  api: ApiPromise,
  blockNumber: number
): Promise<number> {
  const unixMilliseconds = await getBlockTime(api, blockNumber)
  await saveBlockTime(blockNumber, unixMilliseconds)
  return unixMilliseconds
}

/**
 * Save block time to database
 * TODO: Consider moving this to a database adapter
 * @param {number} blockNumber
 * @param {number} blockNumber
 */
export async function saveBlockTime(
  blockNumber: number,
  unixMilliseconds: number
) {
  await prisma.blockTime.upsert({
    where: { block: blockNumber },
    create: { block: blockNumber, unixMilliseconds },
    update: { block: blockNumber, unixMilliseconds },
  })
}

/**
 * Get block timestamp from the block's timestamp extrinsic
 * @param {ApiPromise} api
 * @param {number} blockNumber
 * @returns {Promise<number>} unix time in milliseconds
 * @throws
 * @see https://github.com/polkadot-js/api/issues/2603#issuecomment-692085113
 */
export async function getBlockTime(
  api: ApiPromise,
  blockNumber: number
): Promise<number> {
  const blockHash = await api.rpc.chain.getBlockHash(blockNumber)
  const signedBlock = await api.rpc.chain.getBlock(blockHash)

  const timeArg =
    signedBlock.block.extrinsics.find(
      ({ method: { method, section } }) =>
        section === 'timestamp' && method === 'set'
    )?.method.args?.[0] || undefined

  if (timeArg === undefined) {
    throw new Error('Unable to determine block timestamp!')
  }

  const unixTime = parseFloat(timeArg.toString())

  if (isNaN(unixTime)) {
    throw new Error(`Unable to parse block ${blockNumber} timestamp`)
  }

  return unixTime
}
