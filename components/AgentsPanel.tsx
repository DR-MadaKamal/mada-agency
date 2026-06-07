import { useState, useEffect } from 'react';
import { strategicOrchestrator, knowledgeMiner, createAgent } from '../lib/agent-client';
import { Bot, Cpu, Library, MessageSquare, Activity, RefreshCw, Loader2, Zap } from 'lucide-react';
import { createAICall } from '../lib/ai';

interface AgentCard {
  name: string;
  instance: string;
  label: string;
  icon: typeof Bot;
  color: string;
  methods: { id: string; label: string; action: (instance: any) => Promise<any> }[];
}

export function AgentsPanel() {
  const [states, setStates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{ role: string; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const orchestrator = strategicOrchestrator();
  const miner = knowledgeMiner();
  const nexus = createAgent('NexusAssistant', 'chat-session');

  const refreshState = async (key: string, agent: any) => {
    setLoading(s => ({ ...s, [key]: true }));
    const state = await agent.getState();
    if (state) setStates(s => ({ ...s, [key]: state }));
    setLoading(s => ({ ...s, [key]: false }));
  };

  const executeMethod = async (key: string, agent: any, method: string, ...args: any[]) => {
    setLoading(s => ({ ...s, [key]: true }));
    try {
      const result = await agent.call(method, ...args);
      setResults(s => ({ ...s, [key]: typeof result === 'string' ? result : JSON.stringify(result) }));
      await refreshState(key, agent);
    } catch (e: any) {
      setResults(s => ({ ...s, [key]: `Error: ${e.message}` }));
    }
    setLoading(s => ({ ...s, [key]: false }));
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    setChatLog(l => [...l, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const { call } = createAICall('agent_chat');
      const response = await call(msg, { provider: 'google', modelId: 'gemini-2.0-flash' });
      setChatLog(l => [...l, { role: 'assistant', text: response }]);
    } catch (e: any) {
      setChatLog(l => [...l, { role: 'assistant', text: `Error: ${e.message}` }]);
    }
    setChatLoading(false);
  };

  const agents: AgentCard[] = [
    {
      name: 'StrategicOrchestrator', instance: 'master-agent', label: 'Strategic Orchestrator', icon: Cpu, color: 'text-violet-400',
      methods: [
        { id: 'get_state', label: 'Get State', action: (a) => a.getState() },
        { id: 'execute_task', label: 'Execute Test Task', action: (a) => a.call('executeTask', `Strategy analysis for ${new Date().toLocaleDateString()}`) },
      ],
    },
    {
      name: 'KnowledgeMiner', instance: 'data-agent', label: 'Knowledge Miner', icon: Library, color: 'text-emerald-400',
      methods: [
        { id: 'get_state', label: 'Get State', action: (a) => a.getState() },
      ],
    },
  ];

  useEffect(() => {
    agents.forEach(a => refreshState(a.instance, createAgent(a.name, a.instance)));
  }, []);

  return (
    <div className="col-span-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {agents.map(agent => {
          const agentClient = createAgent(agent.name, agent.instance);
          const state = states[agent.instance];
          return (
            <div key={agent.instance} className="glass-card rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-2xl">
                  <agent.icon className={`w-6 h-6 ${agent.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-widest">{agent.label}</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{agent.name} / {agent.instance}</p>
                </div>
                <button
                  onClick={() => refreshState(agent.instance, agentClient)}
                  className="ml-auto p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  {loading[agent.instance] ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : <RefreshCw className="w-4 h-4 text-white/40" />}
                </button>
              </div>

              {state && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Status: <span className={state.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}>{state.status}</span></span>
                    <span>| Tasks: {state.metrics?.tasksCompleted || 0}</span>
                    <span>| Uptime: {state.metrics?.uptime || '-'}%</span>
                  </div>
                  {state.currentTask && (
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
                      <p className="text-[10px] text-blue-300 font-medium">Current Task: {state.currentTask}</p>
                    </div>
                  )}
                </div>
              )}

              {!state && !loading[agent.instance] && (
                <div className="bg-white/5 rounded-2xl p-6 text-center mb-6">
                  <p className="text-[10px] text-white/30 font-bold">Agent unreachable — worker may be sleeping</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {agent.methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => executeMethod(agent.instance + '_' + m.id, agentClient, m.id === 'execute_task' ? 'executeTask' : m.id === 'get_state' ? 'getState' : m.id)}
                    disabled={loading[agent.instance + '_' + m.id]}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 flex items-center gap-2"
                  >
                    {loading[agent.instance + '_' + m.id] && <Loader2 className="w-3 h-3 animate-spin" />}
                    {m.label}
                  </button>
                ))}
              </div>

              {results[agent.instance + '_execute_task'] && (
                <div className="mt-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                  <p className="text-[10px] text-emerald-300 font-medium">{results[agent.instance + '_execute_task']}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nexus Chat */}
      <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-white/5 rounded-2xl">
            <MessageSquare className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-widest">Nexus Assistant</h3>
          <button
            onClick={() => setChatLog([])}
            className="ml-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
          >
            Clear
          </button>
        </div>

        <div className="bg-black/20 rounded-3xl p-6 mb-4 h-[300px] overflow-y-auto suggestions-scrollbar space-y-4">
          {chatLog.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] text-white/20 font-bold uppercase tracking-widest">Ask Nexus anything about your marketing strategy</p>
            </div>
          )}
          {chatLog.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30' : 'bg-white/5 border border-white/10'}`}>
                <p className="text-[11px] text-white/70 font-medium whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <Loader2 className="w-4 h-4 animate-spin text-white/40" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChat()}
            placeholder="Ask about strategy, content, or next steps..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none"
          />
          <button
            onClick={handleChat}
            disabled={chatLoading || !chatInput.trim()}
            className="px-6 py-4 bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest disabled:opacity-30 flex items-center gap-2"
          >
            {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
