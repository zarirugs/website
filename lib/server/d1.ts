/**
 * The small portion of the Cloudflare D1 API used by this app. Keeping this
 * structural type local lets `next dev` typecheck without adding Workers types
 * to the browser-facing TypeScript configuration.
 */
export interface D1Result<T = unknown> {
  results: T[];
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}
