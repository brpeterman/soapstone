import { Location } from "../util/location";
import { MessageContent, validateMessageContent } from "../util/messages";
import { getClient } from "../util/search-client";

const DOMAIN_ENDPOINT = process.env.DOMAIN_ENDPOINT!;

interface Request {
  readonly userId: string;
  readonly content: any;
  readonly location: Location;
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
  const content = validateMessageContent(event.content);
  const location = event.location;
  const client = await getClient(DOMAIN_ENDPOINT);

  console.debug(`Posting message for user ${userId} at location ${JSON.stringify(location)}`);

  await client.index({
    body: {
      userId,
      content: JSON.stringify(content),
      _timestamp: currentTimestamp()
    },
    index: 'messages'
  });

  // Find older messages and delete them
  await client.deleteByQuery({
    index: 'messages',
    body: {
      query: userMessagesQuery(userId),
      from: 30,
      sort: {
        _timestamp: {
          order: 'desc'
        }
      }
    }
  });
}
