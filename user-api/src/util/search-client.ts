import { Client } from '@opensearch-project/opensearch';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
const createAwsOpensearchConnector = require('aws-opensearch-connector')

export const getClient = async (host: string) => {
  const awsCredentials = await defaultProvider()();
  const connector = createAwsOpensearchConnector({
      credentials: awsCredentials,
      region: process.env.AWS_REGION ?? 'us-east-1',
      getCredentials: function(cb: () => any) {
          return cb();
      }
  });
  return new Client({
      ...connector,
      node: `https://${host}`,
  });
}
