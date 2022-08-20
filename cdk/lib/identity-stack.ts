import { Stack, StackProps } from 'aws-cdk-lib';
import { CfnIdentityPool, UserPool, UserPoolClient, UserPoolClientIdentityProvider, UserPoolIdentityProviderGoogle } from 'aws-cdk-lib/aws-cognito';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
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
  adminRole: Role;

  constructor(scope: Construct, id: string, props: IdentityStackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, 'OidcUsers', {
      selfSignUpEnabled: true
    });
    this.userPool.addDomain('default', {
      cognitoDomain: {
        domainPrefix: this.prefixFromStage(props.stage)
      }
    })

    new UserPoolIdentityProviderGoogle(this, 'GoogleOidcProvider', {
      userPool: this.userPool,
      clientId: props.googleCredentials.clientId,
      clientSecret: props.googleCredentials.clientSecret,
      scopes: ['openid']
    });

    new UserPoolClient(this, 'GoogleOidcClient', {
      userPool: this.userPool,
      generateSecret: true,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE],
      oAuth: {
        callbackUrls: [APP_CALLBACK_URL]
      }
    });

    // Opensearch Dashboard access
    this.adminUserPool = new UserPool(this, 'AdminUsers', {
      selfSignUpEnabled: false
    });
    this.adminUserPool.addDomain('default', {
      cognitoDomain: {
        domainPrefix: `${this.prefixFromStage(props.stage)}-admin`
      }
    });

    new UserPoolIdentityProviderGoogle(this, 'AdminGoogleOidcProvider', {
      userPool: this.adminUserPool,
      clientId: props.googleCredentials.clientId,
      clientSecret: props.googleCredentials.clientSecret,
      scopes: ['openid']
    });

    const adminUserPoolClient = new UserPoolClient(this, 'AdminGoogleOidcClient', {
      userPool: this.adminUserPool,
      generateSecret: true,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE],
      oAuth: {
        callbackUrls: [APP_CALLBACK_URL]
      }
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

    this.adminRole = new Role(this, 'AdminRole', {
      assumedBy: new ServicePrincipal("opensearchservice.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonOpenSearchServiceCognitoAccess')
      ]
    });
  }

  prefixFromStage(stage: string): string {
    return `${this.account}-${stage}-soapbox`;
  }
}
