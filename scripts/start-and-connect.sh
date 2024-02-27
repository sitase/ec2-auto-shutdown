#!/usr/bin/env sh

INSTANCE_ID=$1

export AWS_DEFAULT_REGION=eu-north-1

aws ec2 start-instances --instance-ids ${INSTANCE_ID} --region eu-north-1> /dev/null

if [[ $? != 0 ]]; then
  exit
fi

while $do; do
    /bin/echo -n "."
   INSTANCE_STATUS=$(aws ec2 describe-instance-status --instance-ids ${INSTANCE_ID} --query 'InstanceStatuses[0].InstanceState.Name' --output text)
   [[ $INSTANCE_STATUS == "running" ]] && do=false
 done
aws ssm start-session --target i-05d8b7f6b0d239a3f --document-name AWS-StartPortForwardingSession --parameters "localPortNumber=55678,portNumber=3389" --region eu-north-1

