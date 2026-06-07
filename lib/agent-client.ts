const AGENT_WORKER_URL = 'https://mada-agency-agents.16491.workers.dev';

export class AgentClient {
  private workerUrl: string;
  private agentName: string;
  private instanceName: string;

  constructor(agentName: string, instanceName: string, workerUrl?: string) {
    this.agentName = agentName;
    this.instanceName = instanceName;
    this.workerUrl = workerUrl || AGENT_WORKER_URL;
  }

  async call(method: string, ...args: any[]): Promise<any> {
    const res = await fetch(`${this.workerUrl}/call/${this.agentName}/${this.instanceName}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`Agent call failed (${res.status}):`, err);
      return null;
    }
    return res.json();
  }

  async getState(): Promise<any> {
    const res = await fetch(`${this.workerUrl}/state/${this.agentName}/${this.instanceName}`);
    if (!res.ok) {
      console.warn(`Agent state fetch failed: ${res.status}`);
      return null;
    }
    return res.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.workerUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export function createAgent(agentName: string, instanceName: string) {
  return new AgentClient(agentName, instanceName);
}

export const strategicOrchestrator = () => createAgent('StrategicOrchestrator', 'master-agent');
export const knowledgeMiner = () => createAgent('KnowledgeMiner', 'data-agent');
export const nexusAssistant = (sessionId: string) => createAgent('NexusAssistant', sessionId);
