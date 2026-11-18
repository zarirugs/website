import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
export function fixture(overrides = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const migrations = path.join(root, "../db/migrations");
  for (const file of readdirSync(migrations)
    .filter((f) => f.endsWith(".sql"))
    .sort())
    sqlite.exec(readFileSync(path.join(migrations, file), "utf8"));
  const database = {
    prepare(sql) {
      const statement = {
        sql,
        args: [],
        bind(...args) {
          return { ...statement, args };
        },
        async first() {
          return sqlite.prepare(sql).get(...this.args) ?? null;
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...this.args) };
        },
        async run() {
          return sqlite.prepare(sql).run(...this.args);
        },
      };
      return statement;
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = statements.map((s) => {
          const prepared = sqlite.prepare(s.sql);
          return prepared.columns().length
            ? { results: prepared.all(...s.args) }
            : { results: [], meta: prepared.run(...s.args) };
        });
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  let authorized = true;
  function load(file) {
    const source = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const loaded = { exports: {} };
    new Function("require", "module", "exports", source)(
      (id) => {
        if (Object.hasOwn(overrides, id)) return overrides[id];
        if (id === "@/lib/server/guard")
          return {
            authenticatedAdminContext: async () =>
              authorized
                ? {
                    database,
                    admin: {
                      id: "test-admin",
                      fullName: "Test admin",
                      role: "owner",
                    },
                  }
                : null,
          };
        if (id.startsWith("@/"))
          return load(path.join(root, id.slice(2) + ".ts"));
        return require(id);
      },
      loaded,
      loaded.exports,
    );
    return loaded.exports;
  }
  return {
    sqlite,
    database,
    route: (file) => load(path.join(root, "app/api", file, "route.ts")),
    deny() {
      authorized = false;
    },
  };
}
export const request = (body, method = "POST") =>
  new Request("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
