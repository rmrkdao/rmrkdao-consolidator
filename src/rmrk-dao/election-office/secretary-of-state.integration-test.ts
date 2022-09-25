import { ApiPromise } from '@polkadot/api'
import { getApiWithReconnect } from 'rmrk-tools'
import { SecretaryOfState } from './secretary-of-state'
import { IResult } from './types'

jest.setTimeout(5 * 60 * 1000)

// Need to make these env variables available before running test
const SECRET_SEED: string = process.env.SECRET_SEED || ''
const endpoint: string | undefined = process.env.KUSAMA_NODE_WS

let api: ApiPromise
let secretaryOfState: SecretaryOfState

beforeAll(async () => {
  api = await getApiWithReconnect(endpoint ? [endpoint] : undefined)
  secretaryOfState = await SecretaryOfState.create(api, SECRET_SEED)
}, 30000)

afterAll(async () => {
  await api.disconnect()
})

test('able to SUBMIT on-chain', async () => {
  const result: IResult = {
    proposalId: 'test',
    count: {
      '0': 1,
      '1': 2,
    },
    winningOptions: [1],
    thresholdDenominator: 3,
    recertify: false,
  }

  const hash = await secretaryOfState.submitResult(api, result)
  console.group('tx hash')
  console.log(hash)
  console.groupEnd()
})
