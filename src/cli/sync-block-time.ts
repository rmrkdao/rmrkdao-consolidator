import arg from 'arg'
import { getApiWithReconnect, getLatestFinalizedBlock } from 'rmrk-tools'
import { KUSAMA_NODE_WS } from '../app-constants'
import '../patch'
import { getAndSaveBlockTime } from '../services/block-time'

const main = async () => {
  const args = arg({
    // Types
    '--start': Number, // Inclusive
    '--end': Number, // Inclusive
  })

  console.log(args)

  // Check args
  if (!args['--start']) {
    throw new Error('Missing --start argument')
  }

  try {
    const start = args['--start']
    let end = args['--end']

    const api = await getApiWithReconnect([KUSAMA_NODE_WS])

    if (end === undefined) {
      end = await getLatestFinalizedBlock(api)
    }

    console.log(
      `syncing block timestamps with database from block ${start} to ${end}`
    )

    for (let x = start; start <= end; x++) {
      await getAndSaveBlockTime(api, x)
      console.log(`saved block ${x}`)
    }
  } catch (err) {
    console.error(err)
  }
}

main()
