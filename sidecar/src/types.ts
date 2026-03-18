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
