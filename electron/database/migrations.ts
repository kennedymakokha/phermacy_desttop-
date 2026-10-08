
import type Database from "better-sqlite3";

import { schema } from "./schema.ts";

/* -------------------------------------------------------------------------- */
/* Migration type                                                             */
/* -------------------------------------------------------------------------- */

export type Migration = {
  version: number;
  name: string;
  sql: string;
};

/* -------------------------------------------------------------------------- */
/* Migrations                                                                 */
/* -------------------------------------------------------------------------- */

const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_pharmacy_schema",
    sql: schema,
  },

  {
    version: 2,
    name: "inventory_adjustments",
    sql: `
      CREATE TABLE IF NOT EXISTS inventory_adjustments (
        id TEXT PRIMARY KEY,

        medicine_id TEXT NOT NULL,
        batch_id TEXT NOT NULL,

        adjustment_type TEXT NOT NULL
          CHECK (
            adjustment_type IN (
              'add',
              'remove',
              'set'
            )
          ),

        previous_quantity INTEGER NOT NULL,
        adjustment_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,

        reason TEXT NOT NULL,
        notes TEXT,

        adjusted_by TEXT,
        adjusted_by_name TEXT,

        created_at TEXT NOT NULL,

        FOREIGN KEY (medicine_id)
          REFERENCES medicines(id)
          ON DELETE RESTRICT,

        FOREIGN KEY (batch_id)
          REFERENCES medicine_batches(id)
          ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS
        idx_inventory_adjustments_medicine
        ON inventory_adjustments(medicine_id);

      CREATE INDEX IF NOT EXISTS
        idx_inventory_adjustments_batch
        ON inventory_adjustments(batch_id);

      CREATE INDEX IF NOT EXISTS
        idx_inventory_adjustments_created
        ON inventory_adjustments(created_at);
    `,
  },
];

/* -------------------------------------------------------------------------- */
/* Migration runner                                                           */
/* -------------------------------------------------------------------------- */

export function runMigrations(
  db: Database.Database,
): void {
  /*
   * Keep track of which migrations have already
   * been successfully applied.
   */
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db
    .prepare(
      `
        SELECT version
        FROM schema_migrations
        ORDER BY version ASC
      `,
    )
    .all() as Array<{
      version: number;
    }>;

  const appliedVersions = new Set<number>(
    appliedRows.map(
      (row) => row.version,
    ),
  );

  const pendingMigrations = migrations
    .filter(
      (migration) =>
        !appliedVersions.has(
          migration.version,
        ),
    )
    .sort(
      (a, b) =>
        a.version - b.version,
    );

  /*
   * Apply migrations one at a time.
   *
   * If a migration fails, the transaction rolls back
   * and its version is NOT recorded.
   */
  for (const migration of pendingMigrations) {
    const applyMigration = db.transaction(
      () => {
        db.exec(migration.sql);

        db.prepare(
          `
            INSERT INTO schema_migrations (
              version,
              name,
              applied_at
            )
            VALUES (?, ?, ?)
          `,
        ).run(
          migration.version,
          migration.name,
          new Date().toISOString(),
        );
      },
    );

    applyMigration();
  }
}
