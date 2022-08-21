import { getClient } from "../util/search-client";

const DOMAIN_ENDPOINT = process.env.DOMAIN_ENDPOINT!;

interface Request {
  readonly userId: string;
  readonly messageId: string;
}

export const handleDeleteMessage = async (event: Request): Promise<void> => {
  console.debug(JSON.stringify(event));

  const userId = event.userId;
  const messageId = event.messageId;
  const client = await getClient(DOMAIN_ENDPOINT);

  const messageResult = await client.get({
    id: messageId,
    index: 'messages'
  });

  if (messageResult.statusCode === 200 && messageResult.body.userId === userId) {
    await client.delete({
      id: messageId,
      index: 'messages'
    });
  }
}
