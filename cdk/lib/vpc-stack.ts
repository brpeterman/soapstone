import { Stack, StackProps } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { CapacityConfig, Domain, EngineVersion } from 'aws-cdk-lib/aws-opensearchservice';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface VpcStackProps extends StackProps {
}

export class VpcStack extends Stack {
  vpc: Vpc;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'Vpc', {
      natGateways: 0
    });
  }
}
