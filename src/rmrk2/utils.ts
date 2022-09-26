import { stringToHex } from '@polkadot/util'
import {
  Collection2,
  LatestConsolidatingRmrkStatus,
  Prisma,
} from '@prisma/client'
import fs from 'fs'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
// @ts-ignore
import JSONStream from 'JSONStream'
import _ from 'lodash'
import { Change } from 'rmrk-tools/dist/changelog'
import { NFTConsolidated } from 'rmrk-tools/dist/tools/consolidator/consolidator'
import { LISTENING_PREFIX_LIST } from '../app-constants'
import { prisma } from '../db'
import '../patch'

export const prefixToArray = (prefix: string): string[] =>
  prefix.split(',').map((item) => {
    if (item.indexOf('0x') === 0) {
      return item
    }
    return stringToHex(item)
  })

export const appendPromise = (appendFilePath: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    try {
      const appendFileStream: any[] = []
      const readStream = fs.createReadStream(appendFilePath)
      const parseStream = JSONStream.parse('*')
      parseStream.on('data', (fileChunk: Record<string, unknown>) => {
        if (fileChunk) {
          appendFileStream.push(fileChunk)
        }
      })

      readStream.pipe(parseStream)

      readStream.on('finish', async () => {
        resolve(appendFileStream)
      })

      readStream.on('end', async () => {
        resolve(appendFileStream)
      })

      readStream.on('error', (error) => {
        reject(error)
      })
    } catch (error: any) {
      console.error(error)
      reject(error)
    }
  })

export const prefixes = prefixToArray(LISTENING_PREFIX_LIST.join(','))

/** Filter remarks in-place */
export function filterByUnProcessedRemarks(
  remarks: Remark[],
  lastTriedBlock: number,
  lastTriedOffset: number,
  lastTriedStatus: LatestConsolidatingRmrkStatus
) {
  // Find the index of the last tried remark
  const lastTriedRemarkIndex = remarks.findIndex(
    (remark) =>
      remark.block === lastTriedBlock && remark.offset === lastTriedOffset
  )

  // Bail early if index not found
  if (lastTriedRemarkIndex === -1) {
    return
  }

  if (lastTriedStatus === LatestConsolidatingRmrkStatus.complete) {
    // Remove previously processed remarks including the latest tried (as it has been completed)
    remarks.splice(0, lastTriedRemarkIndex + 1)
    // Remove previously processed remarks not including the latest tried (as it has not been completed)
  } else if (lastTriedStatus === LatestConsolidatingRmrkStatus.processing) {
    remarks.splice(0, lastTriedRemarkIndex)
  } else {
    throw new Error(
      lastTriedStatus != ''
        ? `Incorrect status: ${lastTriedStatus}!`
        : 'Status is not set!'
    )
  }
}

// TODO: Consider creating a single transaction for all of these changes and truncating the history2 table
export const restoreFromHistory = async () => {
  // Get array of changes from history table in descending time order
  const changes = await prisma.history2.findMany({
    orderBy: { id: 'desc' },
  })

  // Undo the change based on the operation
  for (const change of changes) {
    let processed = 0
    const table = `"${change.schemaName}"."${change.tableName}"`

    switch (change.operation) {
      case 'INSERT':
        if (hasId(change.newValue)) {
          const currentId = change.newValue.id

          processed = await prisma.$executeRaw`
            delete from ${Prisma.raw(table)} where id = ${currentId};
          `
        }
        break

      case 'UPDATE':
        if (hasId(change.oldValue) && hasId(change.newValue)) {
          const currentId = change.newValue.id
          // @ts-ignore
          const columns = Object.keys(change.oldValue)
            .map((x) => `"${x}"`)
            .join(',')

          processed = await prisma.$executeRaw`
              update ${Prisma.raw(table)} set (${Prisma.raw(columns)}) = (
                (
                  select ${Prisma.raw(
                    columns
                  )} from jsonb_populate_record(null::${Prisma.raw(table)}, ${
            change.oldValue
          }))
                )
                where id = ${currentId};
            `
        }
        break

      case 'DELETE':
        processed = await prisma.$executeRaw`
              insert into ${Prisma.raw(
                table
              )} select * from jsonb_populate_record(null::${Prisma.raw(
          table
        )}, ${change.oldValue});
            `
        break

      default:
        break
    }

    if (!processed) {
      throw new Error(
        `Unable to undo ${change.operation} where history2.id = ${change.id}`
      )
    }

    console.log('restored history:', JSON.stringify(change))
  }

  await prisma.history2.deleteMany()
}

export function hasId(input: any): input is { id: string } {
  return !!input && typeof input === 'object' && 'id' in input
}

export function batch<T>(elements: T[] | Object, size: number) {
  const array = Array.isArray(elements) ? elements : _.values(elements)
  const batches = []
  while (array.length) {
    const batch = array.splice(0, size)
    batches.push(batch)
  }
  return batches
}

/**
 * Get the issuer of a collection at a specific block
 * @param {Collection2} collection
 * @param {number} block
 * @returns {string | null} the issuer's address or null if the collection was created before the PROPOSAL
 * @throws {Error} when the collection's issuer was not able to be determined
 */
export const getIssuerAtBlock = (
  collection: Collection2,
  block: number
): string | null => {
  // Check that the collection was created before the PROPOSAL
  if (collection.block > block) {
    return null
  }

  const sortedChanges = (collection.changes as Change[]).sort(
    (a, b) => a.block - b.block
  )
  const issuerChanges = sortedChanges.filter(
    (change) => change.field === 'issuer'
  )

  // If no changes, then the current issuer of the collection is considered the owner of the collection at the specified block
  if (!issuerChanges?.length) {
    return collection.issuer
  }

  // Find the changes that have ocurred before or at the block
  const issuerChangesUpUntilBlockInclusive = issuerChanges.filter(
    (change) => change.block <= block
  )

  // If there are changes at or before the block, then the last change's new value in that group contains the issuer
  if (issuerChangesUpUntilBlockInclusive.length > 0) {
    return issuerChangesUpUntilBlockInclusive.at(-1)?.new
  }

  // Find the changes that have ocurred after the block
  const issuerChangesAfterBlock = issuerChanges.filter(
    (change) => change.block > block
  )

  // If there are changes after the block, then the first change's old value in that group contains the issuer
  if (issuerChangesAfterBlock.length > 0) {
    return issuerChangesAfterBlock[0].old
  }

  throw new Error(
    `Not able to determine collection ${collection.id} issuer at block ${block}`
  )
}

/**
 * Get the root owner of an NFT at a given block number
 * @todo test
 * @param {NFTConsolidated} nft
 * @param {number} block
 * @returns {string | null}
 */
export const getNftRootOwnerAtBlock = (
  nft: NFTConsolidated,
  block: number
): string | null => {
  // Check that the nft was created before the VOTE
  if (nft.block > block) {
    return null
  }

  const sortedChanges = (nft.changes as Change[]).sort(
    (a, b) => a.block - b.block
  )
  const nftChanges = sortedChanges.filter(
    (change) => ['owner', 'rootowner'].includes(change.field) // TODO: Check this, might need to bring in owner and check for if it is a Kusama address or NFT id
  )

  // If no changes, then the current issuer of the nft is considered the owner of the nft at the specified block
  if (!nftChanges?.length) {
    return nft.rootowner
  }

  // Find the changes that have ocurred before or at the block
  const rootOwnerChangesUpUntilBlockInclusive = nftChanges.filter(
    (change) => change.block <= block
  )

  // If there are changes at or before the block, then the last change's new value in that group contains the rootowner
  if (rootOwnerChangesUpUntilBlockInclusive.length > 0) {
    return rootOwnerChangesUpUntilBlockInclusive.at(-1)?.new
  }

  // Find the changes that have ocurred after the block
  const rootownerChangesAfterBlock = nftChanges.filter(
    (change) => change.block > block
  )

  // If there are changes after the block, then the first change's old value in that group contains the rootowner
  if (rootownerChangesAfterBlock.length > 0) {
    return rootownerChangesAfterBlock[0].old
  }

  throw new Error(
    `Not able to determine nft ${nft.id} rootowner at block ${block}`
  )
}

/**
 * Check if an NFT is burned at the block number in question
 * @todo Test
 * @param {NFTConsolidated} nft
 * @param {number} block
 * @returns {boolean}
 */
export const isNftBurnedAtBlock = (
  nft: NFTConsolidated,
  block: number
): boolean => {
  if (nft.block > block) {
    return false
  }

  // If the nft is currently not burned then it wasn't burned in the past
  if (!nft.burned) {
    return false
  }

  const sortedChanges = (nft.changes as Change[]).sort(
    (a, b) => a.block - b.block
  )
  const burnedChanges = sortedChanges.filter(
    (change) => change.field === 'burned'
  )

  // Find the changes that have ocurred before or at the block
  const burnedChangesUpUntilBlockInclusive = burnedChanges.filter(
    (change) => change.block <= block
  )

  // If there are changes at or before the block, then the NFT was burned at the block in question
  if (burnedChangesUpUntilBlockInclusive.length > 0) {
    return true
  }

  return false
}
