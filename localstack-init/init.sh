#!/bin/bash

# Create S3 buckets
awslocal s3 mb s3://home-expenses-dev-frontend
awslocal s3 mb s3://home-expenses-dev-statements
awslocal s3 mb s3://home-expenses-dev-results

# Create DynamoDB tables
awslocal dynamodb create-table \
    --table-name home-expenses-dev-financial-results \
    --attribute-definitions AttributeName=session_id,AttributeType=S AttributeName=timestamp,AttributeType=S \
    --key-schema AttributeName=session_id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST

awslocal dynamodb create-table \
    --table-name home-expenses-dev-processing-status \
    --attribute-definitions AttributeName=session_id,AttributeType=S \
    --key-schema AttributeName=session_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

echo "LocalStack initialization complete!"