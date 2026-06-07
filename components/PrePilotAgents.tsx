import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Activity, Terminal, CheckCircle2, AlertCircle, Clock, Zap, Shield, Database } from 'lucide-react';
import { PrePilotAgencySuiteProject } from '../types';

const PrePilotAgents: React.FC<{ project: PrePilotAgencySuiteProject; agentError: string | null; onSync: () => void; onExecuteTask: (id: string, task: string) => void }> = ({ project, agentError, onSync, onExecuteTask }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white/90">AI Agent Infrastructure</h2>
        <p className="text-[10px] text-white/40 uppercase font-black">Real-time state & capability execution</p>
      </div>
      <div className="flex items-center gap-3">
        {agentError && <span className="text-[8px] text-red-400 font-black uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">{agentError}</span>}
        <button onClick={onSync} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2">
          <Activity className="w-3 h-3" />Sync Agents
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {project.agents.map(agent => (
        <motion.div key={agent.id} layout className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/[0.06] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${agent.status === 'active' ? 'bg-emerald-500/20' : 'bg-amber-500/20'} border border-white/10`}>
                <Cpu className={`w-5 h-5 ${agent.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white/90">{agent.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{agent.role}</span>
                </div>
              </div>
            </div>
            <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-full border ${agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{agent.status}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {agent.capabilities.map(cap => <span key={cap} className="px-2 py-1 bg-white/5 border border-white/5 rounded-md text-[8px] font-mono text-white/30">{cap}</span>)}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
              <div className="text-lg font-black text-white/80">{agent.metrics.tasksCompleted}</div>
              <div className="text-[7px] font-black uppercase tracking-widest text-white/20">Tasks</div>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
              <div className="text-lg font-black text-white/80">{agent.metrics.latency}</div>
              <div className="text-[7px] font-black uppercase tracking-widest text-white/20">Latency</div>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
              <div className="text-lg font-black text-white/80">{agent.metrics.uptime}%</div>
              <div className="text-[7px] font-black uppercase tracking-widest text-white/20">Uptime</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => onExecuteTask(agent.id, 'diagnose')} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">Diagnose</button>
            {agent.capabilities.includes('orchestration') && <button onClick={() => onExecuteTask(agent.id, 'orchestrate')} className="flex-1 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/20 transition-all">Orchestrate</button>}
            {agent.capabilities.includes('rest_api') && <button onClick={() => onExecuteTask(agent.id, 'search')} className="flex-1 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest text-purple-400 hover:bg-purple-500/20 transition-all">Search</button>}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default PrePilotAgents;