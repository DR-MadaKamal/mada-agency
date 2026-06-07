import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, TrendingUp, DollarSign, Activity, ShieldCheck, RefreshCcw, Target } from 'lucide-react';
import { PrePilotAgencySuiteProject } from '../types';

const METRICS = { totalRevenue: "$1.2M", growth: "+14.2%", burnRate: "$45k/mo", efficiency: "92%" };

const MetricCard: React.FC<{ label: string; value: string; icon: React.FC<any>; color: string }> = ({ label, value, icon: Icon, color }) => (
  <motion.div whileHover={{ y: -2 }} className={`p-6 rounded-3xl bg-gradient-to-br ${color} border border-white/5 flex items-center gap-4 group cursor-default`}>
    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
      <Icon className="w-5 h-5 text-white/80" />
    </div>
    <div>
      <div className="text-2xl font-black text-white tracking-tight">{value}</div>
      <div className="text-[9px] font-black uppercase tracking-widest text-white/40">{label}</div>
    </div>
  </motion.div>
);

const PrePilotOverview: React.FC<{ project: PrePilotAgencySuiteProject; onGenerateStrategy: () => void; isGeneratingStrategy: boolean }> = ({ project, onGenerateStrategy, isGeneratingStrategy }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label="Total Revenue" value={METRICS.totalRevenue} icon={DollarSign} color="from-green-500/10 to-emerald-500/5" />
      <MetricCard label="Growth Rate" value={METRICS.growth} icon={TrendingUp} color="from-blue-500/10 to-indigo-500/5" />
      <MetricCard label="Burn Rate" value={METRICS.burnRate} icon={Activity} color="from-amber-500/10 to-orange-500/5" />
      <MetricCard label="Efficiency" value={METRICS.efficiency} icon={ShieldCheck} color="from-purple-500/10 to-pink-500/5" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg"><Target className="w-4 h-4 text-blue-400" /></div>
          <h3 className="text-sm font-bold text-white/90">Strategic Goal</h3>
        </div>
        <p className="text-[11px] text-white/40 leading-relaxed">{project.strategicGoal || 'No strategic goal defined. Set one in the Strategy tab.'}</p>
        {project.marketAnalysis && (
          <div className="mt-4 p-4 bg-white/5 border border-white/5 rounded-2xl max-h-[200px] overflow-y-auto">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Latest Analysis</div>
            <div className="text-[10px] text-white/50 leading-relaxed whitespace-pre-wrap">{project.marketAnalysis}</div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg"><RefreshCcw className="w-4 h-4 text-emerald-400" /></div>
          <h3 className="text-sm font-bold text-white/90">Active Workflows</h3>
        </div>
        <div className="space-y-3">
          {project.workflows.slice(0, 3).map((wf, i) => (
            <div key={wf.id || i} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-white/80">{wf.name}</span>
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full border ${wf.status === 'active' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'}`}>{wf.status}</span>
              </div>
              <p className="text-[9px] text-white/40 line-clamp-1">{wf.description}</p>
            </div>
          ))}
          {project.workflows.length === 0 && <p className="text-[10px] text-white/20 text-center py-8">No workflows configured</p>}
        </div>
      </div>
    </div>

    <div className="flex items-center justify-center p-8 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
      <button onClick={onGenerateStrategy} disabled={isGeneratingStrategy} className="px-8 py-4 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-3">
        {isGeneratingStrategy ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
        {isGeneratingStrategy ? 'Analyzing...' : 'Run Full Agency Audit'}
      </button>
    </div>

    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
      <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Clients: {project.clients.length}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Active Campaigns: {project.campaigns.filter(c => c.status === 'live').length}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Team Members: {project.team.length}</div>
    </div>
  </div>
);

export default PrePilotOverview;