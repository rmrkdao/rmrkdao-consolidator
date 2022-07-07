# RMRK::DAO Consolidator
Implements a RMRK tools' `IConsolidatorAdapter` interface using Postgres as the database.

## Run
Set the correct environment variables in a `.env` file in the project root directory (see [.env.example](.env.example)).

Optionally, use SSH tunneling to connect to a Kusama node behind a firewall. For example:
```
ssh -N configName -L 9944:127.0.0.1:9944
```

Then run the consolidate command:
```
yarn consolidate
```