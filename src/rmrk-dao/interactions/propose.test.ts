import { Collection2, Proposal } from '@prisma/client'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import { MemoryDatabaseAdapter } from '../database-adapter/memory-database-adapter'
import { Propose } from './propose'

describe('parseData', () => {
  const now = 1662069503

  test('Parse valid PROPOSE entity payload', () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        id: '1000000000',
        custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        name: 'First',
        description: 'First proposal',
        collections: ['1', '2'],
        options: ['yes', 'no'],
        snapshot: now + 24 * 3600, // 24 hours
        passingThreshold: 10,
        startDate: now,
        endDate: now + 48 * 3600, // two days from now
        nftWeight: true,
        electorate: true,
      })
    )

    const result = Propose.parseData(payload)

    expect(result).toMatchInlineSnapshot(`
Object {
  "collections": Array [
    "1",
    "2",
  ],
  "custodian": "HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU",
  "description": "First proposal",
  "electorate": true,
  "endDate": 1662242303,
  "id": "1000000000",
  "name": "First",
  "nftWeight": true,
  "options": Array [
    "yes",
    "no",
  ],
  "passingThreshold": 10,
  "snapshot": 1662155903,
  "startDate": 1662069503,
}
`)
  })

  describe('Correctly parse id', () => {
    test('missing id', () => {
      const payload = encodeURIComponent(
        JSON.stringify({
          custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
          name: 'First',
          description: 'First proposal',
          collections: ['1', '2'],
          options: ['yes', 'no'],
          snapshot: now + 24 * 3600, // 24 hours
          passingThreshold: 10,
          startDate: now,
          endDate: now + 48 * 3600, // two days from now
          nftWeight: true,
          electorate: true,
        })
      )

      expect(() => {
        const result = Propose.parseData(payload)
      }).toThrowError(`"id" is required`)
    })

    test('short id', () => {
      const payload = encodeURIComponent(
        JSON.stringify({
          id: '1',
          custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
          name: 'First',
          description: 'First proposal',
          collections: ['1', '2'],
          options: ['yes', 'no'],
          snapshot: now + 24 * 3600, // 24 hours
          passingThreshold: 10,
          startDate: now,
          endDate: now + 48 * 3600, // two days from now
          nftWeight: true,
          electorate: true,
        })
      )

      expect(() => {
        const result = Propose.parseData(payload)
      }).toThrowError(`"id" length must be 10 characters long`)
    })

    test('wrong character set in id', () => {
      const payload = encodeURIComponent(
        JSON.stringify({
          id: '🎁000000000',
          custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
          name: 'First',
          description: 'First proposal',
          collections: ['1', '2'],
          options: ['yes', 'no'],
          snapshot: now + 24 * 3600, // 24 hours
          passingThreshold: 10,
          startDate: now,
          endDate: now + 48 * 3600, // two days from now
          nftWeight: true,
          electorate: true,
        })
      )

      expect(() => {
        const result = Propose.parseData(payload)
      }).toThrowError(`"id" must only contain alpha-numeric characters`)
    })
  })

  describe('custodian', () => {
    test('missing custodian', () => {
      const payload = encodeURIComponent(
        JSON.stringify({
          id: '1000000000',
          name: 'First',
          description: 'First proposal',
          collections: ['1', '2'],
          options: ['yes', 'no'],
          snapshot: now + 24 * 3600, // 24 hours
          passingThreshold: 10,
          startDate: now,
          endDate: now + 48 * 3600, // two days from now
          nftWeight: true,
          electorate: true,
        })
      )

      expect(() => {
        const result = Propose.parseData(payload)
      }).toThrowError(`"custodian" is required`)
    })

    test('non-kusama formatted custodian fails', () => {
      const payload = encodeURIComponent(
        JSON.stringify({
          id: '1000000000',
          custodian: 'custodian-1',
          name: 'First',
          description: 'First proposal',
          collections: ['1', '2'],
          options: ['yes', 'no'],
          snapshot: now + 24 * 3600, // 24 hours
          passingThreshold: 10,
          startDate: now,
          endDate: now + 48 * 3600, // two days from now
          nftWeight: true,
          electorate: true,
        })
      )

      expect(() => {
        const result = Propose.parseData(payload)
      }).toThrowError(
        `"custodian" failed custom validation because Decoding custodian-1: Invalid base58 character "-" (0x2d) at index 9`
      )
    })
  })

  test('missing name', () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        id: '1000000000',
        custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        description: 'First proposal',
        collections: ['1', '2'],
        options: ['yes', 'no'],
        snapshot: now + 24 * 3600, // 24 hours
        passingThreshold: 10,
        startDate: now,
        endDate: now + 48 * 3600, // two days from now
        nftWeight: true,
        electorate: true,
      })
    )

    expect(() => {
      const result = Propose.parseData(payload)
    }).toThrowError(`"name" is required`)
  })

  test('missing name', () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        id: '1000000000',
        custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        name: Array(10001).fill('a').join(''),
        description: 'First proposal',
        collections: ['1', '2'],
        options: ['yes', 'no'],
        snapshot: now + 24 * 3600, // 24 hours
        passingThreshold: 10,
        startDate: now,
        endDate: now + 48 * 3600, // two days from now
        nftWeight: true,
        electorate: true,
      })
    )

    expect(() => {
      const result = Propose.parseData(payload)
    }).toThrowError(
      `"name" length must be less than or equal to 10000 characters long`
    )
  })

  test('empty string description', () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        id: '1000000000',
        custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        name: 'first',
        description: '',
        collections: ['1', '2'],
        options: ['yes', 'no'],
        snapshot: now + 24 * 3600, // 24 hours
        passingThreshold: 10,
        startDate: now,
        endDate: now + 48 * 3600, // two days from now
        nftWeight: true,
        electorate: true,
      })
    )

    expect(() => {
      const result = Propose.parseData(payload)
    }).not.toThrow()
  })

  test('required description', () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        id: '1000000000',
        custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        name: 'first',
        collections: ['1', '2'],
        options: ['yes', 'no'],
        snapshot: now + 24 * 3600, // 24 hours
        passingThreshold: 10,
        startDate: now,
        endDate: now + 48 * 3600, // two days from now
        nftWeight: true,
        electorate: true,
      })
    )

    expect(() => {
      const result = Propose.parseData(payload)
    }).toThrowError(`"description" is required`)
  })

  test('less than 2 options', () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        id: '1000000000',
        custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        name: 'first',
        description: '',
        collections: ['1', '2'],
        options: ['yes'],
        snapshot: now + 24 * 3600, // 24 hours
        passingThreshold: 10,
        startDate: now,
        endDate: now + 48 * 3600, // two days from now
        nftWeight: true,
        electorate: true,
      })
    )

    expect(() => {
      const result = Propose.parseData(payload)
    }).toThrowError(`"options" must contain at least 2 items`)
  })

  test('passing threshold should be <= 100', () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        id: '1000000000',
        custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        name: 'first',
        description: '',
        collections: ['1', '2'],
        options: ['yes', 'no'],
        snapshot: now + 24 * 3600, // 24 hours
        passingThreshold: 101,
        startDate: now,
        endDate: now + 48 * 3600, // two days from now
        nftWeight: true,
        electorate: true,
      })
    )

    expect(() => {
      const result = Propose.parseData(payload)
    }).toThrowError(`"passingThreshold" must be less than or equal to 100`)
  })

  test('passing threshold should be >= 0', () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        id: '1000000000',
        custodian: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        name: 'first',
        description: '',
        collections: ['1', '2'],
        options: ['yes', 'no'],
        snapshot: now + 24 * 3600, // 24 hours
        passingThreshold: -1,
        startDate: now,
        endDate: now + 48 * 3600, // two days from now
        nftWeight: true,
        electorate: true,
      })
    )

    expect(() => {
      const result = Propose.parseData(payload)
    }).toThrowError(`"passingThreshold" must be greater than or equal to 0`)
  })
})

describe('create Propose object using fromRemark static method', () => {
  test('working example', async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        endDate: 1662242303,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662069503,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
      extra_ex: [
        {
          call: 'balances.transfer',
          value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000000',
          caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        },
      ],
    }

    const db = new MemoryDatabaseAdapter()

    db.custodians['HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'] = {
      block: 11000000,
      id: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      voteFee: '1000',
      proposalFee: '1000000',
      recertifyFee: '2000000',
      maxOptions: 100,
      changes: [],
    }

    db.collections['1'] = {
      id: '1',
      block: 1100000,
      max: 0,
      issuer: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    // Block time of the PROPOSE interaction remark is before the PROPOSAL's startDate
    db.blockTimes[12000000] = 1662069500

    await expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).not.toThrowError()
  })

  test('non-unique id', async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        endDate: 1662242303,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662069503,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
      extra_ex: [
        {
          call: 'balances.transfer',
          value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000000',
          caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        },
      ],
    }

    const proposal: Proposal = {
      block: 0,
      collections: ['1'],
      custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      description: 'First proposal',
      electorate: true,
      endDate: 1662242303,
      id: '1000000000',
      name: 'First',
      nftWeight: true,
      options: ['yes', 'no'],
      passingThreshold: 10,
      snapshot: 1662155903,
      startDate: 1662069503,
    }

    const db = new MemoryDatabaseAdapter()

    db.custodians['HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'] = {
      block: 11000000,
      id: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      voteFee: '1000',
      proposalFee: '1000000',
      recertifyFee: '2000000',
      maxOptions: 100,
      changes: [],
    }

    db.collections['1'] = {
      id: '1',
      block: 1100000,
      max: 0,
      issuer: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    // Block time of the PROPOSE interaction remark is before the PROPOSAL's startDate
    db.blockTimes[12000000] = 1662069500

    db.proposals[proposal.id] = proposal

    await expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).rejects.toThrowError(`Non-unique PROPOSAL id ${proposal.id}`)
  })

  test("custodian doesn't exist", async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        endDate: 1662242303,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662069503,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
      extra_ex: [
        {
          call: 'balances.transfer',
          value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000000',
          caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        },
      ],
    }

    const proposal: Proposal = {
      block: 0,
      collections: ['1'],
      custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      description: 'First proposal',
      electorate: true,
      endDate: 1662242303,
      id: '1000000000',
      name: 'First',
      nftWeight: true,
      options: ['yes', 'no'],
      passingThreshold: 10,
      snapshot: 1662155903,
      startDate: 1662069503,
    }

    const db = new MemoryDatabaseAdapter()

    db.collections['1'] = {
      id: '1',
      block: 1100000,
      max: 0,
      issuer: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    // Block time of the PROPOSE interaction remark is before the PROPOSAL's startDate
    db.blockTimes[12000000] = 1662069500

    await expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).rejects.toThrowError(`Custodian (${proposal.custodian}) does not exist`)
  })

  test('incorrect num of options', async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        endDate: 1662242303,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no', '?'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662069503,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
      extra_ex: [
        {
          call: 'balances.transfer',
          value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000000',
          caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        },
      ],
    }

    const db = new MemoryDatabaseAdapter()

    db.custodians['HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'] = {
      block: 11000000,
      id: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      voteFee: '1000',
      proposalFee: '1000000',
      recertifyFee: '2000000',
      maxOptions: 2,
      changes: [],
    }

    db.collections['1'] = {
      id: '1',
      block: 1100000,
      max: 0,
      issuer: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    // Block time of the PROPOSE interaction remark is before the PROPOSAL's startDate
    db.blockTimes[12000000] = 1662069500

    expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).rejects.toThrowError(
      `CUSTODIAN only allows a max of ${2} but the PROPOSAL has ${3}`
    )
  })

  test('missing balance transfer', async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        endDate: 1662242303,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662069503,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
    }

    const db = new MemoryDatabaseAdapter()

    db.custodians['HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'] = {
      block: 11000000,
      id: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      voteFee: '1000',
      proposalFee: '1000000',
      recertifyFee: '2000000',
      maxOptions: 100,
      changes: [],
    }

    db.collections['1'] = {
      id: '1',
      block: 1100000,
      max: 0,
      issuer: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    // Block time of the PROPOSE interaction remark is before the PROPOSAL's startDate
    db.blockTimes[12000000] = 1662069500

    expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).rejects.toThrowError(`Missing valid balance transfer`)
  })

  test("collection doesn't exist yet", async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        endDate: 1662242303,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662069503,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
      extra_ex: [
        {
          call: 'balances.transfer',
          value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000000',
          caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        },
      ],
    }

    const db = new MemoryDatabaseAdapter()

    db.custodians['HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'] = {
      block: 11000000,
      id: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      voteFee: '1000',
      proposalFee: '1000000',
      recertifyFee: '2000000',
      maxOptions: 100,
      changes: [],
    }

    const collection: Collection2 = {
      id: '1',
      block: 12000001,
      max: 0,
      issuer: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    db.collections[collection.id] = collection

    // Block time of the PROPOSE interaction remark is before the PROPOSAL's startDate
    db.blockTimes[12000000] = 1662069500

    expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).rejects.toThrowError(`Collection ${collection.id} does not exist yet`)
  })

  test('does not own collection', async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        endDate: 1662242303,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662069503,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
      extra_ex: [
        {
          call: 'balances.transfer',
          value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000000',
          caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        },
      ],
    }

    const db = new MemoryDatabaseAdapter()

    db.custodians['HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'] = {
      block: 11000000,
      id: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      voteFee: '1000',
      proposalFee: '1000000',
      recertifyFee: '2000000',
      maxOptions: 100,
      changes: [],
    }

    const collection: Collection2 = {
      id: '1',
      block: 11000000,
      max: 0,
      issuer: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    db.collections[collection.id] = collection

    // Block time of the PROPOSE interaction remark is before the PROPOSAL's startDate
    db.blockTimes[12000000] = 1662069500

    expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).rejects.toThrowError(
      `PROPOSAL caller was not the issuer of collection ${collection.id} at time of PROPOSE interaction`
    )
  })

  test('missing block time', async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        endDate: 1662242303,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662069503,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
      extra_ex: [
        {
          call: 'balances.transfer',
          value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000000',
          caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        },
      ],
    }

    const db = new MemoryDatabaseAdapter()

    db.custodians['HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'] = {
      block: 11000000,
      id: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      voteFee: '1000',
      proposalFee: '1000000',
      recertifyFee: '2000000',
      maxOptions: 100,
      changes: [],
    }

    const collection: Collection2 = {
      id: '1',
      block: 11000000,
      max: 0,
      issuer: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    db.collections[collection.id] = collection

    expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).rejects.toThrowError(
      `Unable to find block time for block ${remark.block}`
    )
  })

  test('start time cannot be after end time', async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662242303,
        endDate: 1662069503,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
      extra_ex: [
        {
          call: 'balances.transfer',
          value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000000',
          caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        },
      ],
    }

    const db = new MemoryDatabaseAdapter()

    db.custodians['HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'] = {
      block: 11000000,
      id: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      voteFee: '1000',
      proposalFee: '1000000',
      recertifyFee: '2000000',
      maxOptions: 100,
      changes: [],
    }

    const collection: Collection2 = {
      id: '1',
      block: 11000000,
      max: 0,
      issuer: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    db.collections[collection.id] = collection

    // Block time of the PROPOSE interaction remark is before the PROPOSAL's startDate
    db.blockTimes[12000000] = 1662069500

    expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).rejects.toThrowError('Start time cannot be after end time')
  })

  test('Start time cannot be before remark', async () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        collections: ['1'],
        custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
        description: 'First proposal',
        electorate: true,
        id: '1000000000',
        name: 'First',
        nftWeight: true,
        options: ['yes', 'no'],
        passingThreshold: 10,
        snapshot: 1662155903,
        startDate: 1662069503,
        endDate: 1662242303,
      })
    )

    const remark: Remark = {
      block: 12000000,
      offset: 1,
      interaction_type: 'PROPOSE',
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      version: '2.0.0',
      remark: `RMRKDAO::PROPOSE::2.0.0::${payload}`,
      extra_ex: [
        {
          call: 'balances.transfer',
          value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000000',
          caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
        },
      ],
    }

    const db = new MemoryDatabaseAdapter()

    db.custodians['HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'] = {
      block: 11000000,
      id: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      voteFee: '1000',
      proposalFee: '1000000',
      recertifyFee: '2000000',
      maxOptions: 100,
      changes: [],
    }

    const collection: Collection2 = {
      id: '1',
      block: 11000000,
      max: 0,
      issuer: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      symbol: '1',
      metadata: '',
      changes: [],
      count: 1,
    }

    db.collections[collection.id] = collection

    // Block time of the PROPOSE interaction remark is after the PROPOSAL's startDate
    db.blockTimes[remark.block] = 1662069503 + 100

    expect(async () => {
      const result = await Propose.fromRemark(remark, db)
    }).rejects.toThrowError("Start time cannot be before remark's block time")
  })
})
