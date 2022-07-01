#! /usr/bin/env node
import { stringToHex } from '@polkadot/util'
import fs from 'fs'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'

// @ts-ignore
import JSONStream from 'JSONStream'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { Consolidator, getRemarksFromBlocks } from 'rmrk-tools'
import { PgAdapter } from './pg-adapter'

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

const getRemarks = (
  inputData: any,
  prefixes: string[],
  ss58Format?: number
): Remark[] => {
  let blocks = inputData

  return getRemarksFromBlocks(blocks, prefixes, ss58Format)
}

const consolidate = async () => {
  const ws = process.env.KUSAMA_NODE_WS || ''
  const api = await getApi(ws)

  console.log('got api connection')

  const prefixes = prefixToArray('0x726d726b,0x524d524b')

  const systemProperties = await api.rpc.system.properties()
  const { ss58Format: chainSs58Format } = systemProperties.toHuman()

  const ss58Format = (chainSs58Format as number) || 2

  const file = process.env.RMRK_1_DUMP_FILE
  const out = process.env.RMRK_1_CONSOLIDATED_FILE

  if (!file) {
    console.error('File path must be provided')
    process.exit(1)
  }
  // Check the JSON file exists and is reachable
  try {
    fs.accessSync(file, fs.constants.R_OK)
  } catch (e) {
    console.error('File is not readable. Are you providing the right path?')
    process.exit(1)
  }
  let rawdata = await appendPromise(file)

  console.log(`Loaded ${rawdata.length} blocks with remark calls`)

  const remarks = getRemarks(rawdata, prefixes, ss58Format)
  console.log('got remarks', remarks.length)
  const consolidator = new Consolidator(ss58Format, new PgAdapter())
  let result = await consolidator.consolidate(remarks)

  //@ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString()
  }
  const lastBlock = rawdata[rawdata.length - 1]?.block || 0
  fs.writeFileSync(`${out}`, JSON.stringify({ ...result, lastBlock }))
  process.exit(0)
}

consolidate()
