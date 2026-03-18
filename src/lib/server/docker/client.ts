import Dockerode from 'dockerode';
import { config } from '../config.js';

let dockerClient: Dockerode | null = null;

export function getDockerClient(): Dockerode {
	if (!dockerClient) {
		dockerClient = new Dockerode({ socketPath: config.dockerSocket });
	}
	return dockerClient;
}

export async function pingDocker(): Promise<boolean> {
	try {
		await getDockerClient().ping();
		return true;
	} catch {
		return false;
	}
}
