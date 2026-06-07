import { routeAgentRequest } from "agents";
import { StrategicOrchestrator } from "./agents/strategic-orchestrator";
import { KnowledgeMiner } from "./agents/knowledge-miner";
import { NexusAssistant } from "./agents/nexus-assistant";

export { StrategicOrchestrator, KnowledgeMiner, NexusAssistant };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/agents/")) {
      const agentResponse = await routeAgentRequest(request, env);
      if (agentResponse) return agentResponse;
    }

    if (url.pathname.startsWith("/state/")) {
      const parts = url.pathname.split("/");
      const agentName = parts[2];
      const instanceName = parts[3];
      if (agentName && instanceName) {
        const binding = (env as any)[agentName] as DurableObjectNamespace;
        if (binding) {
          const id = binding.idFromName(instanceName);
          const stub = binding.get(id);
          const res = await stub.fetch(new Request(`${url.origin}/__state`));
          return res;
        }
      }
      return new Response("Not found", { status: 404 });
    }

    if (url.pathname.startsWith("/call/") && request.method === "POST") {
      const parts = url.pathname.split("/");
      const agentName = parts[2];
      const instanceName = parts[3];
      const method = parts[4];
      if (agentName && instanceName && method) {
        const binding = (env as any)[agentName] as DurableObjectNamespace;
        if (binding) {
          const id = binding.idFromName(instanceName);
          const stub = binding.get(id);
          const { args } = await request.json() as { args: any[] };
          const res = await stub.fetch(new Request(`https://do/__call/${method}`, {
            method: "POST",
            body: JSON.stringify({ args }),
            headers: { "Content-Type": "application/json" },
          }));
          return res;
        }
      }
      return new Response("Not found", { status: 404 });
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", version: "0.1.0" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname.startsWith("/sync/")) {
      const parts = url.pathname.split("/");
      const action = parts[2];
      const db = env.mada_agency_db;

      if (action === "push" && request.method === "POST") {
        const { key, data } = await request.json() as { key: string; data: any };
        const existing = await db.prepare("SELECT id FROM projects WHERE id = ?").bind(key).first();
        if (existing) {
          await db.prepare("UPDATE projects SET data = ?, version = version + 1, updated_at = datetime('now') WHERE id = ?").bind(JSON.stringify(data), key).run();
        } else {
          await db.prepare("INSERT INTO projects (id, data, studio_type) VALUES (?, ?, ?)").bind(key, JSON.stringify(data), data?.projects?.[0]?.studioType || 'unknown').run();
        }
        return new Response(JSON.stringify({ ok: true }));
      }

      if (action === "pull") {
        const key = parts[3];
        const row = await db.prepare("SELECT data, version FROM projects WHERE id = ?").bind(key).first() as { data: string; version: number } | null;
        if (row) {
          const parsed = JSON.parse(row.data);
          parsed.version = row.version;
          return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });
        }
        return new Response("null");
      }

      if (action === "delete" && request.method === "POST") {
        const { key } = await request.json() as { key: string };
        await db.prepare("DELETE FROM projects WHERE id = ?").bind(key).run();
        return new Response(JSON.stringify({ ok: true }));
      }
    }

    return new Response("Agent Worker", { status: 200 });
  },
} satisfies ExportedHandler<Env>;
