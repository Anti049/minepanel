export interface ContainerInfo {
	id: string;
	name: string;
	image: string;
	status: string;
	state: string;
	ports: PortBinding[];
	labels: Record<string, string>;
}

export interface PortBinding {
	hostPort: number;
	containerPort: number;
	protocol: 'tcp' | 'udp';
}

export interface ContainerStats {
	cpuPercent: number;
	memoryUsage: number;
	memoryLimit: number;
	memoryPercent: number;
	networkRx: number;
	networkTx: number;
}

export interface DockerComposeService {
	image: string;
	container_name?: string;
	restart?: string;
	environment?: Record<string, string | number | boolean>;
	ports?: string[];
	volumes?: string[];
	networks?: string[];
	mem_limit?: string;
	cpus?: string | number;
	labels?: Record<string, string>;
	depends_on?: string[];
}

export interface DockerComposeFile {
	version?: string;
	services: Record<string, DockerComposeService>;
	volumes?: Record<string, unknown>;
	networks?: Record<string, unknown>;
}
