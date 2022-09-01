import { getApiWithReconnect } from 'rmrk-tools'
import { getBlockTime } from './block-time'
jest.setTimeout(30000)

// Brittle test as it depends on the availability of the public Kusama endpoint
if (process.env.RUN_BRITTLE_TESTS === 'true') {
  test('can get block time', async () => {
    const api = await getApiWithReconnect(['wss://kusama-rpc.polkadot.io'])
    const blockTime = await getBlockTime(api, 8788585)
    await api.disconnect()

    expect(blockTime).toBe(1628967570006)
  })
} else {
  test('empty test', () => {})
}
