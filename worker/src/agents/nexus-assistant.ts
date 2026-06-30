import { Agent, callable } from "agents";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  context?: string;
}

export interface OngoingStream {
  requestId: string;
  content: string;
  done: boolean;
}

export interface State {
  sessions: Record<string, ChatMessage[]>;
  ongoingStreams: Record<string, OngoingStream>;
}

export class NexusAssistant extends Agent<Env, State> {
  initialState: State = {
    sessions: {},
    ongoingStreams: {},
  };

  @callable()
  getSession(sessionId: string): ChatMessage[] {
    return this.state.sessions[sessionId] || [];
  }

  @callable()
  async sendMessage(sessionId: string, message: ChatMessage, provider?: string): Promise<string> {
    const messages = this.state.sessions[sessionId] || [];
    const history = [...messages];
    const updatedMessages = [...messages, { ...message, timestamp: new Date().toISOString() }];

    this.setState({
      ...this.state,
      sessions: { ...this.state.sessions, [sessionId]: updatedMessages },
    });

    const selectedProvider = provider || "gemini";
    let response = "";

    try {
      const msg = message.content || "";
      if (selectedProvider === "openai") {
        response = await this.callOpenAI(msg, history);
      } else if (selectedProvider === "anthropic") {
        response = await this.callAnthropic(msg, history);
      } else if (selectedProvider === "deepseek") {
        response = await this.callDeepSeek(msg, history);
      } else {
        response = await this.callGemini(msg, history);
      }
    } catch (e: any) {
      response = `Neural link error: ${e.message}`;
    }

    const assistantMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
      context: message.context,
    };

    this.setState({
      ...this.state,
      sessions: {
        ...this.state.sessions,
        [sessionId]: [...updatedMessages, assistantMsg],
      },
    });

    return response;
  }

  @callable()
  async clearSession(sessionId: string): Promise<void> {
    const { [sessionId]: _, ...rest } = this.state.sessions;
    this.setState({ ...this.state, sessions: rest });
  }

  @callable()
  getStreamContent(requestId: string): string | null {
    const stream = this.state.ongoingStreams[requestId];
    return stream ? stream.content : null;
  }

  private buildSystemPrompt(context?: string): string {
    let prompt = `You are "Nexus Core", an elite AI design architect and creative strategist.

Core Directives:
- Provide professional, sophisticated creative advice.
- When asked for colors, provide hex codes and psychological reasoning.
- When asked for trends, use your available knowledge for real-time accurate data.
- Use technical terminology: Synthesis, Neural Flow, Aesthetic Vectors, Chromatic Balance.
- Format output beautifully with markdown.
- If context suggests a workspace, propose actions the user should take.`;

    if (context) {
      prompt += `\n\nCurrent Workspace: ${context}`;
    }
    return prompt;
  }

  private pickKey(keys: string): string {
    const list = keys.split(',').map(k => k.trim()).filter(Boolean);
    return list[Math.floor(Math.random() * list.length)] || keys;
  }

  private async callGemini(prompt: string, history: ChatMessage[]): Promise<string> {
    const rawKey = this.env.GEMINI_API_KEY;
    if (!rawKey) return "GEMINI_API_KEY not configured. Set it in Cloudflare secrets.";
    const apiKey = this.pickKey(rawKey);

    const contents: any[] = [];
    for (const h of history.slice(-20)) {
      if (h.role === "system") continue;
      const text = (h.content || "").trim();
      if (text) contents.push({ role: h.role === "assistant" ? "model" : "user", parts: [{ text }] });
    }

    const promptText = (prompt || "").trim();
    if (promptText) contents.push({ role: "user", parts: [{ text: promptText }] });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: this.buildSystemPrompt() }] },
      }),
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gemini call failed");
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  private async callOpenAI(prompt: string, history: ChatMessage[]): Promise<string> {
    const apiKey = this.env.OPENAI_API_KEY;
    if (!apiKey) return "OPENAI_API_KEY not configured. Set it in Cloudflare secrets.";

    const messages = [
      { role: "system", content: this.buildSystemPrompt() },
      ...history.slice(-20).filter(h => h.role !== "system").map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: prompt },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o", messages }),
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "OpenAI call failed");
    return data.choices?.[0]?.message?.content || "";
  }

  private async callAnthropic(prompt: string, history: ChatMessage[]): Promise<string> {
    const apiKey = this.env.ANTHROPIC_API_KEY;
    if (!apiKey) return "ANTHROPIC_API_KEY not configured. Set it in Cloudflare secrets.";

    const messages = history.slice(-20).filter(h => h.role !== "system").map(h => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content,
    }));
    messages.push({ role: "user", content: prompt });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-3-5-sonnet-20240620", max_tokens: 4096, system: this.buildSystemPrompt(), messages }),
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Anthropic call failed");
    return data.content?.[0]?.text || "";
  }

  private async callDeepSeek(prompt: string, history: ChatMessage[]): Promise<string> {
    const apiKey = this.env.DEEPSEEK_API_KEY;
    if (!apiKey) return "DEEPSEEK_API_KEY not configured. Set it in Cloudflare secrets.";

    const messages = [
      { role: "system", content: this.buildSystemPrompt() },
      ...history.slice(-20).filter(h => h.role !== "system").map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: prompt },
    ];

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "deepseek-chat", messages }),
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "DeepSeek call failed");
    return data.choices?.[0]?.message?.content || "";
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith("__state")) {
      return new Response(JSON.stringify(this.state), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname.includes("__call/")) {
      const method = url.pathname.split("__call/")[1];
      const { args } = await request.json() as { args: any[] };
      if (method === "sendMessage") {
        const [sessionId, message, provider] = args as [string, ChatMessage, string | undefined];
        const result = await this.sendMessage(sessionId, message, provider);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
      }
      if (method === "getSession") {
        const messages = await this.getSession(args[0] as string);
        return new Response(JSON.stringify(messages), { headers: { "Content-Type": "application/json" } });
      }
      if (method === "clearSession") {
        await this.clearSession(args[0] as string);
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Unknown method: ${method}` }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    return super.fetch(request);
  }
}
