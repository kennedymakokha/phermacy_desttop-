import { schema } from "./schema";
const migrations = [
    {
        version: 1,
        name: "initial_pharmacy_schema",
        sql: schema,
    },
];
function createMigrationTable(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}
export function runMigrations(db) {
    createMigrationTable(db);
    const currentVersion = db
        .prepare(`
      SELECT COALESCE(MAX(version), 0) AS version
      FROM schema_migrations
      `)
        .get();
    const pendingMigrations = migrations.filter((migration) => migration.version > currentVersion.version);
    for (const migration of pendingMigrations) {
        const runMigration = db.transaction(() => {
            db.exec(migration.sql);
            db.prepare(`
        INSERT INTO schema_migrations
        (
          version,
          name,
          applied_at
        )
        VALUES (?, ?, ?)
        `).run(migration.version, migration.name, new Date().toISOString());
        });
        runMigration();
    }
}
