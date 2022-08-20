import { Credentials } from "../lib";

export const CREDENTIALS: Credentials = {
  devo: {
    aws: {
      accountId: '12DigitAccountId',
      secretKeyId: 'AWS_SECRET_KEY_ID',
      secretAccessKey: 'AWS_SECRET_ACCESS_KEY_ID'
    },
    google: {
      clientId: 'GOOGLE_CLIENT_ID',
      clientSecret: 'GOOGLE_CLIENT_SECRET'
    }
  }
}
