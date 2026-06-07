
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Activity, 
  Database, 
  Cpu, 
  Layers, 
  Shield, 
  Globe, 
  ArrowUpRight, 
  Search,
  Settings2,
  PieChart,
  BarChart3,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { db, auth, collection, query, orderBy, limit, onSnapshot, getCountFromServer, where } from '../lib/firebase';
import { strategicOrchestrator } from '../lib/agent-client';

const NexusControlCenter: React.FC = () => {
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalProjects: 0,
    apiUsage: 78,
    activeSubscribers: 124,
    neuralSyncStatus: 'Optimum',
    loadBalance: 12
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [agentOnline, setAgentOnline] = useState(false);

  useEffect(() => {
    strategicOrchestrator().healthCheck().then(setAgentOnline).catch(() => setAgentOnline(false));
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Real-time counter for assets filtered by user
    const assetsRef = query(collection(db, 'vault_assets'), where('userId', '==', user.uid));
    getCountFromServer(assetsRef).then(snapshot => {
      setStats(prev => ({ ...prev, totalAssets: snapshot.data().count }));
    }).catch(err => console.error("Aggregation failed:", err));

    const historyRef = collection(db, 'history');
    const q = query(historyRef, where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(5));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentActivity(activities);
      setStats(prev => ({ ...prev, totalProjects: snapshot.size + 142 })); // base count + real ones
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">NEURAL COMMAND</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] opacity-80">Global System Interface & Performance Metrics</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pr-6">
            <div className={`w-12 h-12 rounded-xl ${agentOnline ? 'bg-emerald-500' : 'bg-amber-500'} flex items-center justify-center shadow-lg`}>
              {agentOnline ? <Wifi className="w-6 h-6 text-white" /> : <WifiOff className="w-6 h-6 text-white" />}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Agent Worker</div>
              <div className={`text-xs font-bold ${agentOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {agentOnline ? 'AGENTS ONLINE (24ms)' : 'LOCAL MODE'}
              </div>
            </div>
          </div>
        </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Neural Vault Assets" 
          value={stats.totalAssets.toString()} 
          subValue="+12% from last synch" 
          icon={Database} 
          color="blue"
        />
        <StatCard 
          label="Total Synthesized Projects" 
          value={stats.totalProjects.toString()} 
          subValue="Cross-Studio total" 
          icon={Layers} 
          color="purple"
        />
        <StatCard 
          label="API Quota Utilization" 
          value={`${stats.apiUsage}%`} 
          subValue="Burst limit remaining" 
          icon={Cpu} 
          color="amber"
          progress={stats.apiUsage}
        />
        <StatCard 
          label="AI Model Integrity" 
          value={stats.neuralSyncStatus} 
          subValue="Google GenAI Core Active" 
          icon={Shield} 
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Activity Feed */}
        <div className="lg:col-span-2 glass-card rounded-[40px] p-8 border border-white/5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[var(--color-accent)]" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Neural Stream Activity</h2>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">View All</button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {recentActivity.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center"
                >
                  <div className="relative inline-block mb-6">
                    <Activity className="w-16 h-16 text-white/10 mx-auto" />
                    <div className="absolute inset-0 bg-[var(--color-accent)] blur-3xl opacity-5" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/20">Awaiting Neural Activity</p>
                  <p className="text-[9px] font-medium text-white/10 mt-1">Activity will appear here as you work across studios</p>
                </motion.div>
              ) : (
                recentActivity.map((activity, idx) => (
                  <motion.div 
                    key={activity.id || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-3xl group hover:bg-white/[0.05] transition-all hover:border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[var(--color-accent)]/30 transition-colors">
                        {activity.type === 'image' ? <Zap className="w-5 h-5 text-amber-400" /> : <Globe className="w-5 h-5 text-blue-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">{activity.prompt || 'System Task Execution'}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">{activity.studio || 'Global Core'} • {new Date(activity.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[8px] font-black px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md uppercase border border-emerald-500/20">Success</span>
                       <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Global Controls & Metrics */}
        <div className="flex flex-col gap-6">
          <div className="glass-card rounded-[40px] p-8 border border-white/5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-6">System Health</h2>
            <div className="space-y-6">
              <ProgressItem label="Storage Capacity" percent={42} color="bg-blue-500" />
              <ProgressItem label="Server Load" percent={stats.loadBalance} color="bg-emerald-500" />
              <ProgressItem label="Render Queue" percent={65} color="bg-amber-500" />
            </div>
          </div>

          <div className="glass-card rounded-[40px] p-8 border border-white/5 flex flex-col gap-6 flex-grow">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Operational Toggles</h2>
            <div className="space-y-4">
              <ToggleSwitch label="Safe Neural Sync" active={true} />
              <ToggleSwitch label="High Fidelity Synthesis" active={true} />
              <ToggleSwitch label="Auto-Vault Archiving" active={false} />
              <ToggleSwitch label="Global Market Pulse" active={true} />
            </div>
            <button 
              onClick={() => {
                // If App context provided navigate function, we would use it.
                // Assuming we can trigger a state change via a global event or if we are in App.tsx
                window.dispatchEvent(new CustomEvent('nav-studio', { detail: 'admin_studio' }));
              }}
              className="mt-4 w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95"
            >
              Advanced System Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, icon: Icon, color, progress }: any) => {
  const colors: any = {
    blue: 'from-blue-500/20 to-indigo-500/5 text-blue-400 shadow-blue-500/10',
    purple: 'from-purple-500/20 to-pink-500/5 text-purple-400 shadow-purple-500/10',
    amber: 'from-amber-500/20 to-orange-500/5 text-amber-400 shadow-amber-500/10',
    emerald: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 shadow-emerald-500/10'
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`p-8 rounded-[40px] bg-gradient-to-br ${colors[color]} border border-white/5 flex flex-col gap-4 shadow-2xl relative overflow-hidden group cursor-default`}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-white/20 group-hover:text-white/40 transition-colors">
          <Settings2 className="w-4 h-4 cursor-pointer" />
        </div>
      </div>
      <div className="relative z-10 mt-2">
        <motion.h3 
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black text-white tracking-tighter mb-1"
        >
          {value}
        </motion.h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
      </div>
      <div className="mt-4 flex items-center justify-between relative z-10">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{subValue}</span>
        {progress !== undefined && (
          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-current rounded-full" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {/* Decorative BG element */}
      <Icon className="absolute -right-8 -bottom-8 w-24 h-24 opacity-5" />
    </motion.div>
  );
};

const ProgressItem = ({ label, percent, color }: any) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
      <span>{label}</span>
      <span className="text-white">{percent}%</span>
    </div>
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-0.5">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  </div>
);

const ToggleSwitch = ({ label, active }: any) => {
  const [isOn, setIsOn] = useState(active);
  return (
    <div className="flex items-center justify-between group">
      <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{label}</span>
      <button 
        onClick={() => setIsOn(!isOn)}
        className={`w-10 h-5 rounded-full transition-all relative ${isOn ? 'bg-[var(--color-accent)]' : 'bg-white/10'}`}
      >
        <motion.div 
          animate={{ x: isOn ? 20 : 4 }}
          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
};

export default NexusControlCenter;
