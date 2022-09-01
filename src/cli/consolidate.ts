import fs from 'fs'
import { getApiWithReconnect } from 'rmrk-tools'
import { KUSAMA_NODE_WS } from '../app-constants'
import { prisma } from '../db'
import { consolidate } from '../rmrk2/consolidator'
import { appendPromise } from '../rmrk2/utils'

const main = async () => {
  const file = process.env.RMRK_2_DUMP_FILE

  const api = await getApiWithReconnect([KUSAMA_NODE_WS])
  console.log('got api connection')

  try {
    if (!file) {
      console.error('File path must be provided')
      process.exit(1)
    }
    // Check the JSON file exists and is reachable
    try {
      fs.accessSync(file, fs.constants.R_OK)
    } catch (e) {
      throw new Error('File is not readable. Are you providing the right path?')
    }

    const data = await appendPromise(file)

    console.log(`Loaded ${data.length} blocks with remark calls`)

    const systemProperties = await api.rpc.system.properties()
    const { ss58Format: chainSs58Format } = systemProperties.toHuman()

    const ss58Format = (chainSs58Format as number) || 2

    await consolidate(data, ss58Format)
  } catch (e) {
    console.error(e)
  } finally {
    await api.disconnect()
    await prisma.$disconnect()
    process.exit(0)
  }
}

main().catch(console.error)
