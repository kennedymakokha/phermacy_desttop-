import { getDatabase } from "./connection.ts";
import { runMigrations } from "./migrations.ts";
import { seedDatabase } from "./seed.ts";

let initialized = false;

export function initializeDatabase() {
  const db = getDatabase();

  if (!initialized) {
    runMigrations(db);
    seedDatabase(db);

    initialized = true;
  }

  return db;
}

export function getDb() {
  return initializeDatabase();
}