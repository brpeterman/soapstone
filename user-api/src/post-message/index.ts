import { Location, validateLocation } from "../util/location";
import { MessageContent, validateMessageContent } from "../util/messages";
import { getClient } from "../util/search-client";

const DOMAIN_ENDPOINT = process.env.DOMAIN_ENDPOINT!;

interface Request {
  readonly userId: string;
  readonly message: any;
  readonly location: any;
}

function currentTimestamp(): string {
  return new Date().toISOString();
}

function userMessagesQuery(userId: string) {
  return {
    term: {
      userId
    }
  };
}

export const handlePostMessage = async (event: Request): Promise<void> => {
  console.debug(JSON.stringify(event));
  const userId = event.userId;
  const content = validateMessageContent(event.message);
  const location = validateLocation(event.location);
  const client = await getClient(DOMAIN_ENDPOINT);

  console.debug(`Posting message for user ${userId} at location ${JSON.stringify(location)}`);

  await client.index({
    body: {
      userId,
      content: JSON.stringify(content),
      location: {
        lat: location.latitude,
        lon: location.longitude
      },
      '@timestamp': currentTimestamp()
    },
    index: 'messages'
  });

  // Find older messages and delete them
  const oldDocs = await client.search({
    index: 'messages',
    body: {
      query: userMessagesQuery(userId),
      from: 30,
      sort: {
        '@timestamp': {
          order: 'desc'
        }
      }
    }
  });
  if (oldDocs.body.hits?.hits) {
    await client.deleteByQuery({
      index: 'messages',
      body: {
        query: {
          bool: {
            should: oldDocs.body.hits?.hits?.map((doc: any) => {
              return { term: doc._id }
            })
          }
        }
      }
    });
  }
}
