# An EC2 instance with Windows that shuts down on idle

Deploying this stack will setup an EC2 with Windows and an alarm attached that shuts down the instance after 
some idle time (30 minutes below 10 percent CPU usage, adjust to your preferences).

To start the instance you will need the `Administrator` password:

`scripts/get-password.sh i-01a2f345b67890e1` retrieves it 

Then start a TCP tunnel using session manager:

`scripts/start-and-connect.sh i-01a2f345b67890e1`

Connect your RDP client to `localhost:55678`.

## Prerequisites
Apart from the obvious CDK dependency, you need https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

On MacOS:
`brew install session-manager-plugin`
