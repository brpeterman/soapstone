export interface Credentials {
  readonly devo: StageCredentials;
  readonly prod?: StageCredentials;
}

export interface StageCredentials {
  readonly aws: AwsCredentials;
  readonly google: GoogleCredentials;
}

export interface AwsCredentials {
  readonly accountId: string;
  readonly secretKeyId: string;
  readonly secretAccessKey: string;
}

export interface GoogleCredentials {
  readonly clientId: string,
  readonly clientSecret: string
}

export interface ApplicationConfig {
  readonly devo: StageConfig;
  readonly prod?: StageConfig;
}

export interface StageConfig {
  readonly accountId: string;
  readonly region: string;
  readonly authEnabled: boolean;
  readonly vpcEnabled: boolean;
  readonly searchAvailabilityZones: number;
}
