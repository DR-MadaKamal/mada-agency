import React from 'react';
import { motion } from 'motion/react';
import { Users, Target, AlertCircle, CheckCircle2, Clock, TrendingUp, Plus, MoreVertical, ArrowRight } from 'lucide-react';
import { PrePilotAgencySuiteProject } from '../types';

const STAGES = [
  { key: 'lead', label: 'Lead', limit: 4, color: 'border-l-blue-500' },
  { key: 'qualified', label: 'Qualified', limit: 4, color: 'border-l-emerald-500' },
  { key: 'proposal', label: 'Proposal', limit: 4, color: 'border-l-amber-500' },
  { key: 'negotiation', label: 'Negotiation', limit: 4, color: 'border-l-purple-500' },
  { key: 'closed', label: 'Closed Won', limit: 4, color: 'border-l-green-500' },
];

const MOCK_LEADS = [
  { id: 'l1', company: 'TechNova', contact: 'Sarah J.', value: '$45,000', stage: 'qualified', probability: 80 },
  { id: 'l2', company: 'GreenPath', contact: 'Mark R.', value: '$12,000', stage: 'proposal', probability: 65 },
  { id: 'l3', company: 'Global Logistics', contact: 'Elena V.', value: '$88,000', stage: 'negotiation', probability: 40 },
];

const PrePilotCRM: React.FC<{ project: PrePilotAgencySuiteProject }> = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white/90">CRM Pipeline</h2>
        <p className="text-[10px] text-white/40 uppercase font-black">Lead tracking & client relationship management</p>
      </div>
      <button className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2">
        <Plus className="w-3 h-3" />Add Lead
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {STAGES.map(stage => (
        <div key={stage.key} className={`bg-white/5 border border-white/5 rounded-3xl p-4 border-l-4 ${stage.color}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{stage.label}</span>
            <span className="text-[9px] font-black text-white/30">{MOCK_LEADS.filter(l => l.stage === stage.key).length}</span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {MOCK_LEADS.filter(l => l.stage === stage.key).map(lead => (
              <motion.div key={lead.id} layout className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl group cursor-pointer hover:bg-white/[0.05] transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">{lead.company}</span>
                  <MoreVertical className="w-3 h-3 text-white/20 group-hover:text-white/40" />
                </div>
                <div className="text-[9px] text-white/40">{lead.contact}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-black text-white/60">{lead.value}</span>
                  <span className="text-[8px] font-black text-emerald-500/70">{lead.probability}%</span>
                </div>
              </motion.div>
            ))}
            {MOCK_LEADS.filter(l => l.stage === stage.key).length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-white/10">
                <Target className="w-6 h-6 mb-2" />
                <span className="text-[8px] font-black uppercase tracking-widest">Empty</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default PrePilotCRM;