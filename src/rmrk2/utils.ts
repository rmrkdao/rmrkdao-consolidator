import { LatestConsolidatingRmrkStatus } from '@prisma/client'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { stringToHex } from '@polkadot/util'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import { getRemarksFromBlocks } from 'rmrk-tools'
// @ts-ignore
import JSONStream from 'JSONStream'
import fs from 'fs'
import '../patch'

export const prefixToArray = (prefix: string): string[] =>
  prefix.split(',').map((item) => {
    if (item.indexOf('0x') === 0) {
      return item
    }
    return stringToHex(item)
  })

export const getApi = async (wsEndpoint: string): Promise<ApiPromise> => {
  const wsProvider = new WsProvider(wsEndpoint)
  const api = ApiPromise.create({ provider: wsProvider })
  return api
}

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

export const prefixes = prefixToArray('0x726d726b,0x524d524b')

export const getRemarks = (
  inputData: any,
  prefixes: string[],
  ss58Format?: number
): Remark[] => {
  let blocks = inputData

  return getRemarksFromBlocks(blocks, prefixes, ss58Format)
}

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
