# RMRKDAO Consolidator
This project consists of two major processes:
1. Consolidator process
1. Custodian process

The consolidator process uses a fork of [rmrk-tools](https://github.com/rmrkdao/rmrk-tools)
and implements a rmrk-tools `IConsolidatorAdapter` interface using Postgres as the database.

The custodian process is responsible for:
- validating and counting votes after a RMRKDAO PROPOSAL is closed
- submitting a RMRKDAO SUBMIT interaction representing the proposal results

The two processes communicate via a shared database by:
- updating the proposal.status column
- updating the vote.status column

## Run
Set the correct environment variables in a `.env` file in the project root directory (see [.env.example](.env.example)).

Optionally, use SSH tunneling to connect to a Kusama node behind a firewall. For example:
```
ssh -N configName -L 9944:127.0.0.1:9944
```

Next, the database will need to be populated. There are two options to populate the database:
1. Use a block dump file (making sure to include `RMRKDAO,rmrkdao` prefixes when generating the dump file) and then using `yarn consolidate`
1. Import a previous export using `yarn import-from-json`

Finally, after the database has been initially populated, the server can start to listen for new blocks and process them in real-time:
```
yarn build && yarn start
```
---
## Development

### Cross development
To use a local copy of the `rmrk-tools` module, run the following:
1. `cd path/to/rmrk-tools`
1. `yarn link`
1. `cd path/to/rmrk-dao-consolidator`
1. `yarn link rmrk-tools`
1. `yarn install`