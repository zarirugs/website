import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
export function storefrontDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  const directory = new URL("../../db/migrations/", import.meta.url);
  for (const file of readdirSync(directory).filter((file) => file.endsWith(".sql")).sort()) database.exec(readFileSync(new URL(file, directory), "utf8"));
  return database;
}
