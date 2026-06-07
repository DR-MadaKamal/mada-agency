import React from 'react';
import { motion } from 'motion/react';
import { Users, ShieldCheck, Activity, AlertCircle, Plus, MoreVertical } from 'lucide-react';
import { PrePilotAgencySuiteProject } from '../types';

const MOCK_TEAM = [
  { id: 't1', name: 'Alex Rivera', role: 'Chief Strategist', dept: 'Strategy', load: 85 },
  { id: 't2', name: 'Jordan Chen', role: 'Head of Creative', dept: 'Creative', load: 42 },
  { id: 't3', name: 'Sam Taylor', role: 'DevOps Lead', dept: 'Tech', load: 91 },
];

const PrePilotTeam: React.FC<{ project: PrePilotAgencySuiteProject }> = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white/90">Team Overview</h2>
        <p className="text-[10px] text-white/40 uppercase font-black">Workload distribution & availability</p>
      </div>
      <button className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2">
        <Plus className="w-3 h-3" />Invite Member
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {MOCK_TEAM.map(member => (
        <motion.div key={member.id} whileHover={{ y: -2 }} className="p-6 bg-white/5 border border-white/5 rounded-3xl group cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <span className="text-lg font-black text-white/80">{member.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <MoreVertical className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
          </div>
          <div className="mb-1">
            <span className="text-sm font-bold text-white/90">{member.name}</span>
          </div>
          <div className="text-[10px] text-white/40 font-medium mb-4">{member.role}</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/30">
              <span>Workload</span>
              <span className={member.load > 80 ? 'text-red-400' : 'text-emerald-400'}>{member.load}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${member.load}%` }} className={`h-full rounded-full ${member.load > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default PrePilotTeam;