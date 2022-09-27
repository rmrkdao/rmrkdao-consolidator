import { Proposal, Vote } from '@prisma/client'
import { InMemoryAdapter, OP_TYPES } from 'rmrk-tools'
import {
  CollectionConsolidated,
  NFTConsolidated,
} from 'rmrk-tools/dist/tools/consolidator/consolidator'
import { TallyMachine } from './tally-machine'

const collection1: CollectionConsolidated = {
  block: 0,
  max: 0,
  issuer: '',
  symbol: '',
  id: '1',
  metadata: '',
  changes: [],
  count: 0,
}
const collection2: CollectionConsolidated = {
  block: 0,
  max: 0,
  issuer: '',
  symbol: '',
  id: '2',
  metadata: '',
  changes: [],
  count: 0,
}
const nft1: NFTConsolidated = {
  id: '1',
  block: 0,
  collection: collection1.id,
  symbol: '',
  transferable: 0,
  sn: '',
  forsale: BigInt(0),
  reactions: {},
  changes: [],
  owner: '',
  rootowner: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
  burned: '',
  priority: [],
  children: [],
  resources: [],
  pending: false,
}
const nft5: NFTConsolidated = {
  id: '5',
  block: 0,
  collection: collection1.id,
  symbol: '',
  transferable: 0,
  sn: '',
  forsale: BigInt(0),
  reactions: {},
  changes: [],
  owner: '',
  rootowner: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
  burned: '',
  priority: [],
  children: [],
  resources: [],
  pending: false,
}
const nft1burned: NFTConsolidated = {
  id: '1burned',
  block: 0,
  collection: collection1.id,
  symbol: '',
  transferable: 0,
  sn: '',
  forsale: BigInt(0),
  reactions: {},
  changes: [
    {
      new: '0x20e016ed1f2c4ddd9042fb6305253de54184dd64',
      old: '',
      block: 0,
      field: 'burned',
      caller: 'Dta81s5bbHVfSn8QGWEGMqXdq8sSod6iqRchQAV1abT6H5G',
      opType: OP_TYPES.BURN,
    },
  ],
  owner: '',
  rootowner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  burned: 'true',
  priority: [],
  children: [],
  resources: [],
  pending: false,
}
const nft2: NFTConsolidated = {
  id: '2',
  block: 0,
  collection: collection1.id,
  symbol: '',
  transferable: 0,
  sn: '',
  forsale: BigInt(0),
  reactions: {},
  changes: [],
  owner: '',
  rootowner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  burned: '',
  priority: [],
  children: [],
  resources: [],
  pending: false,
}

const nft3: NFTConsolidated = {
  id: '3',
  block: 0,
  collection: collection1.id,
  symbol: '',
  transferable: 0,
  sn: '',
  forsale: BigInt(0),
  reactions: {},
  changes: [],
  owner: '',
  rootowner: 'J1YLZ3GYSHxmRY2WxGKfgxesquQN7RvgtY7HXsXoHyBKCYx',
  burned: '',
  priority: [],
  children: [],
  resources: [],
  pending: false,
}

const nft4: NFTConsolidated = {
  id: '4',
  block: 0,
  collection: collection1.id,
  symbol: '',
  transferable: 0,
  sn: '',
  forsale: BigInt(0),
  reactions: {},
  changes: [],
  owner: '',
  rootowner: 'GqC37KSFFeGAoL7YxSeP1YDwr85WJvLmDDQiSaprTDAm8Jj',
  burned: '',
  priority: [],
  children: [],
  resources: [],
  pending: false,
}

const proposal1: Proposal = {
  block: 0,
  collections: [collection1.id],
  custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  description: 'First proposal',
  electorate: true,
  id: '1000000000',
  name: 'First',
  nftWeight: true,
  options: { '0': 'no', '1': 'yes', '2': 'either' },
  passingThreshold: 10,
  startDate: 1662069503,
  snapshot: 1662155903,
  endDate: 1662242303,
  owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
}

const proposal2: Proposal = {
  block: 0,
  collections: [collection2.id],
  custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  description: 'Second proposal',
  electorate: true,
  id: '2000000000',
  name: 'Second',
  nftWeight: true,
  options: { '0': 'no', '1': 'yes', '2': 'either' },
  passingThreshold: 10,
  startDate: 1662069503,
  snapshot: 1662155903,
  endDate: 1662242303,
  owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
}

const vote1: Vote = {
  id: '1',
  block: 0,
  caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
  proposalId: proposal1.id,
  option: '1',
  changes: [],
}

const vote1burned: Vote = {
  id: '1burned',
  block: 0,
  caller: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  proposalId: proposal1.id,
  option: '1',
  changes: [],
}

const vote2: Vote = {
  id: '2',
  block: 0,
  caller: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  proposalId: proposal1.id,
  option: '0',
  changes: [],
}

const vote3: Vote = {
  id: '1',
  block: 0,
  caller: 'J1YLZ3GYSHxmRY2WxGKfgxesquQN7RvgtY7HXsXoHyBKCYx',
  proposalId: proposal2.id,
  option: '0',
  changes: [],
}

const custodianKusamaAddress1 =
  'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh'

test('Successful single vote', async () => {
  const snapshotBlock = 0

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1.id] = nft1
  const votes = [vote1]

  const tallyMachine = new TallyMachine(proposal1, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "1": 1,
  },
  "proposalId": "1000000000",
  "recertify": false,
  "thresholdDenominator": 1,
  "winningOptions": Array [
    1,
  ],
}
`)
})

test('Successful tie', async () => {
  const snapshotBlock = 0

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1.id] = nft1
  rmrkDb.nfts[nft2.id] = nft2
  const votes = [vote1, vote2]

  const tallyMachine = new TallyMachine(proposal1, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "0": 1,
    "1": 1,
  },
  "proposalId": "1000000000",
  "recertify": false,
  "thresholdDenominator": 2,
  "winningOptions": Array [
    1,
    0,
  ],
}
`)
})

test('Correct threshold denominator for electorate', async () => {
  const snapshotBlock = 0

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1.id] = nft1
  rmrkDb.nfts[nft2.id] = nft2
  rmrkDb.nfts[nft3.id] = nft3
  const votes = [vote1, vote2]

  const tallyMachine = new TallyMachine(proposal1, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "0": 1,
    "1": 1,
  },
  "proposalId": "1000000000",
  "recertify": false,
  "thresholdDenominator": 3,
  "winningOptions": Array [
    1,
    0,
  ],
}
`)
})

test('Correct threshold denominator for non-electorate', async () => {
  const snapshotBlock = 0

  const proposal: Proposal = {
    block: 0,
    collections: [collection1.id],
    custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
    description: 'First proposal',
    electorate: false,
    id: '1000000000',
    name: 'First',
    nftWeight: true,
    options: { '0': 'no', '1': 'yes', '2': 'either' },
    passingThreshold: 10,
    startDate: 1662069503,
    snapshot: 1662155903,
    endDate: 1662242303,
    owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  }

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1.id] = nft1
  rmrkDb.nfts[nft2.id] = nft2
  rmrkDb.nfts[nft3.id] = nft3
  const votes = [
    {
      id: '1',
      block: 0,
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      proposalId: proposal.id,
      option: '1',
      changes: [],
    },
    {
      id: '2',
      block: 0,
      caller: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      proposalId: proposal.id,
      option: '0',
      changes: [],
    },
  ]

  const tallyMachine = new TallyMachine(proposal, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "0": 1,
    "1": 1,
  },
  "proposalId": "1000000000",
  "recertify": false,
  "thresholdDenominator": 2,
  "winningOptions": Array [
    1,
    0,
  ],
}
`)
})

test("Doesn't count burned NFTs", async () => {
  const snapshotBlock = 0

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1burned.id] = nft1burned
  const votes = [vote1burned]

  const tallyMachine = new TallyMachine(proposal1, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {},
  "proposalId": "1000000000",
  "recertify": false,
  "thresholdDenominator": 0,
  "winningOptions": Array [],
}
`)
})

test('Successfully ignore vote without nft ownership at snapshot', async () => {
  const snapshotBlock = 0

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1.id] = nft1
  const votes = [vote1, vote3]

  const tallyMachine = new TallyMachine(proposal1, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "1": 1,
  },
  "proposalId": "1000000000",
  "recertify": false,
  "thresholdDenominator": 1,
  "winningOptions": Array [
    1,
  ],
}
`)
})

test('No winners', async () => {
  const snapshotBlock = 0
  const proposal: Proposal = {
    block: 0,
    collections: [collection1.id, collection2.id],
    custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
    description: 'Second proposal',
    electorate: true,
    id: '3000000000',
    name: 'Second',
    nftWeight: true,
    options: { '0': 'no', '1': 'yes', '2': 'either' },
    passingThreshold: 66,
    startDate: 1662069503,
    snapshot: 1662155903,
    endDate: 1662242303,
    owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  }

  const votes: Vote[] = [
    {
      id: '1',
      block: 0,
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      proposalId: proposal.id,
      option: '0',
      changes: [],
    },
    {
      id: '2',
      block: 0,
      caller: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      proposalId: proposal.id,
      option: '0',
      changes: [],
    },
    {
      id: '3',
      block: 0,
      caller: 'J1YLZ3GYSHxmRY2WxGKfgxesquQN7RvgtY7HXsXoHyBKCYx',
      proposalId: proposal.id,
      option: '1',
      changes: [],
    },
    {
      id: '4',
      block: 0,
      caller: 'GqC37KSFFeGAoL7YxSeP1YDwr85WJvLmDDQiSaprTDAm8Jj',
      proposalId: proposal.id,
      option: '2',
      changes: [],
    },
  ]

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1.id] = nft1
  rmrkDb.nfts[nft2.id] = nft2
  rmrkDb.nfts[nft3.id] = nft3
  rmrkDb.nfts[nft4.id] = nft4
  // rmrkDb.nfts[nft5.id] = nft5

  const tallyMachine = new TallyMachine(proposal, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "0": 2,
    "1": 1,
    "2": 1,
  },
  "proposalId": "3000000000",
  "recertify": false,
  "thresholdDenominator": 4,
  "winningOptions": Array [],
}
`)
})

test('Electorate winner', async () => {
  const snapshotBlock = 0
  const proposal: Proposal = {
    block: 0,
    collections: [collection1.id, collection2.id],
    custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
    description: 'Second proposal',
    electorate: true,
    id: '3000000000',
    name: 'Second',
    nftWeight: true,
    options: { '0': 'no', '1': 'yes', '2': 'either' },
    passingThreshold: 66,
    startDate: 1662069503,
    snapshot: 1662155903,
    endDate: 1662242303,
    owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  }

  const votes: Vote[] = [
    {
      id: '1',
      block: 0,
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      proposalId: proposal.id,
      option: '0',
      changes: [],
    },
    {
      id: '2',
      block: 0,
      caller: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
      proposalId: proposal.id,
      option: '0',
      changes: [],
    },
    {
      id: '3',
      block: 0,
      caller: 'J1YLZ3GYSHxmRY2WxGKfgxesquQN7RvgtY7HXsXoHyBKCYx',
      proposalId: proposal.id,
      option: '1',
      changes: [],
    },
  ]

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1.id] = nft1
  rmrkDb.nfts[nft2.id] = nft2
  rmrkDb.nfts[nft3.id] = nft3
  // rmrkDb.nfts[nft4.id] = nft4
  // rmrkDb.nfts[nft5.id] = nft5

  const tallyMachine = new TallyMachine(proposal, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "0": 2,
    "1": 1,
  },
  "proposalId": "3000000000",
  "recertify": false,
  "thresholdDenominator": 3,
  "winningOptions": Array [
    0,
  ],
}
`)
})

test('nftWeight counts multiple NFTs', async () => {
  const snapshotBlock = 0
  const proposal: Proposal = {
    block: 0,
    collections: [collection1.id],
    custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
    description: 'Second proposal',
    electorate: true,
    id: '3000000000',
    name: 'Second',
    nftWeight: true,
    options: { '0': 'no', '1': 'yes', '2': 'either' },
    passingThreshold: 0,
    startDate: 1662069503,
    snapshot: 1662155903,
    endDate: 1662242303,
    owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  }

  const votes: Vote[] = [
    {
      id: '1',
      block: 0,
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      proposalId: proposal.id,
      option: '0',
      changes: [],
    },
  ]

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1.id] = nft1
  rmrkDb.nfts[nft5.id] = nft5

  const tallyMachine = new TallyMachine(proposal, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "0": 2,
  },
  "proposalId": "3000000000",
  "recertify": false,
  "thresholdDenominator": 2,
  "winningOptions": Array [
    0,
  ],
}
`)
})

test("nftWeight=false doesn't count multiple NFTs", async () => {
  const snapshotBlock = 0
  const proposal: Proposal = {
    block: 0,
    collections: [collection1.id],
    custodian: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
    description: 'Second proposal',
    electorate: true,
    id: '3000000000',
    name: 'Second',
    nftWeight: false,
    options: { '0': 'no', '1': 'yes', '2': 'either' },
    passingThreshold: 0,
    startDate: 1662069503,
    snapshot: 1662155903,
    endDate: 1662242303,
    owner: 'HjtDiyd4A7wG8Dz54Nkrze1B5AGbXGJbfhr6qiMQv4tVRvh',
  }

  const votes: Vote[] = [
    {
      id: '1',
      block: 0,
      caller: 'HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU',
      proposalId: proposal.id,
      option: '0',
      changes: [],
    },
  ]

  const rmrkDb = new InMemoryAdapter()
  rmrkDb.collections[collection1.id] = collection1
  rmrkDb.nfts[nft1.id] = nft1
  rmrkDb.nfts[nft5.id] = nft5

  const tallyMachine = new TallyMachine(proposal, votes, snapshotBlock, rmrkDb)
  const result = await tallyMachine.prepareResult(false)

  expect(result).toMatchInlineSnapshot(`
Object {
  "count": Object {
    "0": 1,
  },
  "proposalId": "3000000000",
  "recertify": false,
  "thresholdDenominator": 1,
  "winningOptions": Array [
    0,
  ],
}
`)
})
