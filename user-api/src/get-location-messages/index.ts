import { Location, parseLocation } from "../util/location";
import { convertDocumentsToMessages, UserMessage } from "../util/messages";
import { getClient } from "../util/search-client";

const DOMAIN_ENDPOINT = process.env.DOMAIN_ENDPOINT!;

interface Request {
  readonly location: string;
}

function distanceQuery(location: Location, distance: string): any {
  return {
    bool: {
      must: {
        match_all: {}
      },
      filter: {
        geo_distance: {
          distance,
          location: {
            lat: location.latitude,
            lon: location.longitude
          }
        }
      }
    }
  };
}

export const handleGetLocationMessages = async (event: Request): Promise<UserMessage[]> => {
  console.debug(JSON.stringify(event));
  const location = parseLocation(event.location);
  const client = await getClient(DOMAIN_ENDPOINT);
  console.debug(`Fetching messages near ${JSON.stringify(location)}`);

  const result = await client.search({
    index: 'messages',
    body: {
      query: distanceQuery(location, '100m'),
      size: 20,
      sort: [
        {
          _timestamp: {
            order: 'desc'
          }
        }
      ]
    }
  });

  if (result.statusCode !== 200) {
    console.warn(`Unexpected status code. ${JSON.stringify(result, null, 2)}`);
    return Promise.resolve([]);
  }

  return Promise.resolve(convertDocumentsToMessages(result.body.hits));
}
