
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Users,
    Rocket,
    Target,
    Zap,
    Plus,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    AlertCircle,
    Clock,
    TrendingUp,
    Globe,
    Sparkles,
    Edit3,
    DollarSign,
    ShieldCheck,
    Activity,
    LineChart,
    ChevronRight,
    RefreshCcw,
    Terminal,
    Database,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrePilotAgencySuiteProject, PrePilotClient, PrePilotCampaign } from '../types';
import { cn } from '../lib/utils';
import { strategicOrchestrator, knowledgeMiner } from '../lib/agent-client';
import PrePilotOverview from './PrePilotOverview';
import PrePilotCRM from './PrePilotCRM';
import PrePilotTeam from './PrePilotTeam';
import PrePilotAgents from './PrePilotAgents';
import PrePilotWorkflows from './PrePilotWorkflows';

const PrePilotAgencySuite: React.FC<{
    project: PrePilotAgencySuiteProject;
    setProject: React.Dispatch<React.SetStateAction<PrePilotAgencySuiteProject>>;
}> = ({ project, setProject }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [isAddingCampaign, setIsAddingCampaign] = useState(false);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
    const [selectMode, setSelectMode] = useState(false);

    const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [agentError, setAgentError] = useState<string | null>(null);

    const toggleSelectClient = (id: string) => {
      setSelectedClientIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const toggleSelectCampaign = (id: string) => {
      setSelectedCampaignIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const selectAllClients = () => {
      setSelectedClientIds(project.clients.map(c => c.id));
    };
    const selectAllCampaigns = () => {
      setSelectedCampaignIds(project.campaigns.map(c => c.id));
    };
    const clearSelection = () => {
      setSelectedClientIds([]);
      setSelectedCampaignIds([]);
    };
    const batchDeleteClients = () => {
      setProject(prev => ({
        ...prev,
        clients: prev.clients.filter(c => !selectedClientIds.includes(c.id)),
      }));
      setSelectedClientIds([]);
    };
    const batchDeleteCampaigns = () => {
      setProject(prev => ({
        ...prev,
        campaigns: prev.campaigns.filter(c => !selectedCampaignIds.includes(c.id)),
      }));
      setSelectedCampaignIds([]);
    };

    const syncAgentsFromWorker = useCallback(async () => {
      try {
        const orch = strategicOrchestrator();
        const miner = knowledgeMiner();
        const [orchState, minerState] = await Promise.all([
          orch.getState().catch(() => null),
          miner.getState().catch(() => null),
        ]);

        if (orchState) {
          setProject(prev => ({
            ...prev,
            agents: prev.agents.map(a =>
              a.id === 'master-agent'
                ? { ...a, metrics: orchState.metrics, status: orchState.status }
                : a
            ),
            workflows: orchState.workflows || prev.workflows,
          }));
        }
        if (minerState) {
          setProject(prev => ({
            ...prev,
            agents: prev.agents.map(a =>
              a.id === 'data-agent'
                ? { ...a, metrics: minerState.metrics, status: minerState.status }
                : a
            ),
            knowledgeBases: minerState.knowledgeBases || prev.knowledgeBases,
          }));
        }
        setAgentError(null);
      } catch (err) {
        setAgentError('Agent Worker unreachable');
      }
    }, []);

    useEffect(() => {
      syncAgentsFromWorker();
      const interval = setInterval(syncAgentsFromWorker, 30000);
      return () => clearInterval(interval);
    }, [syncAgentsFromWorker]);

    const activeTab = project.activeTab;
    
    // Default data for empty states
    const renderCRM = () => <PrePilotCRM project={project} />;

    const renderTeam = () => <PrePilotTeam project={project} />;

    const executeAgentTask = useCallback(async (agentName: string, task: string) => {
      try {
        const client = agentName === 'data-agent' ? knowledgeMiner() : strategicOrchestrator();
        await client.call('executeTask', task);
        await syncAgentsFromWorker();
      } catch (err) {
        console.error(`Agent ${agentName} task failed:`, err);
      }
    }, [syncAgentsFromWorker]);

    const handleSimulatePilot = async () => {
        if (project.campaigns.length === 0) return;
        setIsSimulating(true);
        try {
            await executeAgentTask('master-agent', `Simulate pilot for campaign: ${project.campaigns[project.campaigns.length - 1].name}`);
            const { callAI } = await import('../services/geminiService');
            const campaign = project.campaigns[project.campaigns.length - 1];
            const prompt = `Simulate a marketing pilot for campaign: ${campaign.name}. Budget: ${campaign.budget}. 
            Provide 3 potential scenarios with: id, name, confidence(number 0-100), risk (Low/Med/High), outcome (1 sentence).
            Return ONLY a raw JSON array.`;
            
            const response = await callAI(prompt, project.aiConfig || { provider: 'google', modelId: 'gemini-1.5-flash' });
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    const results = JSON.parse(jsonMatch[0]);
                    setProject(s => ({ ...s, pilotResults: results }));
                } catch { }
            }
        } catch (err) {
            console.error("Simulation failed:", err);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleGenerateStrategy = async () => {
        if (!project.strategicGoal) return;
        setIsGeneratingStrategy(true);
        try {
            await executeAgentTask('master-agent', `Generate strategy for: ${project.strategicGoal}`);
            const { callAI } = await import('../services/geminiService');
            const prompt = `Generate a detailed market analysis and strategic roadmap for the following goal: ${project.strategicGoal}.
            Format with professional sections: Market Context, Growth Pillars, Competitive Positioning. Use Markdown.`;
            
            const response = await callAI(prompt, project.aiConfig || { provider: 'google', modelId: 'gemini-1.5-flash' });
            setProject(s => ({ ...s, marketAnalysis: response }));
        } catch (err) {
            console.error("Strategy generation failed:", err);
        } finally {
            setIsGeneratingStrategy(false);
        }
    };

    const stats = useMemo(() => {
        const liveCampaigns = project.campaigns.filter(c => c.status === 'live').length;
        const totalBudget = project.campaigns.reduce((acc, c) => acc + (parseFloat(c.budget.replace(/[^0-9.]/g, '')) || 0), 0);
        const avgProgress = project.campaigns.length > 0 
            ? project.campaigns.reduce((acc, c) => acc + c.progress, 0) / project.campaigns.length 
            : 0;

        return {
            totalClients: project.clients.length,
            liveCampaigns,
            totalBudget: `$${(totalBudget / 1000).toFixed(1)}k`,
            avgProgress: `${Math.round(avgProgress)}%`
        };
    }, [project.clients, project.campaigns]);

    const handleAddClient = (client: Partial<PrePilotClient>) => {
        const newClient: PrePilotClient = {
            id: Math.random().toString(36).substr(2, 9),
            name: client.name || 'New Client',
            industry: client.industry || 'Unknown',
            status: 'onboarding',
            ...client
        };
        setProject(s => ({ ...s, clients: [...s.clients, newClient] }));
        setIsAddingClient(false);
    };

    const handleAddCampaign = (campaign: Partial<PrePilotCampaign>) => {
        const newCampaign: PrePilotCampaign = {
            id: Math.random().toString(36).substr(2, 9),
            clientId: campaign.clientId || '',
            name: campaign.name || 'New Campaign',
            budget: campaign.budget || '$0',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            status: 'planning',
            progress: 0,
            kpis: [],
            ...campaign
        };
        setProject(s => ({ ...s, campaigns: [...s.campaigns, newCampaign] }));
        setIsAddingCampaign(false);
    };

    const renderAgents = () => <PrePilotAgents project={project} agentError={agentError} onSync={syncAgentsFromWorker} onExecuteTask={executeAgentTask} />;

    const renderWorkflows = () => <PrePilotWorkflows project={project} />;

    const renderKnowledge = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Grounding Intelligence</h2>
                    <p className="text-[10px] text-white/40 uppercase font-black">Multi-Source Enterprise Graph & Document Context</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60 hover:text-white transition-all">
                        Graph Schema
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <Plus className="w-4 h-4" /> Add Knowledge Base
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {project.knowledgeBases.map((kb, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={kb.id}
                            className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-white/20 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-blue-500/10 transition-colors">
                                    <Database className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white mb-0.5">{kb.name}</div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">{kb.type} Connector</div>
                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                        <div className="text-[10px] text-blue-400/80 font-bold">{kb.documentCount} Documents Indexed</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-[9px] text-white/30 uppercase font-black mb-1">Status</div>
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase",
                                        kb.status === 'ready' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    )}>
                                        {kb.status}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] text-white/30 uppercase font-black mb-1">Sync</div>
                                    <div className="text-[10px] font-bold text-white/60">{kb.lastSynced}</div>
                                </div>
                                <button className="p-3 hover:bg-white/10 rounded-2xl text-white/20 hover:text-white transition-all bg-white/5">
                                    <RefreshCcw className={cn("w-4 h-4", kb.status === 'indexing' && 'animate-spin')} />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    <div className="p-8 bg-white/5 border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center group hover:bg-white/[0.07] transition-all">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                             <Plus className="w-8 h-8 text-white/10" />
                        </div>
                        <h4 className="text-sm font-bold text-white/40 mb-2">Mount New Data Source</h4>
                        <p className="text-[10px] text-white/20 uppercase font-black tracking-widest max-w-[280px]">Connect SharePoint, SQL Clusters, or Enterprise Graph endpoints</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-white/10 rounded-[2rem] space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Terminal className="w-4 h-4 text-blue-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Python Sandbox</h3>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed font-medium">Autonomous Execution Layer: Agents generate and run Python code to analyze heavy datasets, execute simulations, and create visualized reports in real-time.</p>
                        
                        <div className="bg-black/60 rounded-2xl p-5 font-mono text-[10px] text-blue-300 border border-white/5 shadow-inner">
                            <div className="text-white/20 mb-2"># Processing Cross-App Context</div>
                            <div className="flex gap-2"><span className="text-purple-400">import</span><span>os, pandas</span><span className="text-purple-400">as</span><span>pd</span></div>
                            <div className="flex gap-2"><span>df = pd.load_context([</span><span className="text-orange-400">'kb1'</span><span>, </span><span className="text-orange-400">'wf1'</span><span>])</span></div>
                            <div className="flex gap-2"><span>insight = df.analyze(</span><span className="text-orange-400">'market_fatigue'</span><span>)</span></div>
                            <div className="flex gap-2 text-green-400 mt-3 font-bold"><span>{">>>"} Result: High overlap in CRM stage 3</span></div>
                        </div>

                        <button className="w-full py-3 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all">
                            Open Workbook Console
                        </button>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-white/80">Memory & Vector Stats</h4>
                        <div className="space-y-3">
                           {[
                               { label: 'Total Vectors', value: '1.2M', progress: 45 },
                               { label: 'Indexing Load', value: 'Mid', progress: 62 },
                               { label: 'Query Latency', value: '142ms', progress: 12 },
                           ].map(stat => (
                               <div key={stat.label} className="space-y-1.5">
                                   <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                                       <span>{stat.label}</span>
                                       <span className="text-white/80">{stat.value}</span>
                                   </div>
                                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                       <div className="h-full bg-blue-400" style={{ width: `${stat.progress}%` }} />
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGovernance = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Governance & Security</h2>
                    <p className="text-[10px] text-white/40 uppercase font-black">IAM (Entra), Data Masking & Tenant Analytics</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60">Export Audit</button>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                        Emergency Lockdown
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Identity Status', value: 'Azure Entra: Connected', icon: ShieldCheck, color: 'text-green-400' },
                    { label: 'PII Redaction', value: 'Level 4 Active', icon: Shield, color: 'text-blue-400' },
                    { label: 'Compliance Health', value: '100% (GDPR/HIPAA)', icon: CheckCircle2, color: 'text-purple-400' },
                    { label: 'Threat Monitoring', value: 'SmartDefender Pro', icon: Target, color: 'text-red-400' },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-white/5 border border-white/10 rounded-3xl p-5 group hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                        <div className={cn("mb-6 p-3 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">{stat.label}</div>
                            <div className="text-base font-bold tracking-tight text-white/90 leading-tight">{stat.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold">Active Security Policies</h3>
                         <button className="text-[10px] font-black uppercase text-blue-400 hover:underline">Manage All</button>
                    </div>
                    <div className="space-y-3">
                        {project.securityPolicies.map(policy => (
                            <div key={policy.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[2rem] group hover:bg-white/[0.08] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-2 h-10 rounded-full",
                                        policy.severity === 'critical' ? 'bg-red-500' : policy.severity === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                                    )} />
                                    <div>
                                        <div className="text-[13px] font-bold text-white mb-0.5">{policy.name}</div>
                                        <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">{policy.category} Policy</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <div className={cn(
                                         "px-3 py-1 rounded-full text-[9px] font-black uppercase border",
                                         policy.status === 'enforced' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/30 border-white/10'
                                     )}>
                                         {policy.status}
                                     </div>
                                     <button className="p-2 hover:bg-white/10 rounded-xl text-white/20 group-hover:text-white transition-colors">
                                         <MoreVertical className="w-4 h-4" />
                                     </button>
                                </div>
                            </div>
                        ))}
                        <button className="w-full py-4 bg-white/5 border border-dashed border-white/10 rounded-[2rem] text-[10px] font-black uppercase text-white/20 hover:text-white/40 transition-all">
                             Define New Compliance Requirement
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                         <Activity className="w-32 h-32" />
                    </div>
                    
                    <h3 className="text-lg font-bold">System Telemetry</h3>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar scroll-smooth">
                        {project.systemLogs.map((log, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="text-[9px] font-mono text-white/20 shrink-0 mt-0.5">{log.timestamp.split(' ')[1]}</div>
                                <div className={cn(
                                    "px-1.5 py-0.5 h-fit rounded text-[8px] font-black uppercase shrink-0",
                                    log.level === 'error' ? 'bg-red-500 text-white' : log.level === 'warn' ? 'bg-orange-500 text-black' : 'bg-blue-500/10 text-blue-400'
                                )}>
                                    {log.level}
                                </div>
                                <div className="text-[11px] text-white/60 leading-tight font-medium">{log.message}</div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                             <div className="text-[10px] text-white/30 uppercase font-black">Audit Stream Strength</div>
                             <div className="text-[10px] font-bold text-green-400">Secure</div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex gap-1">
                             {Array.from({ length: 4 }).map((_, i) => (
                                 <div key={i} className="flex-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOverview = () => (
        <PrePilotOverview project={project} onGenerateStrategy={handleGenerateStrategy} isGeneratingStrategy={isGeneratingStrategy} />
    );

    const renderClients = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                        type="text" 
                        placeholder="Search clients..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectMode(!selectMode); setSelectedClientIds([]); setSelectedCampaignIds([]); }}
                      className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectMode ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    >
                      {selectMode ? 'Done' : 'Select'}
                    </button>
                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                        <Filter className="w-4 h-4 text-white/60" />
                    </button>
                    <button 
                        onClick={() => setIsAddingClient(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    >
                        <Plus className="w-4 h-4" /> Add Client
                    </button>
                </div>
            </div>

            {selectMode && (
              <div className="flex items-center gap-2 px-1 mb-3">
                <button onClick={selectAllClients} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all">
                  Select All
                </button>
                <button onClick={clearSelection} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all">
                  Clear
                </button>
                {selectedClientIds.length > 0 && (
                  <>
                    <span className="text-[9px] text-white/30 font-medium ml-2">{selectedClientIds.length} selected</span>
                    <button onClick={batchDeleteClients} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all">
                      Delete Selected
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((client, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={client.id} 
                        className="group bg-white/5 border border-white/10 p-5 rounded-3xl hover:border-white/20 transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            {selectMode && (
                              <input
                                type="checkbox"
                                checked={selectedClientIds.includes(client.id)}
                                onChange={() => toggleSelectClient(client.id)}
                                className="w-4 h-4 rounded border-white/20 bg-transparent text-[var(--color-accent)]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                    {client.logo ? (
                                        <img src={`data:${client.logo.mimeType};base64,${client.logo.base64}`} alt={client.name} className="w-8 h-8 object-contain" />
                                    ) : (
                                        <div className="text-lg font-bold text-white/20">{client.name[0]}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{client.name}</div>
                                    <div className="text-[10px] text-white/40">{client.industry}</div>
                                </div>
                            </div>
                            <button className="p-1 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-4">
                            <div className={cn(
                                "px-2 py-1 rounded-md text-[8px] font-black uppercase",
                                client.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                client.status === 'onboarding' ? 'bg-blue-500/10 text-blue-400' :
                                'bg-white/5 text-white/40'
                            )}>
                                {client.status}
                            </div>
                            <div className="text-[10px] text-white/40">• {project.campaigns.filter(c => c.clientId === client.id).length} Campaigns</div>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase text-white/60 hover:text-white transition-all">View Details</button>
                            <button className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-blue-400 transition-all">
                                <Rocket className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {project.clients.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-white/20">
                    <Users className="w-12 h-12 mb-4 opacity-10" />
                    <div className="text-sm font-bold mb-1">No clients registered</div>
                    <div className="text-[10px] uppercase font-black tracking-widest opacity-50">Start building your agency roster</div>
                </div>
            )}
        </div>
    );

    const renderCampaigns = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Campaign Oversight</h2>
                <button 
                    onClick={() => setIsAddingCampaign(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                >
                    <Plus className="w-4 h-4" /> Create Pilot
                </button>
            </div>

            {selectMode && (
              <div className="flex items-center gap-2 px-1 mb-3">
                <button onClick={selectAllCampaigns} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all">
                  Select All
                </button>
                <button onClick={clearSelection} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all">
                  Clear
                </button>
                {selectedCampaignIds.length > 0 && (
                  <>
                    <span className="text-[9px] text-white/30 font-medium ml-2">{selectedCampaignIds.length} selected</span>
                    <button onClick={batchDeleteCampaigns} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all">
                      Delete Selected
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="space-y-3">
                {project.campaigns.map((campaign, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={campaign.id} 
                        className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col md:flex-row md:items-center gap-6 hover:bg-white/[0.07] transition-all cursor-pointer"
                    >
                        {selectMode && (
                          <input
                            type="checkbox"
                            checked={selectedCampaignIds.includes(campaign.id)}
                            onChange={() => toggleSelectCampaign(campaign.id)}
                            className="w-4 h-4 rounded border-white/20 bg-transparent text-[var(--color-accent)]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="text-sm font-bold">{campaign.name}</div>
                                <div className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                                    campaign.status === 'live' ? 'bg-green-500/10 text-green-400' :
                                    campaign.status === 'planning' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-white/5 text-white/40'
                                )}>{campaign.status}</div>
                            </div>
                            <div className="text-[10px] text-white/40 flex items-center gap-2">
                                <Globe className="w-3 h-3" /> {project.clients.find(c => c.id === campaign.clientId)?.name || 'Direct Order'}
                            </div>
                        </div>

                        <div className="flex-1 max-w-[200px]">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[9px] text-white/40 font-black uppercase">Progress</div>
                                <div className="text-[10px] font-bold">{campaign.progress}%</div>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${campaign.progress}%` }}
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        campaign.progress > 80 ? 'bg-green-400' : 'bg-purple-400'
                                    )} 
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div>
                                <div className="text-[9px] text-white/40 font-black uppercase mb-1">Budget</div>
                                <div className="text-[11px] font-bold">{campaign.budget}</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-white/40 font-black uppercase mb-1">Timeline</div>
                                <div className="text-[11px] font-bold flex items-center gap-1.5"><Clock className="w-3 h-3 opacity-40" /> Q2/2026</div>
                            </div>
                            <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {project.campaigns.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-white/20">
                    <Rocket className="w-12 h-12 mb-4 opacity-10" />
                    <div className="text-sm font-bold mb-1">No active campaigns</div>
                    <div className="text-[10px] uppercase font-black tracking-widest opacity-50">Pilot your first strategic move</div>
                </div>
            )}
        </div>
    );

    const renderStrategy = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Target className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="text-sm font-bold text-white/90">Master Strategic Goal</h3>
                    </div>
                    <textarea 
                        value={project.strategicGoal}
                        onChange={(e) => setProject(s => ({ ...s, strategicGoal: e.target.value }))}
                        placeholder="Define your agency's high-level goal for this quarter..."
                        className="w-full h-32 p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500/30 transition-all resize-none"
                    />
                    <button 
                        onClick={handleGenerateStrategy}
                        disabled={isGeneratingStrategy || !project.strategicGoal}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        {isGeneratingStrategy ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {isGeneratingStrategy ? 'Processing...' : 'Synthesize Strategy with AI'}
                    </button>
                    
                    {project.marketAnalysis && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-white/60 overflow-y-auto max-h-[300px] prose prose-invert prose-xs"
                        >
                            <div className="whitespace-pre-wrap text-[10px] text-white/60 leading-relaxed">{project.marketAnalysis}</div>
                        </motion.div>
                    )}
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <h3 className="text-sm font-bold text-white/90">Market Sentiment Analysis</h3>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Global Economy', status: 'Stable', trend: 'up' },
                            { label: 'Agency Sector', status: 'Expanding', trend: 'up' },
                            { label: 'AI Integration', status: 'Critical', trend: 'up' },
                            { label: 'Consumer Trust', status: 'Volatile', trend: 'down' },
                            { label: 'Model Efficiency', status: 'Optimal', trend: 'up' },
                        ].map(item => (
                            <div key={item.label} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                <div className="text-[11px] font-bold text-white/80">{item.label}</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-white/30">{item.status}</span>
                                    {item.trend === 'up' ? <TrendingUp className="w-3 h-3 text-green-400 group-hover:scale-125 transition-transform" /> : <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <LineChart className="w-4 h-4 text-green-400" />
                        </div>
                        <h3 className="text-sm font-bold text-white/90">Execution Roadmap</h3>
                    </div>
                </div>
                
                <div className="relative space-y-4 pl-4 border-l-2 border-white/5">
                    {[
                        { title: 'Foundation Phase', desc: 'Secure anchor clients and establish AI workflows', status: 'completed' },
                        { title: 'Velocity Phase', desc: 'Scale campaign output by 40% using automated piloting', status: 'in-progress' },
                        { title: 'Market Dominance', desc: 'Establish thought leadership in AI-driven agency ops', status: 'upcoming' },
                    ].map((phase, i) => (
                        <div key={i} className="relative">
                            <div className={cn(
                                "absolute -left-[2.35rem] top-1 px-1 py-1 rounded-full border-4 border-[#0a0a0b]",
                                phase.status === 'completed' ? 'bg-green-500' : phase.status === 'in-progress' ? 'bg-blue-500 animate-pulse' : 'bg-white/10'
                            )}>
                                {phase.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white/80" />}
                            </div>
                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all cursor-default group">
                                <div className="text-[11px] font-bold mb-1 group-hover:text-blue-400 transition-colors">{phase.title}</div>
                                <div className="text-[10px] text-white/40">{phase.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderFinancials = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Financial Intelligence</h2>
                    <p className="text-[10px] text-white/40 uppercase font-black">Ledger Sync, Metered Billing & Cost Projections</p>
                </div>
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60">Generate Forecast</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Gross Volume', value: '$142,500', trend: '+12.4%', sub: 'vs Last Month' },
                    { label: 'AI Ops Tokens', value: '4.2M spent', trend: 'Stable', sub: 'Budget: 10M' },
                    { label: 'Agency Health', value: 'Prime', trend: 'Optimal', sub: 'Financial Stability' },
                ].map((m, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={m.label}
                        className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-3"
                    >
                         <div className="text-[10px] text-white/30 font-black uppercase tracking-widest">{m.label}</div>
                         <div className="text-3xl font-bold tracking-tighter">{m.value}</div>
                         <div className="flex items-center justify-between">
                              <span className={cn("text-[10px] font-black uppercase", m.trend.includes('+') ? 'text-green-400' : 'text-blue-400')}>{m.trend}</span>
                              <span className="text-[10px] text-white/20 uppercase font-black">{m.sub}</span>
                         </div>
                    </motion.div>
                ))}
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
                 <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Consumption Velocity (30 Days)</h3>
                      <div className="flex gap-4">
                           <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                                <span className="text-[9px] text-white/40 font-black uppercase">Infrastructure</span>
                           </div>
                           <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-purple-500" />
                                <span className="text-[9px] text-white/40 font-black uppercase">Model Inference</span>
                           </div>
                      </div>
                 </div>

                 <div className="h-48 flex items-end justify-between gap-1.5 px-4 relative">
                      {project.billingData.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                               <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${d.cost / 5}%` }}
                                    className="w-full bg-blue-500/20 rounded-t-sm group-hover:bg-blue-500/40 transition-all cursor-default"
                               />
                               <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${d.cost / 10}%` }}
                                    className="w-full bg-purple-500/20 rounded-t-sm group-hover:bg-purple-500/40 transition-all"
                               />
                               <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-white/20 uppercase font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{d.date}</div>
                          </div>
                      ))}
                 </div>
            </div>
        </div>
    );

    const renderSystem = () => (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">System & Meta</h2>
                    <p className="text-[10px] text-white/40 uppercase font-black">White-labeling, API Keys & Core Preferences</p>
                </div>
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase transition-all">Restart Engine</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
                      <div className="space-y-2">
                           <h3 className="text-base font-bold">Branding Engine</h3>
                           <p className="text-[10px] text-white/40 uppercase font-black">Customize the look and feel for client reports</p>
                      </div>
                      
                      <div className="space-y-6">
                           <div>
                                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-3 block">Primary Agency Color</label>
                                <div className="flex items-center gap-2">
                                     {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map(c => (
                                         <button key={c} className="w-10 h-10 rounded-2xl border-4 border-transparent hover:border-white/20 transition-all" style={{ backgroundColor: c }} />
                                     ))}
                                     <button className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                                </div>
                           </div>

                           <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest block">Agency Name</label>
                                <input type="text" defaultValue="PrePilot Enterprise" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500/50" />
                           </div>

                           <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest block">Custom Domain</label>
                                <div className="relative">
                                     <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                     <input type="text" defaultValue="portal.agency-suite.com" className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500/50" />
                                </div>
                           </div>
                      </div>
                 </div>

                 <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
                      <div className="space-y-2">
                           <h3 className="text-base font-bold">API & Integration Keys</h3>
                           <p className="text-[10px] text-white/40 uppercase font-black">Manage secure endpoints for connected services</p>
                      </div>

                      <div className="space-y-4">
                           {[
                               { label: 'Gemini AI Hub', key: 'sk-•••••••••••••4a2', status: 'active' },
                               { label: 'Salesforce API', key: 'sf-•••••••••••••98x', status: 'active' },
                               { label: 'SAP Ledger Link', key: 'sap-••••••••••••c01', status: 'active' },
                               { label: 'Microsoft Graph', key: 'ms-••••••••••••e02', status: 'error' },
                           ].map(k => (
                               <div key={k.label} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                         <div className={cn("w-2 h-2 rounded-full", k.status === 'active' ? 'bg-green-500' : 'bg-red-500')} />
                                         <div>
                                              <div className="text-[11px] font-bold">{k.label}</div>
                                              <div className="text-[9px] font-mono text-white/30">{k.key}</div>
                                         </div>
                                    </div>
                                    <button className="p-2 text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><Edit3 className="w-4 h-4" /></button>
                               </div>
                           ))}
                      </div>

                      <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl space-y-3">
                           <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-tight">
                                <AlertCircle className="w-4 h-4" /> Danger Zone
                           </div>
                           <p className="text-[10px] text-red-400/60 leading-relaxed uppercase font-black">Permanently delete all agency data, agents, and history. This action cannot be undone.</p>
                           <button className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all border border-red-500/20">Purge Agency Data</button>
                      </div>
                 </div>
            </div>
        </div>
    );

    return (
        <div className="w-full bg-[#0a0a0b] text-white font-sans selection:bg-blue-500 selection:text-white">
            <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-2">
                                    PrePilot
                                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-black uppercase tracking-widest leading-none">Pro Suite</span>
                                </h1>
                                <p className="text-[11px] text-white/40 uppercase font-black tracking-[0.2em]">Agency Strategic Oversight System</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 group bg-white/5 border border-white/10 p-1.5 rounded-2xl overflow-x-auto max-w-[80vw] no-scrollbar">
                            {['overview', 'clients', 'campaigns', 'crm', 'team', 'agents', 'workflows', 'knowledge', 'governance', 'strategy', 'pilots', 'financials', 'system'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setProject(s => ({ ...s, activeTab: tab as any }))}
                                    className={cn(
                                        "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 whitespace-nowrap",
                                        activeTab === tab 
                                            ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
                                            : "text-white/40 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="h-10 w-[1px] bg-white/10 mx-2" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-white/60">Live Mode</span>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: 'circOut' }}
                            className="min-h-[600px]"
                        >
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'clients' && renderClients()}
                            {activeTab === 'campaigns' && renderCampaigns()}
                            {activeTab === 'crm' && renderCRM()}
                            {activeTab === 'team' && renderTeam()}
                            {activeTab === 'agents' && renderAgents()}
                            {activeTab === 'workflows' && renderWorkflows()}
                            {activeTab === 'knowledge' && renderKnowledge()}
                            {activeTab === 'governance' && renderGovernance()}
                            {activeTab === 'strategy' && renderStrategy()}
                            {activeTab === 'financials' && renderFinancials()}
                            {activeTab === 'system' && renderSystem()}
                            {activeTab === 'pilots' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold tracking-tight">AI Piloting Sandbox</h2>
                                            <p className="text-[10px] text-white/40 uppercase font-black">Campaign Simulation & Optimization</p>
                                        </div>
                                        <button 
                                            onClick={handleSimulatePilot}
                                            disabled={isSimulating || project.campaigns.length === 0}
                                            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2"
                                        >
                                            {isSimulating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                                            {isSimulating ? 'Calibrating...' : 'Launch Simulation'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 space-y-4">
                                            {project.pilotResults.map((pilot, i) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    key={pilot.id} 
                                                    className="p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/[0.07] transition-all group"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                                                                <Activity className="w-5 h-5 text-blue-400" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white">{pilot.name}</h4>
                                                                <div className="text-[10px] text-white/40 flex items-center gap-2">
                                                                    <ShieldCheck className="w-3 h-3" /> Risk: <span className={cn(
                                                                        pilot.risk === 'Low' ? 'text-green-400' : 'text-orange-400'
                                                                    )}>{pilot.risk}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold tracking-tighter text-blue-400">{pilot.confidence}%</div>
                                                            <div className="text-[10px] text-white/30 uppercase font-black">Confidence</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[11px] text-white/60 italic">
                                                        "{pilot.outcome}"
                                                    </div>
                                                </motion.div>
                                            ))}
                                            
                                            {project.pilotResults.length === 0 && (
                                                <div className="h-64 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[2rem] opacity-30">
                                                    <Zap className="w-12 h-12 mb-4" />
                                                    <span className="text-[10px] uppercase font-black tracking-widest">Awaiting Simulation Ignition</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 rounded-[2rem] space-y-4">
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-white/80">AI Insights</h4>
                                                <div className="space-y-3">
                                                    {[
                                                        'Optimal conversion window identified between 18:00 - 22:00',
                                                        'Competitive fatigue detected in tech sector, pivot to lifestyle focus',
                                                        'Budget distribution improved efficiency by 22% in simulation'
                                                    ].map((insight, i) => (
                                                        <div key={i} className="flex gap-3">
                                                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                                                            <p className="text-[10px] text-white/60 leading-relaxed">{insight}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isAddingClient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddingClient(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0f0f12] border border-white/10 rounded-[32px] p-8 overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <button onClick={() => setIsAddingClient(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                                   <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                            
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold tracking-tight">Onboard New Client</h3>
                                <p className="text-[11px] text-white/40 uppercase font-black tracking-widest">Entry to PrePilot ecosystem</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2 block">Client Name</label>
                                    <input 
                                        type="text" 
                                        autoFocus
                                        id="client-name-input"
                                        placeholder="e.g. Nexus Corp"
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2 block">Industry</label>
                                    <select 
                                        id="client-industry-input"
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                                    >
                                        <option value="Technology">Technology</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Services">Services</option>
                                        <option value="Energy">Energy</option>
                                        <option value="Healthcare">Healthcare</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={() => {
                                        const nameEl = document.getElementById('client-name-input') as HTMLInputElement;
                                        const industryEl = document.getElementById('client-industry-input') as HTMLSelectElement;
                                        handleAddClient({ name: nameEl.value, industry: industryEl.value });
                                    }}
                                    className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] mt-4"
                                >
                                    Activate Integration
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isAddingCampaign && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddingCampaign(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0f0f12] border border-white/10 rounded-[32px] p-8 overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <button onClick={() => setIsAddingCampaign(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                                   <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                            
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold tracking-tight">Initiate Campaign Pilot</h3>
                                <p className="text-[11px] text-white/40 uppercase font-black tracking-widest">Strategic deployment simulation</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2 block">Campaign Name</label>
                                    <input 
                                        type="text" 
                                        autoFocus
                                        id="campaign-name-input"
                                        placeholder="e.g. Q2 Growth Engine"
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-purple-500/50 transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2 block">Client</label>
                                    <select 
                                        id="campaign-client-input"
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-purple-500/50 transition-all font-bold"
                                    >
                                        <option value="">Direct Order (No Client)</option>
                                        {project.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2 block">Budget Allocation</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input 
                                            type="text" 
                                            id="campaign-budget-input"
                                            placeholder="50,000"
                                            className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-purple-500/50 transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        const nameEl = document.getElementById('campaign-name-input') as HTMLInputElement;
                                        const clientEl = document.getElementById('campaign-client-input') as HTMLSelectElement;
                                        const budgetEl = document.getElementById('campaign-budget-input') as HTMLInputElement;
                                        handleAddCampaign({ 
                                            name: nameEl.value, 
                                            clientId: clientEl.value,
                                            budget: `$${budgetEl.value}`
                                        });
                                    }}
                                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] mt-4"
                                >
                                    Confirm Strategic Pilot
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PrePilotAgencySuite;
