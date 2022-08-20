export interface UserMessage {
  readonly messageId: string;
  readonly content: MessageContent;
}

export interface MessageContent {
  readonly phrase1: Phrase;
  readonly phrase2?: Phrase;
  readonly conjunction?: Conjunction;
}

interface Phrase {
  readonly template: Template;
  readonly word: Word;
}

enum Template {
  BLANK_AHEAD,
  NO_BLANK_AHEAD,
  BLANK_REQUIRED_AHEAD,
  BE_WARY_OF_BLANK,
  TRY_BLANK,
  COULD_THIS_BE_A_BLANK,
  IF_ONLY_I_HAD_A_BLANK,
  VISIONS_OF_BLANK,
  TIME_FOR_BLANK,
  BLANK,
  BLANK_EXCLAIM,
  BLANK_QUESTION,
  BLANK_ELIPSIS,
  HUH_ITS_A_BLANK,
  PRAISE_THE_BLANK,
  LET_THERE_BE_BLANK,
  AHH_BLANK
}

enum Word {
  HEAD
}

enum Conjunction {
  AND_THEN,
  BUT,
  THEREFORE,
  IN_SHORT,
  OR,
  ONLY,
  BY_THE_WAY,
  SO_TO_SPEAK,
  ALL_THE_MORE,
  COMMA
}

export function convertDocumentsToMessages(documents: any[]): UserMessage[] {
  return documents.map(doc => {
    return {
      messageId: doc._id,
      content: JSON.parse(doc._source.content)
    }
  });
}

export function validateMessageContent(content: any): MessageContent {
  return <MessageContent> content;
}

