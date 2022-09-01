import { LatestConsolidatingRmrkStatus } from '@prisma/client'
import { getRemarksFromBlocks } from 'rmrk-tools'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import { KUSAMA_SS58_FORMAT } from '../app-constants'
import { appendPromise, filterByUnProcessedRemarks, prefixes } from './utils'

let _rawBlocks: any[]
let _remarks: Remark[]

beforeAll(async () => {
  const filePath = 'src/__tests__/data/rmrk_2_dump_5_raw_blocks.json'
  _rawBlocks = await appendPromise(filePath)
  _remarks = getRemarksFromBlocks(_rawBlocks, prefixes, KUSAMA_SS58_FORMAT)
})

test('All remark offsets are sequential inside a block', () => {
  const remarks = _remarks.slice(0)
  let x = -1
  let lastOffset = -1
  let lastBlock = -1
  let sequential = true
  for (const remark of remarks) {
    if (remark.block < lastBlock) {
      sequential = false
      break
    } else if (remark.block === lastBlock) {
      if (remark.offset <= lastOffset || remark.offset !== lastOffset + 1) {
        sequential = false
        break
      }
    } else if (remark.block > lastBlock) {
      lastOffset = -1
      if (remark.offset !== 0) {
        sequential = false
        break
      }
    }

    lastBlock = remark.block
    lastOffset = remark.offset
  }
  expect(sequential).toBe(true)
})

describe('Can filter remarks in place', () => {
  test('when last tried is not found', async () => {
    const remarks = _remarks.slice(0)

    filterByUnProcessedRemarks(
      remarks,
      0,
      0,
      LatestConsolidatingRmrkStatus.processing
    )

    expect(remarks).toHaveLength(4006)
    expect(remarks[0].block).toBe(8788585)
    expect(remarks[0].offset).toBe(0)
  })

  test('when last tried is processing and is the first in block', async () => {
    const remarks = _remarks.slice(0)

    filterByUnProcessedRemarks(
      remarks,
      8788585,
      0,
      LatestConsolidatingRmrkStatus.processing
    )

    expect(remarks).toHaveLength(4006)
    expect(remarks[0].block).toBe(8788585)
    expect(remarks[0].offset).toBe(0)
  })

  test('one less when last tried is complete and is the first in block', async () => {
    const remarks = _remarks.slice(0)

    filterByUnProcessedRemarks(
      remarks,
      8788585,
      0,
      LatestConsolidatingRmrkStatus.complete
    )

    expect(remarks).toHaveLength(4006 - 1)
    expect(remarks[0].block).toBe(8788585)
    expect(remarks[0].offset).toBe(1)
  })

  test('when last tried is processing and is the last in block', async () => {
    const remarks = _remarks.slice(0)

    filterByUnProcessedRemarks(
      remarks,
      8788585,
      5,
      LatestConsolidatingRmrkStatus.processing
    )

    expect(remarks).toHaveLength(4006 - 5)
    expect(remarks[0].block).toBe(8788585)
    expect(remarks[0].offset).toBe(5)
  })

  test('when last tried is complete and is the last in block', async () => {
    const remarks = _remarks.slice(0)

    filterByUnProcessedRemarks(
      remarks,
      8788585,
      5,
      LatestConsolidatingRmrkStatus.complete
    )

    expect(remarks).toHaveLength(4006 - 6)
    expect(remarks[0].block).toBe(8788586)
    expect(remarks[0].offset).toBe(0)
  })
})
