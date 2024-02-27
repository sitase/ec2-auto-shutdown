#!/usr/bin/env sh

INSTANCE_ID=$1

KEY_NAME="simons-windows-key-2"
export AWS_DEFAULT_REGION=eu-north-1

SSH_PRIVATE_KEY_NAME=$(aws  ec2 describe-key-pairs  --key-names $KEY_NAME --query 'KeyPairs[0].KeyPairId' --output text)
echo key name /ec2/keypair/$SSH_PRIVATE_KEY_NAME

PRIVATE_KEY=$(mktemp /tmp/pk.XXXXXX)
aws ssm get-parameter --region eu-north-1 --name /ec2/keypair/${SSH_PRIVATE_KEY_NAME} --with-decryption --query Parameter.Value --output text > ${PRIVATE_KEY}
PASSWORD=$(aws ec2 get-password-data  --instance-id ${INSTANCE_ID} --query PasswordData --priv-launch-key ${PRIVATE_KEY} --output text)

echo $PASSWORD
