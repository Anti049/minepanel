import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { config } from '../config.js';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
	if (!_db) {
		const sqlite = new Database(config.databaseUrl);
		// Enable WAL mode for better concurrent read performance
		sqlite.pragma('journal_mode = WAL');
		sqlite.pragma('foreign_keys = ON');
		_db = drizzle(sqlite, { schema });
	}
	return _db;
}

// Backwards-compat proxy so existing code using `db` still works at runtime
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_target, prop) {
		return getDb()[prop as keyof ReturnType<typeof drizzle>];
	}
});

export type DB = ReturnType<typeof getDb>;
