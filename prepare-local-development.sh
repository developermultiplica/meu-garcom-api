#!/usr/bin/env bash

echo "\n--- Overwriting local environments ---\n"
cp .env.local .env

echo "\n--- Building local infrastructure ---\n"
apk add --no-cache aws-cli

export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_SESSION_TOKEN="test"
aws --endpoint-url=http://localstack:4566 s3 mb s3://meu-garcom

echo "\n--- Applying migrations ---\n"
yarn prisma migrate deploy

echo "\n--- Initializing app ---\n"
yarn start:dev
