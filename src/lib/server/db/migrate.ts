import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function runMigrations() {
	const migrationsFolder = resolve(__dirname, '../../../../drizzle');
	try {
		migrate(db, { migrationsFolder });
		console.log('[DB] Migrations applied successfully');
	} catch (err) {
		console.error('[DB] Migration failed:', err);
		throw err;
	}
}
