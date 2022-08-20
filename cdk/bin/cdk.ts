#!/usr/bin/env node
import 'source-map-support/register';
import { CREDENTIALS } from "../configuration/credentials";
import { APPLICATION_CONFIG } from "../configuration/application";
import { App } from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { IdentityStack } from '../lib/identity-stack';
import { SearchStack } from '../lib/search-stack';
import { UserApiStack } from '../lib/user-api-stack';

let STAGE: 'devo' | 'prod' = 'devo';
const stageEnv = process.env.DEPLOYMENT_STAGE;
if (stageEnv === 'devo' || stageEnv === 'prod') {
  STAGE = stageEnv;
}

const app = new App({
  autoSynth: true
});

const credentials = CREDENTIALS[STAGE]!;
const config = APPLICATION_CONFIG[STAGE]!;

const env = {
  account: config.accountId,
  region: config.region
};

let vpcStack;
if (config?.vpcEnabled) {
  vpcStack = new VpcStack(app, 'VpcStack', {
    env
  });
}

const identityStack = new IdentityStack(app, 'IdentityStack', {
  env,
  stage: STAGE,
  googleCredentials: credentials?.google
});

const searchStack = new SearchStack(app, 'SearchStack', {
  env,
  availabilityZones: config.searchAvailabilityZones,
  adminPool: identityStack.adminUserPool,
  adminIdentityPool: identityStack.adminIdentityPool,
  adminRole: identityStack.adminRole,
  vpc: vpcStack ? vpcStack.vpc : undefined
});

const userApiStack = new UserApiStack(app, 'UserApiStack', {
  env,
  authEnabled: config.authEnabled,
  domain: searchStack.domain,
  stageName: STAGE,
  userPool: identityStack.userPool
});
