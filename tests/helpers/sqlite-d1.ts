import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { D1Database, D1PreparedStatement, D1Result } from "@/lib/server/d1";

class SqliteStatement implements D1PreparedStatement {
  private values: SQLInputValue[] = [];

  constructor(private database: DatabaseSync, private query: string) {}

  bind(...values: unknown[]) {
    this.values = values as SQLInputValue[];
    return this;
  }

  async first<T>(): Promise<T | null> {
    return (this.database.prepare(this.query).get(...this.values) as T | undefined) ?? null;
  }

  async all<T>(): Promise<D1Result<T>> {
    return { results: this.database.prepare(this.query).all(...this.values) as T[] };
  }

  async run(): Promise<D1Result> {
    this.database.prepare(this.query).run(...this.values);
    return { results: [] };
  }
}

/** Execute the route's actual SQL against SQLite, including atomic D1 batches. */
export function sqliteD1(database: DatabaseSync): D1Database {
  return {
    prepare: (query) => new SqliteStatement(database, query),
    async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      database.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all<T>());
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
