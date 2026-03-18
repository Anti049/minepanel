import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const servers = sqliteTable('servers', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	edition: text('edition', { enum: ['JAVA', 'BEDROCK'] }).notNull().default('JAVA'),
	serverType: text('server_type').notNull().default('VANILLA'),
	version: text('version').notNull().default('latest'),
	port: integer('port').notNull(),
	rconPort: integer('rcon_port'),
	voiceChatPort: integer('voice_chat_port'),
	memoryMin: text('memory_min').default('2G'),
	memoryMax: text('memory_max').default('4G'),
	cpuLimit: text('cpu_limit').default('2'),
	config: text('config', { mode: 'json' }),
	status: text('status', {
		enum: ['stopped', 'starting', 'running', 'stopping', 'error']
	}).default('stopped'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value', { mode: 'json' })
});

export const backupConfigs = sqliteTable('backup_configs', {
	serverId: text('server_id')
		.primaryKey()
		.references(() => servers.id),
	enabled: integer('enabled', { mode: 'boolean' }).default(false),
	interval: text('interval').default('24h'),
	method: text('method').default('tar'),
	pruneDays: integer('prune_days').default(7),
	config: text('config', { mode: 'json' })
});
