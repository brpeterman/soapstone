import { validateMessageContent } from "../../src/util/messages";

describe('validateMessageContent', () => {
  it('accepts simple message', () => {
    const message = validateMessageContent({
      phrase1: {
        template: 'BLANK',
        word: 'HEAD'
      }
    });

    expect(message.phrase1.template).toBe('BLANK');
    expect(message.phrase1.word).toBe('HEAD');
    expect(message.phrase2).toBeUndefined();
    expect(message.conjunction).toBeUndefined();
  });

  it('accepts compound message', () => {
    const message = validateMessageContent({
      phrase1: {
        template: 'BLANK',
        word: 'HEAD'
      },
      phrase2: {
        template: 'BLANK',
        word: 'HEAD'
      },
      conjunction: 'BUT'
    });

    expect(message.phrase1.template).toBe('BLANK');
    expect(message.phrase1.word).toBe('HEAD');
    expect(message.phrase2?.template).toBe('BLANK');
    expect(message.phrase2?.word).toBe('HEAD');
    expect(message.conjunction).toBe('BUT');
  });

  it('rejects empty message', () => {
    try {
      validateMessageContent({});
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid message content");
    }
  });

  it('rejects missing phrase1', () => {
    try {
      validateMessageContent({
        phrase2: {
          template: 'BLANK',
          word: 'HEAD'
        },
        conjunction: 'BUT'
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid message content");
    }
  });

  it('rejects missing conjunction', () => {
    try {
      validateMessageContent({
        phrase1: {
          template: 'BLANK',
          word: 'HEAD'
        },
        phrase2: {
          template: 'BLANK',
          word: 'HEAD'
        }
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid message content");
    }
  });

  it('rejects extraneous conjunction', () => {
    try {
      validateMessageContent({
        phrase1: {
          template: 'BLANK',
          word: 'HEAD'
        },
        conjunction: 'BUT'
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid message content");
    }
  });

  it('rejects missing template', () => {
    try {
      validateMessageContent({
        phrase1: {
          word: 'HEAD'
        }
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid message content");
    }
  });

  it('rejects invalid template', () => {
    try {
      validateMessageContent({
        phrase1: {
          template: 'NONSENSE',
          word: 'HEAD'
        }
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid message content");
    }
  });

  it('rejects missing word', () => {
    try {
      validateMessageContent({
        phrase1: {
          template: 'BLANK'
        }
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid message content");
    }
  });

  it('rejects invalid word', () => {
    try {
      validateMessageContent({
        phrase1: {
          template: 'BLANK',
          word: 'NONSENSE'
        }
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid message content");
    }
  });
});
