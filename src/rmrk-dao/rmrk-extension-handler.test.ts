import { getRemarksFromBlocks } from 'rmrk-tools'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import { KUSAMA_SS58_FORMAT } from '../app-constants'
import { appendPromise, prefixes } from '../rmrk2/utils'
import { MemoryDatabaseAdapter } from './database-adapter/memory-database-adapter'
import { RmrkExtensionHandler } from './rmrk-extension-handler'

describe('Process RMRKDAO remarks from block data', () => {
  test('successfully parse PROPOSE interaction', async () => {
    const filePath = 'src/__tests__/data/block_with_propose_interaction.json'
    const rawBlocks = await appendPromise(filePath)
    const remarks = getRemarksFromBlocks(
      rawBlocks,
      prefixes,
      KUSAMA_SS58_FORMAT
    )
    const db = new MemoryDatabaseAdapter()
    db.custodians['J1DxVnsH7Pb2bvvUo771EFv9eAwyjoAasFvLvDyBQCg2XjZ'] = {
      id: 'J1DxVnsH7Pb2bvvUo771EFv9eAwyjoAasFvLvDyBQCg2XjZ',
      voteFee: '0',
      proposalFee: '0',
      recertifyFee: '0',
      block: 0,
      maxOptions: 10,
      changes: [],
    }
    db.blockTimes[14252786] = 1661983080000

    const handler = new RmrkExtensionHandler(db)
    const remark = remarks[0]

    await handler.processRemark(remark)

    expect(db.proposals['p4P54CxI6J']).toMatchInlineSnapshot(`
Object {
  "block": 14252786,
  "collections": Array [
    "e0b9bdcc456a36497a-KANBACK",
  ],
  "custodian": "J1DxVnsH7Pb2bvvUo771EFv9eAwyjoAasFvLvDyBQCg2XjZ",
  "description": "There are many opportunities being a whale in the web3 world. With all of this power, why not go to Mars or at least to the Moon?",
  "electorate": false,
  "endDate": 1661983083000,
  "id": "p4P54CxI6J",
  "name": "Should we start a space flight busines?",
  "nftWeight": true,
  "options": Array [
    "yes",
    "no",
    "maybe next summer",
  ],
  "owner": "CaKWz5omakTK7ovp4m3koXrHyHb7NG3Nt7GENHbviByZpKp",
  "passingThreshold": undefined,
  "snapshot": 1661983083000,
  "startDate": 1661983083000,
}
`)
  })

  test('successfully parse PROPOSE interaction', async () => {
    const filePath = 'src/__tests__/data/block_with_register_interaction.json'
    const rawBlocks = await appendPromise(filePath)
    const remarks = getRemarksFromBlocks(
      rawBlocks,
      prefixes,
      KUSAMA_SS58_FORMAT
    )
    const db = new MemoryDatabaseAdapter()
    const handler = new RmrkExtensionHandler(db)
    const remark = remarks[0]

    await handler.processRemark(remark)

    // TODO: Consider making sure that fee properties return BigInt from Postgres database
    expect(db.custodians['DaoQkNgxobgpKfd9NmETnWe6FCfDERduSTR2YiFDRGKvL17'])
      .toMatchInlineSnapshot(`
Object {
  "block": 14255141,
  "changes": Array [],
  "id": "DaoQkNgxobgpKfd9NmETnWe6FCfDERduSTR2YiFDRGKvL17",
  "maxOptions": 100,
  "proposalFee": 110000000000n,
  "recertifyFee": 1000000000000n,
  "voteFee": 50000000000n,
}
`)
  })
})
