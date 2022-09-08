import { Proposal } from '@prisma/client'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import { MemoryDatabaseAdapter } from '../database-adapter/memory-database-adapter'
import { VoteInteraction } from './vote'

test('Valid VOTE', async () => {
  const remark: Remark = {
    remark: 'RMRKDAO::VOTE::2.0.0::1000000000::2',
    block: 8900000,
    offset: 0,
    interaction_type: 'VOTE',
    caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
    version: '2.0.0',
    extra_ex: [
      {
        call: 'balances.transfer',
        value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000',
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
    options: { '0': 'no', '1': 'yes', '2': 'either' },
    passingThreshold: 10,
    snapshot: 1662155903,
    startDate: 1662069503,
    owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
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
  db.proposals[proposal.id] = proposal
  db.blockTimes[8900000] = 1662242302

  const result = await VoteInteraction.fromRemark(remark, db)
  expect(result).toMatchInlineSnapshot(`
VoteInteraction {
  "block": 8900000,
  "caller": "HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU",
  "id": "1000000000-HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU",
  "option": "2",
  "proposalId": "1000000000",
}
`)
})

test('invalid number of rmrk components', () => {
  // Missing option
  const remark: Remark = {
    remark: 'RMRKDAO::VOTE::2.0.0::1234567890',
    block: 0,
    offset: 0,
    interaction_type: 'VOTE',
    caller: '',
    version: '2.0.0',
  }

  const db = new MemoryDatabaseAdapter()

  expect(async () => {
    const result = await VoteInteraction.fromRemark(remark, db)
  }).rejects.toThrowError('Missing option')
})

test('non-existing proposal', () => {
  const remark: Remark = {
    remark: 'RMRKDAO::VOTE::2.0.0::1234567890::0',
    block: 8900000,
    offset: 0,
    interaction_type: 'VOTE',
    caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
    version: '2.0.0',
  }

  const db = new MemoryDatabaseAdapter()

  expect(async () => {
    const result = await VoteInteraction.fromRemark(remark, db)
  }).rejects.toThrowError(`Proposal (1234567890) does not exist`)
})

test('Missing valid balance transfer', () => {
  const remark: Remark = {
    remark: 'RMRKDAO::VOTE::2.0.0::1000000000::0',
    block: 8900000,
    offset: 0,
    interaction_type: 'VOTE',
    caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
    version: '2.0.0',
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
    owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
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
  db.proposals[proposal.id] = proposal

  expect(async () => {
    const result = await VoteInteraction.fromRemark(remark, db)
  }).rejects.toThrowError(`Missing valid balance transfer`)
})

test("Cannot vote on or after PROPOSAL's endDate", () => {
  const remark: Remark = {
    remark: 'RMRKDAO::VOTE::2.0.0::1000000000::0',
    block: 8900000,
    offset: 0,
    interaction_type: 'VOTE',
    caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
    version: '2.0.0',
    extra_ex: [
      {
        call: 'balances.transfer',
        value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000',
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
    owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
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
  db.proposals[proposal.id] = proposal
  db.blockTimes[8900000] = 1662242303

  expect(async () => {
    const result = await VoteInteraction.fromRemark(remark, db)
  }).rejects.toThrowError(`Cannot vote on or after PROPOSAL's endDate`)
})

test('Invalid option', () => {
  const remark: Remark = {
    remark: 'RMRKDAO::VOTE::2.0.0::1000000000::3',
    block: 8900000,
    offset: 0,
    interaction_type: 'VOTE',
    caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
    version: '2.0.0',
    extra_ex: [
      {
        call: 'balances.transfer',
        value: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh,1000',
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
    options: { '0': 'no', '1': 'yes', '2': 'either' },
    passingThreshold: 10,
    snapshot: 1662155903,
    startDate: 1662069503,
    owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
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
  db.proposals[proposal.id] = proposal
  db.blockTimes[8900000] = 1662242302

  expect(async () => {
    await VoteInteraction.fromRemark(remark, db)
  }).rejects.toThrowError(`Option 3 is not available in PROPOSAL 1000000000`)
})
