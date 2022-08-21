import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { AuthorizationType, CognitoUserPoolsAuthorizer, ContentHandling, Integration, LambdaIntegration, MethodOptions, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Domain } from 'aws-cdk-lib/aws-opensearchservice';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

interface UserApiStackProps extends StackProps {
  readonly userPool: UserPool;
  readonly stageName: string;
  readonly vpc?: Vpc;
  readonly domain: Domain;
  readonly authEnabled: boolean;
}

const DUMMY_USER_ID = "TestUser";

export class UserApiStack extends Stack {
  constructor(scope: Construct, id: string, props: UserApiStackProps) {
    super(scope, id, props);

    const api = new RestApi(this, 'UserApi', {
      deployOptions: {
        stageName: props.stageName
      },
    });

    let authorizer;
    if (props.authEnabled) {
      authorizer = new CognitoUserPoolsAuthorizer(this, 'UserApiAuthorizer', {
        cognitoUserPools: [props.userPool],
        identitySource: 'method.request.header.Authorization'
      });
    }

    const defaultMethodOptions: MethodOptions = {
      authorizationType: props.authEnabled ? AuthorizationType.COGNITO : undefined,
      authorizer: props.authEnabled ? authorizer : undefined
    };

    const messagesResource = api.root.addResource('messages');
    messagesResource.addMethod('GET', this.buildGetMessagesIntegration(props.domain, props.authEnabled, props.vpc), {
      ...defaultMethodOptions,
      methodResponses: [
        {
          statusCode: '200'
        }
      ]
    });
    messagesResource.addMethod('POST', this.buildPostMessageIntegration(props.domain, props.authEnabled, props.vpc), {
      ...defaultMethodOptions,
      methodResponses: [
        {
          statusCode: '204'
        },
        {
          statusCode: '400'
        }
      ]
    });
    messagesResource.addMethod('DELETE', this.buildDeleteMessageIntegration(props.domain, props.authEnabled, props.vpc), {
      ...defaultMethodOptions,
      requestParameters: {
        'method.request.querystring.messageId': true
      },
      methodResponses: [
        {
          statusCode: '204'
        }
      ]
    });
    const locationResource = messagesResource.addResource("{location}");
    locationResource.addMethod('GET', this.buildGetLocationMessagesIntegration(props.domain, props.authEnabled, props.vpc), {
      ...defaultMethodOptions,
      requestParameters: {
        'method.request.path.location': true
      },
      methodResponses: [
        {
          statusCode: '200'
        }
      ]
    });
  }

  buildGetMessagesIntegration(domain: Domain, authEnabled: boolean, vpc?: Vpc): Integration {
    const role = new Role(this, 'GetUserMessagesRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        GetMessagesPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'es:ESHttpPost',
                'es:ESHttpGet'
              ],
              effect: Effect.ALLOW,
              resources: [
                `${domain.domainArn}/*`
              ]
            })
          ]
        })
      }
    });

    const handler = new Function(this, 'GetUserMessagesHandler', {
      code: Code.fromAsset(path.join(__dirname, '../../user-api/dist')),
      handler: 'index.handleGetMessages',
      runtime: Runtime.NODEJS_16_X,
      timeout: Duration.seconds(10),
      vpc,
      role,
      environment: {
        DOMAIN_ENDPOINT: domain.domainEndpoint
      }
    });

    return new LambdaIntegration(handler, {
      proxy: false,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestTemplates: {
        'application/json': `{
            "userId": "${authEnabled ? '$context.authorizer.claims.sub' : DUMMY_USER_ID}"
          }`
      },
      integrationResponses: [
        {
          statusCode: '200'
        }
      ]
    });
  }

  buildPostMessageIntegration(domain: Domain, authEnabled: boolean, vpc?: Vpc): Integration {
    const role = new Role(this, 'PostUserMessageRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        GetMessagesPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'es:ESHttpPost',
                'es:ESHttpPut',
                'es:ESHttpDelete',
                'es:ESHttpGet'
              ],
              effect: Effect.ALLOW,
              resources: [
                `${domain.domainArn}/*`
              ]
            })
          ]
        })
      }
    });

    const handler = new Function(this, 'PostUserMessageHandler', {
      code: Code.fromAsset(path.join(__dirname, '../../user-api/dist')),
      handler: 'index.handlePostMessage',
      runtime: Runtime.NODEJS_16_X,
      timeout: Duration.seconds(10),
      vpc,
      role,
      environment: {
        DOMAIN_ENDPOINT: domain.domainEndpoint
      }
    });

    return new LambdaIntegration(handler, {
      proxy: false,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestTemplates: {
        'application/json': `{
  "userId": "${authEnabled ? '$context.authorizer.claims.sub' : DUMMY_USER_ID}",
  "message": $input.json('$.message'),
  "location": $input.json('$.location')
}`
      },
      integrationResponses: [
        {
          statusCode: '204'
        },
        {
          statusCode: '400',
          selectionPattern: 'Invalid',
          responseTemplates: {
            'application/json': ''
          }
        }
      ]
    });
  }

  buildDeleteMessageIntegration(domain: Domain, authEnabled: boolean, vpc?: Vpc): Integration {
    const role = new Role(this, 'DeleteUserMessageRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        GetMessagesPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'es:ESHttpPost',
                'es:ESHttpDelete',
                'es:ESHttpGet'
              ],
              effect: Effect.ALLOW,
              resources: [
                `${domain.domainArn}/*`
              ]
            })
          ]
        })
      }
    });

    const handler = new Function(this, 'DeleteUserMessageHandler', {
      code: Code.fromAsset(path.join(__dirname, '../../user-api/dist')),
      handler: 'index.handleDeleteMessage',
      runtime: Runtime.NODEJS_16_X,
      timeout: Duration.seconds(10),
      vpc,
      role,
      environment: {
        DOMAIN_ENDPOINT: domain.domainEndpoint
      }
    });

    return new LambdaIntegration(handler, {
      proxy: false,
      requestParameters: {
        'integration.request.querystring.messageId': 'method.request.querystring.messageId'
      },
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestTemplates: {
        'application/json': `{
  "userId": "${authEnabled ? '$context.authorizer.claims.sub' : DUMMY_USER_ID}",
  "messageId": "$input.params('messageId')"
}`
      },
      integrationResponses: [
        {
          statusCode: '204'
        }
      ]
    });
  }

  buildGetLocationMessagesIntegration(domain: Domain, authEnabled: boolean, vpc?: Vpc): Integration {
    const role = new Role(this, 'GetLocationMessagesRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        GetMessagesPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'es:ESHttpPost',
                'es:ESHttpGet'
              ],
              effect: Effect.ALLOW,
              resources: [
                `${domain.domainArn}/*`
              ]
            })
          ]
        })
      }
    });

    const handler = new Function(this, 'GetLocationMessagesHandler', {
      code: Code.fromAsset(path.join(__dirname, '../../user-api/dist')),
      handler: 'index.handleGetLocationMessages',
      runtime: Runtime.NODEJS_16_X,
      timeout: Duration.seconds(10),
      vpc,
      role,
      environment: {
        DOMAIN_ENDPOINT: domain.domainEndpoint
      }
    });

    return new LambdaIntegration(handler, {
      proxy: false,
      requestParameters: {
        'integration.request.path.location': 'method.request.path.location'
      },
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestTemplates: {
        'application/json': `{
  "location": "$input.params('location')"
}`
      },
      integrationResponses: [
        {
          statusCode: '200'
        }
      ]
    });
  }
}
