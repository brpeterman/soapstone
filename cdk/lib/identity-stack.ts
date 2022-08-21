import { Stack, StackProps } from 'aws-cdk-lib';
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment, CfnUserPoolGroup, UserPool, UserPoolClient, UserPoolClientIdentityProvider, UserPoolIdentityProvider, UserPoolIdentityProviderGoogle } from 'aws-cdk-lib/aws-cognito';
import { Effect, FederatedPrincipal, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { GoogleCredentials } from '.';

const APP_CALLBACK_URL = "soapbox://oidc-callback";

interface IdentityStackProps extends StackProps {
  readonly stage: string;
  readonly googleCredentials: GoogleCredentials;
}

export class IdentityStack extends Stack {
  userPool: UserPool;
  adminUserPool: UserPool;
  adminIdentityPool: CfnIdentityPool;

  constructor(scope: Construct, id: string, props: IdentityStackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, 'GoogleUsers', {
      selfSignUpEnabled: true
    });
    this.userPool.addDomain('default', {
      cognitoDomain: {
        domainPrefix: this.prefixFromStage(props.stage)
      }
    })

    const googleIdProvider = new UserPoolIdentityProviderGoogle(this, 'GoogleIdProvider', {
      userPool: this.userPool,
      clientId: props.googleCredentials.clientId,
      clientSecret: props.googleCredentials.clientSecret,
      scopes: ['openid']
    });

    const googleIdClient = new UserPoolClient(this, 'GoogleIdClient', {
      userPool: this.userPool,
      generateSecret: true,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE],
      oAuth: {
        callbackUrls: [APP_CALLBACK_URL]
      }
    });
    googleIdClient.node.addDependency(googleIdProvider);

    // Opensearch Dashboard access
    this.adminUserPool = new UserPool(this, 'AdminUsers', {
      selfSignUpEnabled: false
    });
    this.adminUserPool.addDomain('default', {
      cognitoDomain: {
        domainPrefix: `${this.prefixFromStage(props.stage)}-admin`
      }
    });

    const adminUserPoolClient = new UserPoolClient(this, 'AdminCognitoPoolClient', {
      userPool: this.adminUserPool,
      generateSecret: true,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO]
    });

    this.adminIdentityPool = new CfnIdentityPool(this, 'AdminIdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: adminUserPoolClient.userPoolClientId,
          providerName: this.adminUserPool.userPoolProviderName
        }
      ]
    });

    const adminRole = new Role(this, 'AdminRole', {
      assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': this.adminIdentityPool.ref
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'authenticated'
        }
      }, 'sts:AssumeRoleWithWebIdentity'),
      inlinePolicies: {
        AdminPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'mobileanalytics:PutEvents',
                'cognito-sync:*',
                'cognito-identity:*'
              ],
              resources: ['*']
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'es:ESHttp*'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    new CfnIdentityPoolRoleAttachment(this, 'AdminRoleAttachment', {
      identityPoolId: this.adminIdentityPool.ref,
      roles: {
        authenticated: adminRole.roleArn
      }
    });
  }

  prefixFromStage(stage: string): string {
    return `${this.account}-${stage}-soapbox`;
  }
}
