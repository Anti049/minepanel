export type ServerEdition = 'JAVA' | 'BEDROCK';

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export type JavaServerType =
	| 'VANILLA'
	| 'PAPER'
	| 'PURPUR'
	| 'SPIGOT'
	| 'FABRIC'
	| 'FORGE'
	| 'QUILT'
	| 'MOHIST'
	| 'CATSERVER'
	| 'FOLIA'
	| 'BUNGEECORD'
	| 'WATERFALL'
	| 'VELOCITY';

export type BedrockServerType = 'VANILLA' | 'POCKETMINE' | 'NUKKIT';

export interface ServerConfig {
	// Core settings
	edition: ServerEdition;
	serverType: JavaServerType | BedrockServerType;
	version: string;

	// Resource limits
	memoryMin: string;
	memoryMax: string;
	cpuLimit: string;

	// Network
	port: number;
	rconPort: number;
	voiceChatPort: number;
	enableRcon: boolean;
	rconPassword: string;

	// Java-specific settings
	eula?: boolean;
	difficulty?: 'peaceful' | 'easy' | 'normal' | 'hard';
	gamemode?: 'survival' | 'creative' | 'adventure' | 'spectator';
	maxPlayers?: number;
	viewDistance?: number;
	simulationDistance?: number;
	onlineMode?: boolean;
	whitelist?: boolean;
	pvp?: boolean;
	motd?: string;
	levelName?: string;
	levelSeed?: string;
	spawnProtection?: number;
	enableCommandBlock?: boolean;

	// Bedrock-specific
	levelType?: 'DEFAULT' | 'FLAT' | 'LEGACY';

	// mc-router proxy
	proxyEnabled?: boolean;
	proxyHostname?: string;

	// Extra environment variables
	extraEnv?: Record<string, string>;
}

export interface Server {
	id: string;
	name: string;
	edition: ServerEdition;
	serverType: string;
	version: string;
	port: number;
	rconPort: number | null;
	voiceChatPort: number | null;
	memoryMin: string;
	memoryMax: string;
	cpuLimit: string;
	config: ServerConfig | null;
	status: ServerStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateServerInput {
	id: string;
	name: string;
	edition?: ServerEdition;
	serverType?: string;
	version?: string;
	basePort?: number;
	config?: Partial<ServerConfig>;
}

export interface UpdateServerInput {
	name?: string;
	serverType?: string;
	version?: string;
	memoryMin?: string;
	memoryMax?: string;
	cpuLimit?: string;
	config?: Partial<ServerConfig>;
}

export type WSMessage =
	| { type: 'subscribe_logs'; serverId: string }
	| { type: 'unsubscribe_logs'; serverId: string }
	| { type: 'log_data'; serverId: string; data: string; timestamp: string }
	| { type: 'subscribe_stats'; serverId: string }
	| { type: 'unsubscribe_stats'; serverId: string }
	| {
			type: 'stats_data';
			serverId: string;
			cpu: string;
			memory: string;
			memoryLimit: string;
	  }
	| {
			type: 'server_event';
			serverId: string;
			event: 'started' | 'stopped' | 'died' | 'created' | 'destroyed';
	  }
	| { type: 'error'; message: string };
