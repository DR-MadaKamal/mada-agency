import React from 'react';
import { motion } from 'motion/react';
import { Activity, CheckCircle2, AlertCircle, Clock, Zap, Play, Pause } from 'lucide-react';
import { PrePilotAgencySuiteProject } from '../types';

const PrePilotWorkflows: React.FC<{ project: PrePilotAgencySuiteProject }> = ({ project }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white/90">Workflow Automations</h2>
        <p className="text-[10px] text-white/40 uppercase font-black">Trigger-based enterprise pipelines</p>
      </div>
      <button className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2">
        <Zap className="w-3 h-3" />New Workflow
      </button>
    </div>

    <div className="space-y-4">
      {project.workflows.map((wf, i) => (
        <motion.div key={wf.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/[0.05] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/10">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white/90">{wf.name}</h3>
                <p className="text-[9px] text-white/40">{wf.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-full border ${wf.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{wf.status}</span>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{wf.trigger}</span>
              <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                {wf.status === 'active' ? <Pause className="w-3 h-3 text-white/40" /> : <Play className="w-3 h-3 text-white/40" />}
              </button>
            </div>
          </div>

          <div className="relative pl-6 border-l-2 border-white/5 space-y-3 ml-1">
            {wf.steps.map((step, si) => (
              <div key={si} className="relative pb-1">
                <div className={`absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full border-2 ${step.status === 'done' ? 'bg-green-500 border-green-500' : step.status === 'active' ? 'bg-blue-500 border-blue-500 animate-pulse' : 'bg-white/10 border-white/20'}`} />
                <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl group/step hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium ${step.status === 'active' ? 'text-blue-400' : 'text-white/60'}`}>{step.action}</span>
                    {step.connector && <span className="px-2 py-0.5 bg-white/5 rounded text-[7px] font-black text-white/30 uppercase tracking-widest">{step.connector}</span>}
                  </div>
                  {step.status === 'done' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  {step.status === 'active' && <Clock className="w-3 h-3 text-blue-400 animate-pulse" />}
                  {step.status === 'pending' && <Clock className="w-3 h-3 text-white/20" />}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
      {project.workflows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/10 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
          <Zap className="w-12 h-12 mb-4 opacity-30" />
          <div className="text-sm font-bold mb-1 opacity-50">No workflows defined</div>
          <div className="text-[10px] uppercase font-black tracking-widest opacity-30">Create your first automation pipeline</div>
        </div>
      )}
    </div>
  </div>
);

export default PrePilotWorkflows;