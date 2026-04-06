import '@opennextjs/cloudflare';

declare global {
  type Fetcher = unknown;
  type ImagesBinding = unknown;
  type Service = unknown;
  type DurableObjectNamespace<T = unknown> = unknown;
  type Queue = unknown;

  interface IncomingRequestCfProperties {
    [key: string]: unknown;
  }

  interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = Record<string, unknown>>(): Promise<T | null>;
    all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
    run(): Promise<{ success: boolean }>;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
  }

  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(
      key: string,
      value: string,
      options?: {
        expirationTtl?: number;
      },
    ): Promise<void>;
  }

  interface R2Bucket {
    put(key: string, value: unknown): Promise<unknown>;
    get(key: string): Promise<unknown>;
    head(key: string): Promise<unknown>;
  }

  interface CloudflareEnv {
    DB: D1Database;
    CACHE: KVNamespace;
    MIGRATION_BUCKET: R2Bucket;
    AUTH_SECRET: string;
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SECRET: string;
    API_NINJAS_KEY?: string;
    RAPIDAPI_KEY?: string;
    RAPIDAPI_HOST?: string;
    VERCEL_API_TOKEN?: string;
    VERCEL_TEAM_ID?: string;
  }
}

export {};
