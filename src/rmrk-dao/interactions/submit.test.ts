import { Custodian, Proposal } from '@prisma/client'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import {
  INTERACTION_TYPES,
  RMRK_DAO_PREFIX,
  VERSION,
} from '../../app-constants'
import { MemoryDatabaseAdapter } from '../database-adapter/memory-database-adapter'
import { SubmitInteraction } from './submit'

describe('parseData', () => {
  test('successfully parse SUBMIT data', () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: [0],
        thresholdDenominator: 1,
        recertify: false,
      })
    )

    const result = SubmitInteraction.parseData(dataString)

    expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "0": 1,
  },
  "proposalId": "1000000000",
  "recertify": false,
  "thresholdDenominator": 1,
  "winningOptions": Array [
    0,
  ],
}
`)
  })

  test('bad count object keys', () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          zero: 1,
        },
        winningOptions: [0],
        thresholdDenominator: 1,
        recertify: false,
      })
    )

    expect(() => {
      SubmitInteraction.parseData(dataString)
    }).toThrowError(
      '"count" failed custom validation because Keys must be non-negative integer string'
    )
  })

  test('bad count object values', () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': '9999999999999999999999999999999999999999999999',
        },
        winningOptions: [0],
        thresholdDenominator: 1,
        recertify: false,
      })
    )

    expect(() => {
      SubmitInteraction.parseData(dataString)
    }).toThrowError(
      '"count" failed custom validation because Option values must be numbers'
    )
  })

  test('use last entry for duplicate keys in count object', () => {
    const dataString = encodeURIComponent(
      `{"proposalId":"1000000000","count":{"0":1,"0":2},"winningOptions":[0],"thresholdDenominator":2,"recertify":false}`
    )

    const result = SubmitInteraction.parseData(dataString)

    expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "0": 2,
  },
  "proposalId": "1000000000",
  "recertify": false,
  "thresholdDenominator": 2,
  "winningOptions": Array [
    0,
  ],
}
`)
  })

  test('bad proposalId', () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1',
        count: {
          0: 1,
        },
        winningOptions: [0],
        thresholdDenominator: 1,
        recertify: false,
      })
    )

    expect(() => {
      SubmitInteraction.parseData(dataString)
    }).toThrowError('"proposalId" length must be 10 characters long')
  })

  test('winningOptions cannot have string elements', () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: ['0'],
        thresholdDenominator: 1,
        recertify: false,
      })
    )

    expect(() => {
      SubmitInteraction.parseData(dataString)
    }).toThrowError('"winningOptions[0]" must be a number')
  })

  test('winningOptions cannot have float elements', () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: [0.1],
        thresholdDenominator: 1,
        recertify: false,
      })
    )

    expect(() => {
      SubmitInteraction.parseData(dataString)
    }).toThrowError('"winningOptions[0]" must be an integer')
  })

  test('thresholdDenominator must be a number', () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: [0],
        thresholdDenominator: '1',
        recertify: false,
      })
    )

    expect(() => {
      SubmitInteraction.parseData(dataString)
    }).toThrowError('"thresholdDenominator" must be a number')
  })

  test('supports zero winning options and no counted options', () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {},
        winningOptions: [],
        thresholdDenominator: 1,
        recertify: false,
      })
    )

    const result = SubmitInteraction.parseData(dataString)
    expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {},
  "proposalId": "1000000000",
  "recertify": false,
  "thresholdDenominator": 1,
  "winningOptions": Array [],
}
`)
  })

  test('winning options must not be null', () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {},
        winningOptions: [null],
        thresholdDenominator: 1,
        recertify: false,
      })
    )

    expect(async () => {
      const result = SubmitInteraction.parseData(dataString)
    }).rejects.toThrowError('"winningOptions[0]" must be a number')
  })
})

describe('fromRemark', () => {
  test('proposal not found', async () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: [0],
        thresholdDenominator: 1,
        recertify: false,
      })
    )
    const remark: Remark = {
      block: 0,
      offset: 0,
      interaction_type: '',
      caller: '',
      version: '',
      remark: `${RMRK_DAO_PREFIX}::${INTERACTION_TYPES.SUBMIT}::${VERSION}::${dataString}`,
    }

    const db = new MemoryDatabaseAdapter()

    expect(async () => {
      await SubmitInteraction.fromRemark(remark, db)
    }).rejects.toThrowError('Proposal (1000000000) does not exist')
  })

  test('PROPOSAL not found', async () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: [0],
        thresholdDenominator: 1,
        recertify: false,
      })
    )
    const remark: Remark = {
      block: 0,
      offset: 0,
      interaction_type: '',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '',
      remark: `${RMRK_DAO_PREFIX}::${INTERACTION_TYPES.SUBMIT}::${VERSION}::${dataString}`,
    }

    const proposal: Proposal = {
      id: '1000000000',
      block: 0,
      custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      name: '',
      description: '',
      collections: null,
      options: null,
      passingThreshold: null,
      startDate: 0,
      snapshot: 0,
      endDate: 0,
      nftWeight: false,
      electorate: false,
      owner: '',
      status: 'waiting',
    }

    const db = new MemoryDatabaseAdapter()
    db.proposals[proposal.id] = proposal

    expect(async () => {
      await SubmitInteraction.fromRemark(remark, db)
    }).rejects.toThrowError(
      'PROPOSAL 1000000000 does not list CUSTODIAN HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU'
    )
  })

  test('CUSTODIAN not found', async () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: [0],
        thresholdDenominator: 1,
        recertify: false,
      })
    )
    const remark: Remark = {
      block: 0,
      offset: 0,
      interaction_type: '',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '',
      remark: `${RMRK_DAO_PREFIX}::${INTERACTION_TYPES.SUBMIT}::${VERSION}::${dataString}`,
    }

    const proposal: Proposal = {
      id: '1000000000',
      block: 0,
      custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      name: '',
      description: '',
      collections: null,
      options: null,
      passingThreshold: null,
      startDate: 0,
      snapshot: 0,
      endDate: 0,
      nftWeight: false,
      electorate: false,
      owner: '',
      status: 'waiting',
    }

    const db = new MemoryDatabaseAdapter()
    db.proposals[proposal.id] = proposal

    expect(async () => {
      await SubmitInteraction.fromRemark(remark, db)
    }).rejects.toThrowError(
      'CUSTODIAN (HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU) does not exist'
    )
  })

  test('option not found in PROPOSAL options', async () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: [0],
        thresholdDenominator: 1,
        recertify: false,
      })
    )
    const remark: Remark = {
      block: 0,
      offset: 0,
      interaction_type: '',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '',
      remark: `${RMRK_DAO_PREFIX}::${INTERACTION_TYPES.SUBMIT}::${VERSION}::${dataString}`,
    }

    const proposal: Proposal = {
      id: '1000000000',
      block: 0,
      custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      name: '',
      description: '',
      collections: null,
      options: {
        '1': 'No',
        '2': 'test',
      },
      passingThreshold: null,
      startDate: 0,
      snapshot: 0,
      endDate: 0,
      nftWeight: false,
      electorate: false,
      owner: '',
      status: 'waiting',
    }
    const custodian: Custodian = {
      id: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      block: 0,
      proposalFee: '',
      voteFee: '',
      recertifyFee: '',
      maxOptions: 0,
      changes: null,
    }

    const db = new MemoryDatabaseAdapter()
    db.proposals[proposal.id] = proposal
    db.custodians[custodian.id] = custodian

    expect(async () => {
      await SubmitInteraction.fromRemark(remark, db)
    }).rejects.toThrowError('0 not found in PROPOSAL 1000000000 options')
  })

  test('winning options not found in count object', async () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: [1],
        thresholdDenominator: 1,
        recertify: false,
      })
    )
    const remark: Remark = {
      block: 0,
      offset: 0,
      interaction_type: '',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '',
      remark: `${RMRK_DAO_PREFIX}::${INTERACTION_TYPES.SUBMIT}::${VERSION}::${dataString}`,
    }

    const proposal: Proposal = {
      id: '1000000000',
      block: 0,
      custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      name: '',
      description: '',
      collections: null,
      options: {
        '0': 'Yest',
        '1': 'No',
        '2': 'test',
      },
      passingThreshold: null,
      startDate: 0,
      snapshot: 0,
      endDate: 0,
      nftWeight: false,
      electorate: false,
      owner: '',
      status: 'waiting',
    }
    const custodian: Custodian = {
      id: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      block: 0,
      proposalFee: '',
      voteFee: '',
      recertifyFee: '',
      maxOptions: 0,
      changes: null,
    }

    const db = new MemoryDatabaseAdapter()
    db.proposals[proposal.id] = proposal
    db.custodians[custodian.id] = custodian

    expect(async () => {
      await SubmitInteraction.fromRemark(remark, db)
    }).rejects.toThrowError('1 not found in RESULT count object')
  })

  test('successful SUBMIT', async () => {
    const dataString = encodeURIComponent(
      JSON.stringify({
        proposalId: '1000000000',
        count: {
          '0': 1,
        },
        winningOptions: [0],
        thresholdDenominator: 1,
        recertify: false,
      })
    )
    const remark: Remark = {
      block: 0,
      offset: 0,
      interaction_type: '',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '',
      remark: `${RMRK_DAO_PREFIX}::${INTERACTION_TYPES.SUBMIT}::${VERSION}::${dataString}`,
    }

    const proposal: Proposal = {
      id: '1000000000',
      block: 0,
      custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      name: '',
      description: '',
      collections: null,
      options: {
        '0': 'Yest',
        '1': 'No',
        '2': 'test',
      },
      passingThreshold: null,
      startDate: 0,
      snapshot: 0,
      endDate: 0,
      nftWeight: false,
      electorate: false,
      owner: '',
      status: 'waiting',
    }
    const custodian: Custodian = {
      id: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      block: 0,
      proposalFee: '',
      voteFee: '',
      recertifyFee: '',
      maxOptions: 0,
      changes: null,
    }

    const db = new MemoryDatabaseAdapter()
    db.proposals[proposal.id] = proposal
    db.custodians[custodian.id] = custodian

    const result = await SubmitInteraction.fromRemark(remark, db)
    expect(result).toMatchInlineSnapshot(`
SubmitInteraction {
  "block": 0,
  "custodian": "HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU",
  "resultData": Object {
    "count": Object {
      "0": 1,
    },
    "proposalId": "1000000000",
    "recertify": false,
    "thresholdDenominator": 1,
    "winningOptions": Array [
      0,
    ],
  },
}
`)
  })
})
