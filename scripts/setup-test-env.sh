#!/usr/bin/env bash
# Should be run in the project root
# Run this script to set up the environment for the test suite.

set -e # TODO: Consider upgrading this script to use the advice from this SO post: https://stackoverflow.com/a/19622569/6010889

source scripts/variables.sh

EXPOSED_PORT=54325
EXPOSED_HOST=localhost
PG_USERNAME=rmrk_dao
PG_PASSWORD=rmrk_dao
PG_DATABASE=rmrk_dao
DB_READY_RETRIES=10

if ! docker start $TEST_CONTAINER_NAME > /dev/null 2>&1; then
  docker run --name $TEST_CONTAINER_NAME \
    -p "$EXPOSED_PORT:5432" \
    -e POSTGRES_PASSWORD=$PG_PASSWORD \
    -e POSTGRES_USER=$PG_USERNAME \
    -e POSTGRES_DB=$PG_DATABASE \
    -d --rm \
    postgres:14.3
fi

# @see https://stackoverflow.com/questions/35069027/docker-wait-for-postgresql-to-be-running
until psql "host=$EXPOSED_HOST port=$EXPOSED_PORT dbname=$PG_DATABASE user=$PG_USERNAME password=$PG_PASSWORD" -c "select 1" > /dev/null 2>&1  || [ $DB_READY_RETRIES -eq 0 ]; do
  echo "Waiting for postgres to be ready, $((DB_READY_RETRIES--)) remaining attempts..."
  sleep 1
done

npx dotenv -e .env.test -- yarn prisma migrate deploy