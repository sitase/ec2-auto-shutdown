import * as cdk from 'aws-cdk-lib';
import {Duration} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {KeyPair, UserData, WindowsVersion} from 'aws-cdk-lib/aws-ec2';
import {Alarm, ComparisonOperator, Metric, Stats} from 'aws-cdk-lib/aws-cloudwatch';
import {Ec2Action, Ec2InstanceAction} from "aws-cdk-lib/aws-cloudwatch-actions";
import * as fs from "fs";
import {ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

export class Ec2ShutdownWhenIdleStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const ami = new ec2.WindowsImage(WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE, {userData: UserData.forWindows({})});
        const defaultVpc = ec2.Vpc.fromLookup(this, 'VPC', {isDefault: true})

        const securityGroup = new ec2.SecurityGroup(
            this,
            'allow-rpc-in-all-out',
            {
                vpc: defaultVpc,
                allowAllOutbound: true, // will let your instance send outboud traffic
                securityGroupName: 'allow-rpc-in-all-out',
            }
        )
        // lets use the security group to allow inbound traffic on specific ports
        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(3389),
            'Allows RDP access from Internet'
        )

        const pem = fs.readFileSync("/Users/simon/.ssh/ec2_windows.pub.pem", "utf-8");
        const keyPair = new KeyPair(this, "windows-ssh-key", {
            keyPairName: "simons-windows-key-2",
            physicalName: "simons-windows-key-2-physical"
        });
        const role = new Role(this, 'Role', {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
        });
        role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

        const instance = new ec2.Instance(this, 'Instance', {
            vpc: defaultVpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machineImage: ami,
            securityGroup: securityGroup,
            keyPair: keyPair,
            role: role
        });

        const alarm = new Alarm(this, "load-below-10", {
            alarmName: "load-below-10",
            comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
            threshold: 10,
            actionsEnabled: true,
            metric: new Metric({
                namespace: "AWS/EC2",
                metricName: "CPUUtilization",
                period: Duration.minutes(10),
                statistic: Stats.MAXIMUM,
                dimensionsMap: {InstanceId: instance.instanceId}
            })
        });
        alarm.addAlarmAction(new Ec2Action(Ec2InstanceAction.STOP))

        new cdk.CfnOutput(this, 'InstanceId', {
            value: instance.instanceId
        })
    }
}
