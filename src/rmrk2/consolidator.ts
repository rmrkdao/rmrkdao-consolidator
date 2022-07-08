import '../patch'
import fs from 'fs'

import { Consolidator } from 'rmrk-tools'
import { PgAdapter } from './pg-adapter'
import {
  appendPromise,
  filterByUnProcessedRemarks,
  getApi,
  getRemarks,
  prefixes,
} from './utils'
import { prisma } from '../db'

const consolidate = async () => {
  const ws = process.env.KUSAMA_NODE_WS || ''
  const api = await getApi(ws)

  console.log('got api connection')

  const systemProperties = await api.rpc.system.properties()
  const { ss58Format: chainSs58Format } = systemProperties.toHuman()

  const ss58Format = (chainSs58Format as number) || 2

  const file = process.env.RMRK_2_DUMP_FILE
  const out = process.env.RMRK_2_CONSOLIDATED_FILE

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

  // Get the latest consolidation info
  // TODO: Confirm assumption that this will throw error when database is not available
  const consolidationInfo = await prisma.consolidationInfo.findUnique({
    where: { version: '2.0.0' },
  })
  if (consolidationInfo) {
    // Filters in place
    filterByUnProcessedRemarks(
      remarks,
      consolidationInfo.latestBlock,
      consolidationInfo.latestRmrkOffset,
      consolidationInfo.status
    )
  }
  console.log('got remarks', remarks.length)
  const pgAdapter = new PgAdapter()
  const consolidator = new Consolidator(ss58Format, pgAdapter)
  let result = await consolidator.consolidate(remarks)

  const lastBlock = rawdata[rawdata.length - 1]?.block || 0
  fs.writeFileSync(`${out}`, JSON.stringify({ ...result, lastBlock }))
  await api.disconnect()
  process.exit(0)
}

consolidate()
