import { db } from '../db/index.js';
import { backupConfigs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface BackupConfig {
	serverId: string;
	enabled: boolean;
	interval: string;
	method: string;
	pruneDays: number;
	config: Record<string, unknown> | null;
}

export async function getBackupConfig(serverId: string): Promise<BackupConfig | null> {
	const rows = await db.select().from(backupConfigs).where(eq(backupConfigs.serverId, serverId));
	if (rows.length === 0) return null;
	const row = rows[0];
	return {
		serverId: row.serverId,
		enabled: row.enabled ?? false,
		interval: row.interval ?? '24h',
		method: row.method ?? 'tar',
		pruneDays: row.pruneDays ?? 7,
		config: row.config as Record<string, unknown> | null
	};
}

export async function upsertBackupConfig(
	serverId: string,
	input: Partial<Omit<BackupConfig, 'serverId'>>
): Promise<BackupConfig> {
	const existing = await getBackupConfig(serverId);

	if (existing) {
		await db
			.update(backupConfigs)
			.set({
				enabled: input.enabled ?? existing.enabled,
				interval: input.interval ?? existing.interval,
				method: input.method ?? existing.method,
				pruneDays: input.pruneDays ?? existing.pruneDays,
				config: (input.config ?? existing.config) as unknown as string
			})
			.where(eq(backupConfigs.serverId, serverId));
	} else {
		await db.insert(backupConfigs).values({
			serverId,
			enabled: input.enabled ?? false,
			interval: input.interval ?? '24h',
			method: input.method ?? 'tar',
			pruneDays: input.pruneDays ?? 7,
			config: (input.config ?? null) as string | null
		});
	}

	return (await getBackupConfig(serverId))!;
}
