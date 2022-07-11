# RMRK::DAO Consolidator
Implements a RMRK tools' `IConsolidatorAdapter` interface using Postgres as the database.

## Run
Set the correct environment variables in a `.env` file in the project root directory (see [.env.example](.env.example)).

Optionally, use SSH tunneling to connect to a Kusama node behind a firewall. For example:
```
ssh -N configName -L 9944:127.0.0.1:9944
```

Next, the database will need to be populated. There are two options to populate the database:
1. Use a block dump file and then using `yarn consolidate`
1. Import a previous export using `yarn import-from-json`

Finally, after the database has been initially populated, the server can start to listen for new blocks and process them in real-time:
```
yarn build && yarn start
```

## Development

### Cross development
To use a local copy of the `rmrk-tools` module, run the following:
1. `cd path/to/rmrk-tools`
1. `yarn link`
1. `cd path/to/rmrk-dao-consolidator`
1. `yarn link rmrk-tools`
1. `yarn install`