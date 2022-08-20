import { convertDocumentsToMessages, UserMessage } from "../util/messages";
import { getClient } from "../util/search-client";

const DOMAIN_ENDPOINT = process.env.DOMAIN_ENDPOINT!;

interface Request {
  readonly userId: string;
}

function userMessagesQuery(userId: string) {
  return {
    term: {
      userId
    }
  };
}

export const handleGetMessages = async (event: Request): Promise<UserMessage[]> => {
  console.debug(JSON.stringify(event));
  const userId = event.userId;
  console.debug(`Fetching messages owned by user ${userId}`);
  const client = await getClient(DOMAIN_ENDPOINT);

  const result = await client.search({
    index: 'messages',
    body: {
      query: userMessagesQuery(userId)
    }
  });

  if (result.statusCode !== 200) {
    console.warn(`Unexpected status code. ${JSON.stringify(result, null, 2)}`);
    return Promise.resolve([]);
  }

  return Promise.resolve(convertDocumentsToMessages(result.body.hits));
}
