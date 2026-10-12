export type MigrationEnvironment = {
  DIRECT_URL?: string;
  DATABASE_URL?: string;
};

export declare function resolveMigrationUrl(environment?: MigrationEnvironment): {
  url: string;
  derivedDirectUrl: boolean;
};
