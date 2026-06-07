
import React, { useState, useEffect, useMemo } from 'react';
import { 
    LayoutDashboard, 
    Users, 
    Rocket, 
    Target, 
    Zap, 
    BarChart3, 
    Plus, 
    Search, 
    Filter, 
    MoreVertical, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    TrendingUp, 
    Briefcase, 
    Globe, 
    Languages,
    ArrowRight,
    Sparkles,
    Trash2,
    Edit3,
    DollarSign,
    ShieldCheck,
    Cpu,
    Activity,
    LineChart,
    PieChart,
    Calendar,
    ChevronRight,
    ExternalLink,
    RefreshCcw,
    Terminal,
    Image as ImageIcon,
    Database,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrePilotAgencySuiteProject, PrePilotClient, PrePilotCampaign } from '../types';
import { cn } from '../lib/utils';

// --- Mock Initial Data for new projects ---
const INITIAL_METRICS = {
    totalRevenue: "$1.2M",
    growth: "+14.2%",
    burnRate: "$45k/mo",
    efficiency: "92%"
};

const PrePilotAgencySuite: React.FC<{
    project: PrePilotAgencySuiteProject;
    setProject: React.Dispatch<React.SetStateAction<PrePilotAgencySuiteProject>>;
}> = ({ project, setProject }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [isAddingCampaign, setIsAddingCampaign] = useState(false);

    const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    const activeTab = project.activeTab;
    
    // Default data for empty states
    const MOCK_LEADS = [
        { id: 'l1', company: 'TechNova', contact: 'Sarah J.', value: '$45,000', stage: 'qualified', probability: 80 },
        { id: 'l2', company: 'GreenPath', contact: 'Mark R.', value: '$12,000', stage: 'proposal', probability: 65 },
        { id: 'l3', company: 'Global Logistics', contact: 'Elena V.', value: '$88,000', stage: 'negotiation', probability: 40 },
    ];

    const MOCK_TEAM = [
        { id: 't1', name: 'Alex Rivera', role: 'Chief Strategist', dept: 'Strategy', load: 85 },
        { id: 't2', name: 'Jordan Chen', role: 'Head of Creative', dept: 'Creative', load: 42 },
        { id: 't3', name: 'Sam Taylor', role: 'DevOps Lead', dept: 'Tech', load: 91 },
    ];

    const renderCRM = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Sales Pipeline</h2>
                    <p className="text-[10px] text-white/40 uppercase font-black">Lead Tracking & Conversion Growth</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[10px] font-black uppercase transition-all">
                    <Plus className="w-4 h-4" /> New Lead
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {['Leads', 'Qualified', 'Proposal', 'Negotiation', 'Closed'].map((stage, i) => (
                    <div key={stage} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{stage}</span>
                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40">
                                {stage === 'Leads' ? 5 : stage === 'Qualified' ? 2 : 1}
                            </div>
                        </div>
                        <div className="space-y-3 min-h-[200px] p-2 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                            {MOCK_LEADS.filter(l => l.stage === stage.toLowerCase()).map(lead => (
                                <div key={lead.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all cursor-move group">
                                    <div className="text-xs font-bold mb-1 group-hover:text-emerald-400 transition-colors">{lead.company}</div>
                                    <div className="text-[9px] text-white/40 mb-3">{lead.contact}</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-bold text-emerald-400/80">{lead.value}</div>
                                        <div className="text-[9px] font-black text-white/20">{lead.probability}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderTeam = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Agency Talent</h2>
                    <p className="text-[10px] text-white/40 uppercase font-black">Capacity Planning & Skill Matrix</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60">Recruitment</button>
                    <button className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-[10px] font-black uppercase shadow-[0_0_20px_rgba(59,130,246,0.3)]">Invite Member</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {MOCK_TEAM.map((member, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={member.id} 
                        className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:border-white/20 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg font-bold border border-white/10">
                                {member.name[0]}
                            </div>
                            <div>
                                <div className="text-sm font-bold">{member.name}</div>
                                <div className="text-[10px] text-white/40 uppercase font-black">{member.role}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-black uppercase text-white/30">Availability</span>
                                    <span className={cn("text-[10px] font-bold", member.load > 90 ? 'text-red-400' : 'text-green-400')}>{member.load}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className={cn("h-full transition-all duration-1000", member.load > 90 ? 'bg-red-400' : 'bg-blue-400')} style={{ width: `${member.load}%` }} />
                                </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <span className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase text-white/40">{member.dept}</span>
                                <span className="px-2 py-1 bg-green-500/10 rounded-lg text-[8px] font-black uppercase text-green-400">Online</span>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase text-white/60 hover:text-white transition-all">Schedule Task</button>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const handleSimulatePilot = async () => {
        if (project.campaigns.length === 0) return;
        setIsSimulating(true);
        try {
            const { callAI } = await import('../services/geminiService');
            const campaign = project.campaigns[project.campaigns.length - 1];
            const prompt = `Simulate a marketing pilot for campaign: ${campaign.name}. Budget: ${campaign.budget}. 
            Provide 3 potential scenarios with: id, name, confidence(number 0-100), risk (Low/Med/High), outcome (1 sentence).
            Return ONLY a raw JSON array.`;
            
            const response = await callAI(prompt, project.aiConfig || { provider: 'google', modelId: 'gemini-1.5-flash' });
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const results = JSON.parse(jsonMatch[0]);
                setProject(s => ({ ...s, pilotResults: results }));
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

    const renderAgents = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Agent Infrastructure</h2>
                    <p className="text-[10px] text-white/40 uppercase font-black">Declarative & Custom Engine Orchestrators</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60 hover:text-white transition-all">
                        Benchmark Models
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <Plus className="w-4 h-4" /> Create New Agent
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {project.agents.map((agent, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={agent.id}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Cpu className="w-20 h-20 rotate-12" />
                        </div>
                        
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 group-hover:scale-110 transition-transform">
                                <Cpu className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="flex gap-2">
                                <div className={cn(
                                    "px-2 py-1 rounded text-[8px] font-black uppercase",
                                    agent.type === 'engine' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                )}>
                                    {agent.type} Agent
                                </div>
                                <div className={cn(
                                    "w-2 h-2 rounded-full mt-1.5",
                                    agent.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-white/20'
                                )} />
                            </div>
                        </div>

                        <div className="mb-4 relative z-10">
                            <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{agent.role}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-6 relative z-10">
                            {[
                                { label: 'Tasks', value: agent.metrics.tasksCompleted },
                                { label: 'Latency', value: agent.metrics.latency },
                                { label: 'Uptime', value: `${agent.metrics.uptime}%` },
                            ].map(m => (
                                <div key={m.label} className="p-2 bg-black/20 rounded-xl border border-white/5 text-center">
                                    <div className="text-[8px] text-white/30 uppercase font-black">{m.label}</div>
                                    <div className="text-[10px] font-bold text-white/80">{m.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 mb-6 relative z-10">
                            <div className="text-[9px] text-white/30 font-black uppercase tracking-wider mb-2">Capabilities</div>
                            <div className="flex flex-wrap gap-2">
                                {agent.capabilities.map(cap => (
                                    <div key={cap} className="px-2 py-1 bg-white/5 rounded-lg text-[9px] text-white/60 flex items-center gap-1.5 hover:bg-white/10 transition-colors cursor-default">
                                        {cap === 'python' && <Terminal className="w-3 h-3 text-green-400" />}
                                        {cap === 'vision' && <ImageIcon className="w-3 h-3 text-orange-400" />}
                                        {cap === 'orchestration' && <Zap className="w-3 h-3 text-purple-400" />}
                                        {cap === 'rest_api' && <Globe className="w-3 h-3 text-blue-400" />}
                                        {cap === 'code_interpreter' && <Terminal className="w-3 h-3 text-cyan-400" />}
                                        {cap.replace('_', ' ')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-white/5">
                            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase text-white/60 hover:text-white transition-all">Configure Logic</button>
                            <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-blue-400 transition-all">
                                <Activity className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}

                <button className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-6 h-full min-h-[300px] flex flex-col items-center justify-center group hover:bg-white/[0.07] transition-all">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-white/20" />
                    </div>
                    <div className="text-sm font-bold text-white/30">Orchestrate Engine</div>
                    <p className="text-[9px] text-white/20 mt-2 uppercase font-black tracking-widest text-center px-8">Define custom reasoning loops & tool definitions</p>
                </button>
            </div>
        </div>
    );

    const renderWorkflows = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Enterprise Operations</h2>
                    <p className="text-[10px] text-white/40 uppercase font-black">1,400+ Connectors & Event-Driven Automation</p>
                </div>
                <div className="flex gap-2">
                   <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60 hover:text-white transition-all">Telemetry Logs</button>
                   <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                       <Sparkles className="w-4 h-4 mr-2 inline" /> Describe Pipeline
                   </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {project.workflows.map((wf, i) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={wf.id}
                            className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/[0.07] transition-all"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-2xl border",
                                        wf.status === 'active' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    )}>
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{wf.name}</h3>
                                        <div className="text-[10px] text-white/40 uppercase font-black flex items-center gap-2">
                                            {wf.trigger} Trigger • {wf.steps.length} Steps
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="relative space-y-3 mb-6">
                                {wf.steps.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            step.status === 'done' ? 'bg-green-500' : step.status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-white/10'
                                        )} />
                                        <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group-hover:border-white/10 transition-all">
                                            <div className="text-[11px] font-bold text-white/80">{step.action}</div>
                                            <div className="flex items-center gap-2">
                                                {step.agentId && <div className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[8px] font-black uppercase">AI Agent</div>}
                                                {step.connector && <div className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[8px] font-black uppercase">{step.connector}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="absolute left-[3px] top-2 bottom-2 w-[2px] bg-white/5 -z-10" />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="text-[9px] text-white/40 uppercase font-black tracking-widest">Autonomous Reliability: 99.9%</div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase text-white/60">View Traces</button>
                                    <button className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-[9px] font-black uppercase">Force Sync</button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 rounded-[2rem] space-y-4">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-white/80">Active Connectors</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {['Salesforce', 'ServiceNow', 'SAP', 'Jira', 'Slack', 'SharePoint'].map(c => (
                                <div key={c} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer">
                                    <span className="text-[10px] font-bold text-white/70">{c}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/40 hover:text-white transition-all">
                            Browse 1,400+ Connectors
                        </button>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-white/80">API Gateway</h4>
                            <div className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[8px] font-black uppercase">Functional</div>
                        </div>
                        <div className="space-y-2">
                            <div className="p-2 bg-black/20 rounded font-mono text-[9px] text-blue-400 flex items-center justify-between">
                                <span>GET /api/v1/agents</span>
                                <span className="text-white/20">200 OK</span>
                            </div>
                            <div className="p-2 bg-black/20 rounded font-mono text-[9px] text-blue-400 flex items-center justify-between">
                                <span>POST /api/v1/orchestration</span>
                                <span className="text-white/20">204 No Content</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

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
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Clients', value: stats.totalClients, icon: Users, color: 'text-blue-400' },
                    { label: 'Live Campaigns', value: stats.liveCampaigns, icon: Rocket, color: 'text-purple-400' },
                    { label: 'Monthly Volume', value: stats.totalBudget, icon: DollarSign, color: 'text-green-400' },
                    { label: 'Avg. Progress', value: stats.avgProgress, icon: Activity, color: 'text-orange-400' },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label} 
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all cursor-default"
                    >
                        <div>
                            <div className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1">{stat.label}</div>
                            <div className="text-2xl font-bold text-white tracking-tighter">{stat.value}</div>
                        </div>
                        <div className={cn("p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform", stat.color)}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Performance Charts Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-blue-400" />
                            </div>
                            <h3 className="text-sm font-bold text-white/90">Strategic Velocity</h3>
                        </div>
                        <div className="flex gap-2">
                            {['7D', '1M', '3M', '1Y'].map(t => (
                                <button key={t} className="px-2 py-1 rounded-md text-[9px] font-black uppercase bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">{t}</button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Simulated Graph */}
                    <div className="h-48 flex items-end justify-between gap-1 px-2">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${20 + Math.random() * 80}%` }}
                                transition={{ delay: i * 0.02, type: 'spring', damping: 10 }}
                                key={i} 
                                className="w-full bg-blue-500/20 rounded-t-sm relative group"
                            >
                                <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-sm" />
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <PieChart className="w-4 h-4 text-purple-400" />
                        </div>
                        <h3 className="text-sm font-bold text-white/90">Client Industry Split</h3>
                    </div>
                    
                    <div className="flex items-center justify-center py-4">
                        <div className="relative w-32 h-32">
                           <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                             <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/5" strokeWidth="3" />
                             <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-400" strokeWidth="3" strokeDasharray="60, 100" />
                             <circle cx="18" cy="18" r="16" fill="none" className="stroke-purple-400" strokeWidth="3" strokeDasharray="30, 100" strokeDashoffset="-60" />
                             <circle cx="18" cy="18" r="16" fill="none" className="stroke-green-400" strokeWidth="3" strokeDasharray="10, 100" strokeDashoffset="-90" />
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center flex-col">
                               <div className="text-xl font-bold">{project.clients.length}</div>
                               <div className="text-[8px] text-white/40 uppercase font-black">Sectors</div>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {[
                            { label: 'Technology', value: 60, color: 'bg-blue-400' },
                            { label: 'Retail', value: 30, color: 'bg-purple-400' },
                            { label: 'Services', value: 10, color: 'bg-green-400' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                                    <span className="text-white/60">{item.label}</span>
                                </div>
                                <span className="font-bold">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Agent Status */}
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-transparent border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-full animate-pulse">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold">PrePilot AI Assistant</div>
                        <div className="text-[10px] text-white/50">Analyzing market fluctuations and campaign efficiency in real-time...</div>
                    </div>
                </div>
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-black uppercase rounded-lg transition-all">
                    Run New Simulation
                </button>
            </div>
        </div>
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

            <div className="space-y-3">
                {project.campaigns.map((campaign, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={campaign.id} 
                        className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col md:flex-row md:items-center gap-6 hover:bg-white/[0.07] transition-all cursor-pointer"
                    >
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
                            <div dangerouslySetInnerHTML={{ __html: project.marketAnalysis.replace(/\n/g, '<br/>') }} />
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
                            {activeTab === 'financials' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-2">
                                            <div className="text-[10px] text-white/40 font-black uppercase">Gross Volume</div>
                                            <div className="text-3xl font-bold tracking-tighter">$142,500</div>
                                            <div className="text-[10px] text-green-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12.4% vs L.M.</div>
                                        </div>
                                        <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-2">
                                            <div className="text-[10px] text-white/40 font-black uppercase">Pipeline Value</div>
                                            <div className="text-3xl font-bold tracking-tighter">$2.1M</div>
                                            <div className="text-[10px] text-blue-400 uppercase font-black underline cursor-pointer">View breakdown</div>
                                        </div>
                                        <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-2">
                                            <div className="text-[10px] text-white/40 font-black uppercase">Agency Health</div>
                                            <div className="text-3xl font-bold tracking-tighter text-blue-400">Prime</div>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-4 h-1 bg-blue-500 rounded-full" />)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem]">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="font-bold">Managed Budgets</h3>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded bg-blue-500" />
                                                    <span className="text-[10px] text-white/40 font-black uppercase">Allocated</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded bg-white/10" />
                                                    <span className="text-[10px] text-white/40 font-black uppercase">Remaining</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {project.campaigns.map(c => (
                                                <div key={c.id} className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold opacity-80">{c.name}</span>
                                                        <span className="font-mono text-white/40">{c.budget}</span>
                                                    </div>
                                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.random() * 60 + 30}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {project.campaigns.length === 0 && (
                                                <div className="text-center py-12 text-[10px] uppercase font-black tracking-widest text-white/20">No budget data available</div>
                                            )}
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
