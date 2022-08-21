import { handlePostMessage } from "../src/post-message";

jest.mock("../src/util/search-client")

describe('post message', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should discard invalid messages', async () => {
    const message = {
      nonsense: 'nothing'
    };
    await handlePostMessage({
      location: {
        latitude: 1,
        longitude: 1
      },
      message,
      userId: 'test'
    });
  });
});
