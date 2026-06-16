import { routeAgentRequest } from "agents";
import { StrategicOrchestrator } from "./agents/strategic-orchestrator";
import { KnowledgeMiner } from "./agents/knowledge-miner";
import { NexusAssistant } from "./agents/nexus-assistant";

export { StrategicOrchestrator, KnowledgeMiner, NexusAssistant };

const ALLOWED_BINDINGS = ['StrategicOrchestrator', 'KnowledgeMiner', 'NexusAssistant'];

function getBinding(name: string, env: Env): DurableObjectNamespace | null {
  if (!ALLOWED_BINDINGS.includes(name)) return null;
  return (env as any)[name] as DurableObjectNamespace || null;
}

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
        const binding = getBinding(agentName, env);
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
        const binding = getBinding(agentName, env);
        if (binding) {
          const id = binding.idFromName(instanceName);
          const stub = binding.get(id);
          let args: any[] = [];
          try { ({ args } = await request.json() as { args: any[] }); } catch { return new Response("Bad request", { status: 400 }); }
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
      if (!env.SYNC_API_KEY || request.headers.get("Authorization") !== `Bearer ${env.SYNC_API_KEY}`) {
        return new Response("Unauthorized", { status: 401 });
      }
      const parts = url.pathname.split("/");
      const action = parts[2];
      const db = env.mada_agency_db;

      if (action === "push" && request.method === "POST") {
        let key = '', data: any = null;
        try { ({ key, data } = await request.json() as { key: string; data: any }); } catch { return new Response("Bad request", { status: 400 }); }
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
        let key = '';
        try { ({ key } = await request.json() as { key: string }); } catch { return new Response("Bad request", { status: 400 }); }
        await db.prepare("DELETE FROM projects WHERE id = ?").bind(key).run();
        return new Response(JSON.stringify({ ok: true }));
      }
    }

    if (url.pathname === "/scrape" && request.method === "POST") {
      let targetUrl = '';
      try { ({ url: targetUrl } = await request.json() as { url: string }); } catch { return new Response("Bad request", { status: 400 }); }
      if (!targetUrl) return new Response("Missing url", { status: 400 });
      try {
        const res = await fetch(targetUrl, { headers: { 'User-Agent': 'MadaAgency/1.0' } });
        const html = await res.text();
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000);
        return new Response(JSON.stringify({ text, title: html.match(/<title>([^<]*)<\/title>/i)?.[1] || '' }), { headers: { "Content-Type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response("Agent Worker", { status: 200 });
  },
} satisfies ExportedHandler<Env>;
