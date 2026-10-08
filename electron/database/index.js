import { getDatabase } from "./connection";
import { runMigrations } from "./migrations";
let initialized = false;
export function initializeDatabase() {
    const db = getDatabase();
    if (!initialized) {
        runMigrations(db);
        initialized = true;
    }
    return db;
}
export function getDb() {
    return initializeDatabase();
}
