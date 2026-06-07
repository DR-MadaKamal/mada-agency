import { Agent, callable } from "agents";

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'sharepoint' | 'drive' | 'sql' | 'graph' | 'web' | 'local';
  status: 'ready' | 'indexing' | 'error';
  documentCount: number;
  lastSynced: string;
}

export interface State {
  name: string;
  role: string;
  status: 'active' | 'standby' | 'training' | 'error';
  capabilities: string[];
  metrics: { tasksCompleted: number; latency: string; uptime: number };
  knowledgeBases: KnowledgeSource[];
  indexedDocuments: number;
  logs: { timestamp: string; level: string; message: string }[];
}

export class KnowledgeMiner extends Agent<Env, State> {
  initialState: State = {
    name: "Knowledge Miner",
    role: "Grounding Expert",
    status: "active",
    capabilities: ["rest_api", "vision", "web"],
    metrics: { tasksCompleted: 450, latency: "400ms", uptime: 98.5 },
    knowledgeBases: [{
      id: "kb1",
      name: "Corporate SharePoint",
      type: "sharepoint",
      status: "ready",
      documentCount: 1420,
      lastSynced: new Date().toISOString()
    }],
    indexedDocuments: 1420,
    logs: [{ timestamp: new Date().toISOString(), level: "info", message: "Knowledge Miner initialized" }]
  };

  @callable()
  getState(): State {
    return this.state;
  }

  @callable()
  async indexSource(source: KnowledgeSource): Promise<void> {
    this.setState({
      ...this.state,
      knowledgeBases: [...this.state.knowledgeBases, { ...source, status: 'ready' as const }],
      indexedDocuments: this.state.indexedDocuments + source.documentCount,
      logs: [...this.state.logs, { timestamp: new Date().toISOString(), level: "info", message: `Indexed: ${source.name} (${source.documentCount} docs)` }]
    });
  }

  @callable()
  async search(query: string): Promise<{ source: string; snippet: string; relevance: number }[]> {
    const ts = new Date().toISOString();
    this.setState({
      ...this.state,
      metrics: {
        ...this.state.metrics,
        tasksCompleted: this.state.metrics.tasksCompleted + 1,
      },
      logs: [...this.state.logs, { timestamp: ts, level: "info", message: `Search: "${query.substring(0, 50)}..."` }]
    });
    return this.state.knowledgeBases.map(kb => ({
      source: kb.name,
      snippet: `AI-generated context from ${kb.name} matching "${query}"`,
      relevance: 0.85
    }));
  }

  @callable()
  async logMessage(level: string, message: string): Promise<void> {
    this.setState({
      ...this.state,
      logs: [...this.state.logs, { timestamp: new Date().toISOString(), level, message }]
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith("__state")) {
      return new Response(JSON.stringify(this.state), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname.includes("__call/")) {
      const method = url.pathname.split("__call/")[1];
      const { args } = await request.json() as { args: any[] };
      if (method === "indexSource") {
        await this.indexSource(args[0] as any);
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      }
      if (method === "search") {
        const results = await this.search(args[0] as string);
        return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
      }
      if (method === "logMessage") {
        await this.logMessage(args[0] as string, args[1] as string);
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Unknown method: ${method}` }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    return super.fetch(request);
  }
}
