import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'

/**
 * Get secret seed for importing Kusama wallet
 * @param {GetSecretInput} input
 * @returns {string}
 * @throws
 */
export async function getSecretSeed({
  region: aws_region,
  secretId: secret_id,
}: GetSecretInput): Promise<string> {
  const client = new SecretsManagerClient({ region: aws_region })
  const command = new GetSecretValueCommand({ SecretId: secret_id })
  const response = await client.send(command)

  if (response.SecretBinary !== undefined) {
    // TODO: Decode base64 string
    let buff = Buffer.from(response.SecretBinary).toString('base64')
    return buff
  } else {
    return response.SecretString || ''
  }
}

interface GetSecretInput {
  region: string
  secretId: string
}
