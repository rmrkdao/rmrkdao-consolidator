import { ApiPromise, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { KUSAMA_SS58_FORMAT } from '../../app-constants'
import { ResultEntity } from '../entities/result'
import { IResult } from './types'

export class SecretaryOfState {
  private constructor(private keyringPair: KeyringPair) {}

  public static async create(input: { secretSeed: string }) {
    const { secretSeed } = input

    // Construct the keyring after the API (crypto has an async init)
    const keyring = new Keyring({
      type: 'sr25519',
      ss58Format: KUSAMA_SS58_FORMAT, // Must be in Kusama format
    })

    const keyringPair = keyring.addFromUri(secretSeed)

    return new SecretaryOfState(keyringPair)
  }

  public getKusamaAddress() {
    return this.keyringPair.address
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics#remarkremark-bytes
   * @param resultData
   */
  async submitResult(api: ApiPromise, resultData: IResult): Promise<string> {
    const resultEntity = new ResultEntity(resultData)
    const remarkString = resultEntity.toRemark()
    const transfer = api.tx.system.remark(remarkString)

    // Sign and send the transaction using our account
    return new Promise<string>(async (resolve, reject) => {
      const unsubscribe = await transfer.signAndSend(
        this.keyringPair,
        (result) => {
          const { events = [], status, txHash } = result

          if (status.isFinalized) {
            unsubscribe()

            // Check if the extrinsic succeeded
            const succeeded = events.some((event) => {
              const { section, method } = event.event
              return section === 'system' && method === 'ExtrinsicSuccess'
            })

            if (succeeded) {
              resolve(txHash.toHex())
            } else {
              console.warn(
                'Transaction extrinsic failed',
                JSON.stringify(result)
              )
              reject(new Error('Transaction extrinsic failed'))
            }
          }
        }
      )
    })
  }
}
