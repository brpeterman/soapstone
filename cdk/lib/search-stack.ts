import { Stack, StackProps } from 'aws-cdk-lib';
import { CfnIdentityPool, UserPool } from 'aws-cdk-lib/aws-cognito';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { AccountPrincipal, Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CapacityConfig, Domain, EngineVersion } from 'aws-cdk-lib/aws-opensearchservice';
import { Construct } from 'constructs';

interface SearchStackProps extends StackProps {
  readonly capacity?: CapacityConfig;
  readonly availabilityZones: number;
  readonly vpc?: Vpc;
  readonly adminPool: UserPool;
  readonly adminIdentityPool: CfnIdentityPool;
  readonly adminRole: Role;
}

export class SearchStack extends Stack {
  domain: Domain;

  constructor(scope: Construct, id: string, props: SearchStackProps) {
    super(scope, id, props);

    this.domain = new Domain(this, 'MessagesDomain', {
      version: EngineVersion.OPENSEARCH_1_3,
      enableVersionUpgrade: true,
      capacity: props.capacity,
      zoneAwareness: {
        availabilityZoneCount: props.availabilityZones
      },
      vpc: props.vpc,
      accessPolicies: [
        new PolicyStatement({
          actions: [
            'es:ESHttpGet',
            'es:ESHttpPost',
            'es:ESHttpPut',
            'es:ESHttpDelete'
          ],
          effect: Effect.ALLOW,
          principals: [
            new AccountPrincipal(this.account)
          ],
          resources: ['*']
        })
      ],
      cognitoDashboardsAuth: {
        userPoolId: props.adminPool.userPoolId,
        identityPoolId: props.adminIdentityPool.ref,
        role: props.adminRole
      }
    });
  }
}
