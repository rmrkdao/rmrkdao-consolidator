import { getSecretSeed } from './helpers'
import { SecretaryOfState } from './secretary-of-state'

const SECRET_SEED_ID = process.env.SECRET_SEED_ID || ''
const AWS_REGION = process.env.AWS_REGION || ''
const CUSTODIAN_ADDRESS = process.env.CUSTODIAN_ADDRESS || 'missing-address'

test('should create address from secret', async () => {
  const secret = await getSecretSeed({
    region: AWS_REGION,
    secretId: SECRET_SEED_ID,
  })

  expect(secret).toBeTruthy()

  const secretary = await SecretaryOfState.create({ secretSeed: secret })
  const address = secretary.getKusamaAddress()

  expect(address).toBe(CUSTODIAN_ADDRESS)
})
