import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, sanitizeData, collection, query, orderBy, onSnapshot, addDoc, updateDoc, setDoc, deleteDoc, doc, serverTimestamp } from '../lib/firebase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Integration, ApiLog, ExternalServiceConfig } from '../types';
import {
    Settings,
    Plus,
    Trash2,
    RefreshCcw,
    Activity,
    Shield,
    Globe,
    Key,
    CheckCircle2,
    XCircle,
    Cpu,
    Zap,
    Layers,
    Database,
    Terminal,
    Server,
    Network,
    Lock,
    Search,
    Users,
    HardDrive,
    History,
    Archive,
    Briefcase,
    Palette,
    Download,
    Upload,
    Brain,
    Layout,
    ExternalLink,
    Copy,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalHistoryPanel from './GlobalHistoryPanel';
import AssetLibraryPanel from './AssetLibraryPanel';
import ProjectHubPanel from './ProjectHubPanel';
import SmartSuggestions from './SmartSuggestions';

const EcosystemCard: React.FC<{ title: string, desc: string, icon: any, onClick: () => void }> = ({ title, desc, icon: Icon, onClick }) => (
    <div 
        onClick={onClick}
        className="glass-card p-6 border border-white/5 bg-white/[0.02] rounded-[32px] cursor-pointer hover:border-[var(--color-accent)]/30 transition-all group flex flex-col items-center text-center gap-4"
    >
        <div className="p-4 rounded-2xl bg-white/5 text-white/20 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h4 className="text-xs font-black text-white tracking-widest uppercase italic mb-1">{title}</h4>
            <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">{desc}</p>
        </div>
    </div>
);

const ViewHeader: React.FC<{ label: string, onBack: () => void }> = ({ label, onBack }) => (
    <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all group mb-4"
    >
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10">
            <RefreshCcw className="w-3 h-3 rotate-[-90deg]" />
        </div>
        Return to Nexus / {label}
    </button>
);

interface AdminStudioProps {
    onEngageProject?: (project: any) => void;
}

const AdminStudio: React.FC<AdminStudioProps> = ({ onEngageProject }) => {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [logs, setLogs] = useState<ApiLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<'integrations' | 'projects' | 'users' | 'logs' | 'stats' | 'infrastructure' | 'models' | 'settings' | 'external'>('integrations');
    const [activeSettingsView, setActiveSettingsView] = useState<'governance' | 'vault' | 'history' | 'appearance' | 'general'>('governance');
    const [history, setHistory] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [systemHealth, setSystemHealth] = useState(100);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    const [historyFilter, setHistoryFilter] = useState<'all' | 'image' | 'audio' | 'text'>('all');

    useEffect(() => {
        if (logs.length > 0) {
            const recentLogs = logs.slice(0, 50);
            const successRate = (recentLogs.filter(l => l.status < 400).length / recentLogs.length) * 100;
            setSystemHealth(Math.round(successRate));
        }
    }, [logs]);

    const [systemConfig, setSystemConfig] = useState<{
        activeStudios: string[];
        maintenanceMode: boolean;
        allowNewRegistrations: boolean;
        version: string;
    }>({
        activeStudios: [],
        maintenanceMode: false,
        allowNewRegistrations: true,
        version: '4.0.0-neural'
    });

    const [externalServices, setExternalServices] = useState<ExternalServiceConfig[]>([]);
    const [isAddingExternal, setIsAddingExternal] = useState(false);
    const [newExternalService, setNewExternalService] = useState({
        name: '', url: '', description: '', capabilities: [] as string[], icon: 'ExternalLink', color: '#6366f1', models: [] as string[], isFree: true, isActive: true
    });

    const [isAddingModel, setIsAddingModel] = useState(false);
    const [editingModel, setEditingModel] = useState<any>(null);
    const [newModel, setNewModel] = useState<any>({
        name: '',
        provider: 'google',
        modelId: '',
        description: '',
        icon: 'Brain',
        isFree: true,
        costPerCall: 0,
        studios: [],
        status: 'active'
    });

    const [newIntegration, setNewIntegration] = useState<{
        name: string;
        provider: Integration['provider'];
        apiKeys: string[];
        endpoint: string;
        authType: Integration['authType'];
        authHeaderName: string;
        requestTemplate: string;
        responsePath: string;
    }>({
        name: '',
        provider: 'gemini',
        apiKeys: [''],
        endpoint: '',
        authType: 'header',
        authHeaderName: 'x-api-key',
        requestTemplate: '{"contents":[{"role":"user","parts":[{"text":"{{prompt}}"}]}]}',
        responsePath: 'candidates[0].content.parts[0].text'
    });

    // Process logs for charts
    const chartData = logs.slice().reverse().map(log => ({
        time: (log.timestamp && (log.timestamp as any).seconds) ? new Date((log.timestamp as any).seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        latency: log.responseTime || 0,
        status: log.status
    })).slice(-30);

    const providerStats = integrations.map(int => ({
        name: int.name,
        count: logs.filter(l => l.service === int.name).length
    }));

    useEffect(() => {
        const iQuery = query(collection(db, 'integrations'), orderBy('updatedAt', 'desc'));
        const lQuery = query(collection(db, 'apiLogs'), orderBy('timestamp', 'desc'));

        const unsubI = onSnapshot(iQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Integration));
            setIntegrations(data);
            setIsLoading(false);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'integrations'));

        const unsubL = onSnapshot(lQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApiLog));
            setLogs(data);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'apiLogs'));

        const unsubS = onSnapshot(doc(db, 'system_config', 'main'), (snap) => {
            if (snap.exists()) {
                setSystemConfig(prev => ({ ...prev, ...snap.data() }));
            }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'system_config/main'));

        const unsubH = onSnapshot(query(collection(db, 'history'), orderBy('timestamp', 'desc')), (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistory(data);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'history'));

        const unsubU = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(data);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

        const unsubM = onSnapshot(query(collection(db, 'models'), orderBy('createdAt', 'desc')), (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setModels(data);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'models'));

        const unsubE = onSnapshot(query(collection(db, 'external_services'), orderBy('name', 'asc')), (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExternalServiceConfig));
            setExternalServices(data);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'external_services'));

        return () => {
            unsubI();
            unsubL();
            unsubS();
            unsubH();
            unsubU();
            unsubM();
            unsubE();
        };
    }, []);

    const updateSystemConfig = async (updates: Partial<typeof systemConfig>) => {
        try {
            await setDoc(doc(db, 'system_config', 'main'), {
                ...updates,
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser?.email
            }, { merge: true });
        } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, 'system_config/main');
        }
    };

    const handleAddIntegration = async () => {
        try {
            const filteredKeys = newIntegration.apiKeys.filter(k => k.trim());
            const data = sanitizeData({
                ...newIntegration,
                apiKeys: filteredKeys.length > 0 ? filteredKeys : [''],
                status: 'active',
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, 'integrations'), data);
            setIsAdding(false);
            setNewIntegration({ name: '', provider: 'gemini', apiKeys: [''], endpoint: '', authType: 'header', authHeaderName: 'x-api-key', requestTemplate: '{"contents":[{"role":"user","parts":[{"text":"{{prompt}}"}]}]}', responsePath: 'candidates[0].content.parts[0].text' });
        } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'integrations');
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        try {
            await updateDoc(doc(db, 'integrations', id), {
                status: currentStatus === 'active' ? 'disabled' : 'active',
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `integrations/${id}`);
        }
    };

    const handleAddExternalService = async () => {
        try {
            const data = sanitizeData({
                ...newExternalService,
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, 'external_services'), data);
            setIsAddingExternal(false);
            setNewExternalService({ name: '', url: '', description: '', capabilities: [], icon: 'ExternalLink', color: '#6366f1', models: [], isFree: true, isActive: true });
        } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'external_services');
        }
    };

    const handleDeleteExternalService = async (id: string) => {
        if (!confirm('Delete this external service?')) return;
        try {
            await deleteDoc(doc(db, 'external_services', id));
        } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `external_services/${id}`);
        }
    };

    const toggleExternalServiceStatus = async (id: string, current: boolean) => {
        try {
            await updateDoc(doc(db, 'external_services', id), { isActive: !current, updatedAt: serverTimestamp() });
        } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `external_services/${id}`);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Critical Command: Terminate user node?')) return;
        try {
            await deleteDoc(doc(db, 'users', id));
        } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
        }
    };

    const handleDeleteHistory = async (id: string) => {
        if (!confirm('Critical Command: Erase neural memory?')) return;
        try {
            await deleteDoc(doc(db, 'history', id));
        } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `history/${id}`);
        }
    };

    const handleDeleteLog = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'apiLogs', id));
        } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `apiLogs/${id}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Critical Command: Purge integration node?')) return;
        try {
            await deleteDoc(doc(db, 'integrations', id));
        } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `integrations/${id}`);
        }
    };

    const handleAddModel = async () => {
        try {
            const data = {
                ...newModel,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            if (editingModel) {
                await setDoc(doc(db, 'models', editingModel.id), sanitizeData(data), { merge: true });
            } else {
                await addDoc(collection(db, 'models'), sanitizeData(data));
            }
            setIsAddingModel(false);
            setEditingModel(null);
            setNewModel({
                name: '',
                provider: 'google',
                modelId: '',
                description: '',
                icon: 'Brain',
                isFree: true,
                costPerCall: 0,
                studios: [],
                status: 'active'
            });
        } catch (err) {
            handleFirestoreError(err, editingModel ? OperationType.UPDATE : OperationType.CREATE, 'models');
        }
    };

    const handleDeleteModel = async (id: string) => {
        if (!confirm('Critical Command: Terminate AI Model node?')) return;
        try {
            await deleteDoc(doc(db, 'models', id));
        } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `models/${id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/20">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="mb-4"
                >
                    <RefreshCcw className="w-12 h-12" />
                </motion.div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Initializing Neural Link...</span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 overflow-hidden bg-black/20 animate-in fade-in duration-700">
            {/* Top Dashboard Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-[var(--color-accent)] rounded-[24px] flex items-center justify-center shadow-[0_15px_40px_rgba(var(--color-accent-rgb),0.3)] border border-white/10">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Control Center</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">NeuralOS v{systemConfig.version}</span>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">System Healthy</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden xl:flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-1.5 grayscale hover:grayscale-0 transition-all">
                        <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-all text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest">
                            <Download className="w-3.5 h-3.5" />
                            Data Dump
                        </button>
                        <div className="w-px h-6 bg-white/10" />
                        <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-all text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest">
                            <Upload className="w-3.5 h-3.5" />
                            Nexus Ingress
                        </button>
                    </div>
                    <div className="flex bg-white/5 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 shadow-xl overflow-x-auto suggestions-scrollbar max-w-[90vw] md:max-w-none">
                        <TabItem active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} icon={Network} label="Pipelines" />
                        <TabItem active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={Briefcase} label="Nexus" />
                        <TabItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Brains" />
                        <TabItem active={activeTab === 'models'} onClick={() => setActiveTab('models')} icon={Cpu} label="AI Models" />
                        <TabItem active={activeTab === 'external'} onClick={() => setActiveTab('external')} icon={ExternalLink} label="External" />
                        <TabItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={Terminal} label="Logs" />
                        <TabItem active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={Activity} label="Telemetry" />
                        <TabItem active={activeTab === 'infrastructure'} onClick={() => setActiveTab('infrastructure')} icon={Server} label="Infra" />
                        <TabItem active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setActiveSettingsView('governance'); }} icon={Settings} label="Govern" />
                    </div>
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
                <StatMetric label="Sys Health" value={`${systemHealth}%`} icon={Zap} trend="+0.2%" />
                <StatMetric label="Live Signals" value={logs.length} icon={Database} trend={logs.length > 0 ? "Signal" : "Stable"} />
                <StatMetric label="Retention" value={history.length} icon={Layers} trend="Memories" />
                <StatMetric label="Population" value={users.length} icon={Users} trend="Brains" />
                <StatMetric label="Avg Delay" value={`${logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + (l.responseTime || 0), 0) / logs.length) : 0}ms`} icon={Activity} trend="-12ms" />
            </div>

            {/* Neural Insights (Smart Suggestions) */}
            <div className="mb-10">
                <SmartSuggestions />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 overflow-hidden"
                >
                    {activeTab === 'integrations' ? (
                        <div className="h-full flex flex-col">
                            {/* ... existing integrations content ... */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="relative flex-grow max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input 
                                        type="text" 
                                        placeholder="Filter neural nodes..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full glass-input pl-12 pr-4 py-3 rounded-2xl text-xs uppercase font-black tracking-widest placeholder:text-white/10"
                                    />
                                </div>
                                <button 
                                    onClick={() => setIsAdding(true)}
                                    className="px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white rounded-2xl flex items-center gap-3 transition-all shadow-lg hover:scale-105 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Inject Node</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 suggestions-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {integrations.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(int => (
                                        <IntegrationCard 
                                            key={int.id} 
                                            int={int} 
                                            onToggle={() => toggleStatus(int.id, int.status)} 
                                            onDelete={() => handleDelete(int.id)} 
                                        />
                                    ))}
                                    {integrations.length === 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[40px] text-white/10">
                                            <Cpu className="w-16 h-16 mb-4 opacity-10" />
                                            <span className="text-sm font-black uppercase tracking-[0.3em]">No integration nodes found</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'projects' ? (
                        <div className="h-full overflow-y-auto suggestions-scrollbar">
                           <ProjectHubPanel onEngage={onEngageProject} />
                        </div>
                    ) : activeTab === 'users' ? (
                        <div className="h-full flex flex-col glass-card border border-white/5 rounded-[40px] overflow-hidden bg-black/40 shadow-2xl">
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-[var(--color-accent)]" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural Population</h3>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{users.length} Active Brains</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto suggestions-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/[0.02] text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">
                                            <th className="px-8 py-4">Identity</th>
                                            <th className="px-8 py-4">Email Nexus</th>
                                            <th className="px-8 py-4">Security Level</th>
                                            <th className="px-8 py-4">Creation Cycle</th>
                                            <th className="px-8 py-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-white/[0.02] transition-all group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-[var(--color-accent)]/30 transition-all">
                                                            <Users className="w-5 h-5 text-white/20 group-hover:text-[var(--color-accent)]" />
                                                        </div>
                                                        <span className="text-[11px] font-black text-white uppercase tracking-tight">{user.displayName || 'Anonymous Neural Node'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[11px] font-mono font-bold text-white/60">{user.email}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-amber-500 shadow-[0_0_10px_orange]' : 'bg-white/20'}`} />
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-amber-500' : 'text-white/40'}`}>
                                                            {user.role === 'admin' ? 'SYSTEM_ROOT' : 'NEURAL_UNIT'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                        {user.createdAt instanceof Object ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'SYNCING'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right pr-12">
                                                    <button 
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all text-white/20"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : activeTab === 'logs' ? (
                        <div className="h-full flex flex-col glass-card border border-white/5 rounded-[40px] overflow-hidden bg-black/40 shadow-2xl">
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Signal Stream</h3>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{logs.length} Frequency Buffers</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto suggestions-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/[0.02] text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">
                                            <th className="px-8 py-4">Relativity</th>
                                            <th className="px-8 py-4">Processor</th>
                                            <th className="px-8 py-4 text-center">Status</th>
                                            <th className="px-8 py-4">Latency</th>
                                            <th className="px-8 py-4">Entity</th>
                                            <th className="px-8 py-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {logs.map(log => (
                                            <tr key={log.id} className="hover:bg-white/[0.02] transition-all group">
                                                 <td className="px-8 py-5 text-[11px] text-white/60 font-mono tabular-nums">
                                                    {(log.timestamp && (log.timestamp as any).seconds) ? new Date((log.timestamp as any).seconds * 1000).toLocaleTimeString([], { hour12: false }) : 'SYNCING'}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] opacity-20" />
                                                        <span className="text-[11px] font-black text-white uppercase tracking-tight">{log.service}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <div className="flex justify-center">
                                                        {log.status < 400 ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shadow-[0_0_10px_#10b98150]" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-red-500 shadow-[0_0_10px_#ef444450]" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`text-[11px] font-mono font-bold ${log.responseTime ? (log.responseTime > 500 ? 'text-amber-500' : 'text-emerald-500') : 'text-white/20'}`}>
                                                        {log.responseTime ? `${log.responseTime}ms` : '---'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter truncate max-w-[120px] block font-mono">
                                                        {log.userId || 'ROOT_DAEMON'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <button 
                                                        onClick={() => handleDeleteLog(log.id)}
                                                        className="p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : activeTab === 'stats' ? (
                        <div className="h-full flex flex-col gap-8">
                             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
                                <div className="glass-card p-10 border border-white/5 flex flex-col shadow-2xl bg-black/40 rounded-[40px]">
                                    <div className="flex items-center justify-between mb-10">
                                        <div>
                                            <h3 className="text-lg font-black text-white tracking-widest uppercase italic">Latency Spectrum</h3>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">Real-time neural response delay (ms)</p>
                                        </div>
                                        <div className="px-4 py-2 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                                            <span className="text-xs font-black text-[var(--color-accent)] uppercase tracking-widest">Live Flow</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={true} />
                                                <XAxis dataKey="time" stroke="#ffffff10" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#ffffff10" fontSize={10} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px', backdropFilter: 'blur(10px)' }}
                                                    itemStyle={{ color: 'var(--color-accent)' }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="latency" 
                                                    stroke="var(--color-accent)" 
                                                    strokeWidth={4} 
                                                    fillOpacity={1} 
                                                    fill="url(#colorLatency)" 
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="glass-card p-10 border border-white/5 flex flex-col shadow-2xl bg-black/40 rounded-[40px]">
                                    <div className="flex items-center justify-between mb-10">
                                        <div>
                                            <h3 className="text-lg font-black text-white tracking-widest uppercase italic">Node Distribution</h3>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">Neural activity by provider</p>
                                        </div>
                                        <Database className="w-6 h-6 text-white/10" />
                                    </div>
                                    <div className="flex-1 min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <BarChart data={providerStats}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                <XAxis dataKey="name" stroke="#ffffff10" fontSize={9} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" />
                                                <YAxis stroke="#ffffff10" fontSize={10} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    cursor={{fill: '#ffffff05'}}
                                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px' }}
                                                />
                                                <Bar dataKey="count" radius={[12, 12, 0, 0]} animationDuration={2000}>
                                                    {providerStats.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--color-accent)' : '#ffffff10'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'infrastructure' ? (
                        <div className="h-full flex flex-col gap-8 overflow-y-auto pr-2 suggestions-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { label: 'Compute Clusters', value: '4 Active', status: 'Healthy', icon: Cpu },
                                    { label: 'Nexus Database', value: '0.4ms Latency', status: 'Optimal', icon: Database },
                                    { label: 'SSL Protocol', value: 'v3.2 Edge', status: 'Secure', icon: Lock },
                                    { label: 'Neural Throughput', value: '1.2 GB/s', status: 'High', icon: Activity },
                                    { label: 'Asset Storage', value: '14.2 TB', status: 'Normal', icon: HardDrive },
                                    { label: 'Worker Threads', value: '1,024', status: 'Active', icon: Layers },
                                ].map((item, idx) => (
                                    <div key={idx} className="glass-card p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center gap-5">
                                        <div className="p-4 bg-white/5 rounded-2xl">
                                            <item.icon className="w-6 h-6 text-[var(--color-accent)]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{item.label}</p>
                                            <p className="text-lg font-black text-white italic uppercase tracking-tighter">{item.value}</p>
                                            <span className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest">{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="glass-card p-10 border border-white/5 bg-black/40 rounded-[40px] flex flex-col gap-6 h-[500px]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Terminal className="w-5 h-5 text-[var(--color-accent)] shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.5)]" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Core Nexus Console [Imp 16]</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest italic">Encrypted Connection</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 bg-black/60 rounded-[32px] border border-white/5 p-8 font-mono text-[11px] overflow-y-auto suggestions-scrollbar flex flex-col gap-2">
                                    <div className="text-white/20 mb-4 tracking-widest">[NEXUS_INIT] SYSTEM KERNEL v4.0.0-NEURAL</div>
                                    <div className="text-[var(--color-accent)] opacity-60">nexus@admin:~$ ping google-genai-ap-core</div>
                                    <div className="text-white/40">64 bytes from 142.250.64.14: icmp_seq=1 ttl=118 time=12.4 ms</div>
                                    <div className="text-white/40">64 bytes from 142.250.64.14: icmp_seq=2 ttl=118 time=14.1 ms</div>
                                    <div className="text-white/20 mt-2 italic">// Detecting synchronization drift...</div>
                                    <div className="text-amber-500/60">[WARN] Synthesis node 702 (Cairo) report latency spikes (402ms)</div>
                                    <div className="text-emerald-500/60">[OK] Assets indexed: 14,202 nodes verified</div>
                                    <div className="text-[var(--color-accent)] opacity-60 mt-4">nexus@admin:~$ load-studio --branding</div>
                                    <div className="text-white/40 italic">Initializing Branding Matrix...</div>
                                    <div className="text-emerald-500/60">[SUCCESS] Vector engines online. Dynamic palette generation enabled.</div>
                                    <div className="text-[var(--color-accent)] opacity-60 mt-4 flex items-center gap-2">
                                        nexus@admin:~$ <span className="w-2 h-4 bg-[var(--color-accent)] animate-pulse" />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        placeholder="Enter neural command..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] font-mono text-white/40 outline-none focus:border-[var(--color-accent)]/30 transition-all uppercase tracking-widest"
                                    />
                                    <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-white/30 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all italic">Execute</button>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'models' ? (
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div className="relative flex-grow max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input 
                                        type="text" 
                                        placeholder="Filter AI models..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full glass-input pl-12 pr-4 py-3 rounded-2xl text-xs uppercase font-black tracking-widest placeholder:text-white/10"
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        setEditingModel(null);
                                        setNewModel({
                                            name: '',
                                            provider: 'google',
                                            modelId: '',
                                            description: '',
                                            icon: 'Brain',
                                            isFree: true,
                                            costPerCall: 0,
                                            studios: [],
                                            status: 'active'
                                        });
                                        setIsAddingModel(true);
                                    }}
                                    className="px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white rounded-2xl flex items-center gap-3 transition-all shadow-lg hover:scale-105 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Register AI Model</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto suggestions-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {models.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).map(model => (
                                        <div key={model.id} className="glass-card p-8 border border-white/5 bg-black/40 rounded-[32px] group relative overflow-hidden transition-all hover:border-[var(--color-accent)]/30">
                                            <div className="absolute top-0 right-0 p-6 flex gap-2">
                                                <button 
                                                    onClick={async () => {
                                                        const p = prompt("Test model " + model.modelId + ":");
                                                        if (!p) return;
                                                        try {
                                                            alert("Processing test...");
                                                            const res = await (await import('../services/geminiService')).callAI(p, { provider: model.provider as any, modelId: model.modelId });
                                                            alert("Response:\n" + String(res).substring(0, 500));
                                                        } catch (e: any) {
                                                            alert("Failed: " + e.message);
                                                        }
                                                    }}
                                                    className="p-2.5 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all border border-[var(--color-accent)]/20"
                                                >
                                                    <Zap className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setEditingModel(model);
                                                        setNewModel(model);
                                                        setIsAddingModel(true);
                                                    }}
                                                    className="p-2.5 rounded-xl bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteModel(model.id)}
                                                    className="p-2.5 rounded-xl bg-white/5 text-white/20 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-5 mb-8">
                                                <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center">
                                                    <Cpu className="w-7 h-7 text-[var(--color-accent)]" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">{model.name}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${model.isFree ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                                            {model.isFree ? 'FREE' : 'PAID'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest font-mono">{model.provider} // {model.modelId}</p>
                                                </div>
                                            </div>

                                            <p className="text-xs text-white/60 font-medium leading-relaxed mb-8 italic">"{model.description}"</p>

                                            <div className="grid grid-cols-2 gap-4 mb-8">
                                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Latency</span>
                                                        <Zap className="w-3 h-3 text-amber-500" />
                                                    </div>
                                                    <div className="text-xs font-black text-white italic tracking-widest">{model.isFree ? '140ms' : '85ms'}</div>
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Cognition</span>
                                                        <Brain className="w-3 h-3 text-emerald-500" />
                                                    </div>
                                                    <div className="text-xs font-black text-white italic tracking-widest">{model.isFree ? '0.82' : '0.98'}</div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active Studio Contexts</span>
                                                    <span className="text-[9px] font-bold text-white/40">{model.studios?.length || 0} Domains</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(model.studios || []).map((s: string) => (
                                                        <span key={s} className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-white/40 uppercase tracking-widest border border-white/5">
                                                            {s.replace('_', ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${model.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${model.status === 'active' ? 'text-emerald-500' : 'text-white/20'}`}>
                                                        {model.status === 'active' ? 'OPERATIONAL' : 'OFFLINE'}
                                                    </span>
                                                </div>
                                                {!model.isFree && (
                                                    <span className="text-[10px] font-black text-[var(--color-accent)] tabular-nums italic">$ {model.costPerCall || 0}/call</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {models.length === 0 && (
                                        <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] text-white/10">
                                            <Cpu className="w-20 h-20 mb-6 opacity-5" />
                                            <span className="text-sm font-black uppercase tracking-[0.4em]">No AI Models registered in Nexus</span>
                                            <p className="mt-4 text-[10px] font-bold text-white/30 tracking-widest uppercase">Inject a model node to expand neural capabilities</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'external' ? (
                        <div className="h-full overflow-y-auto suggestions-scrollbar">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">External Services</h3>
                                <button 
                                    onClick={() => setIsAddingExternal(true)}
                                    className="px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white rounded-2xl flex items-center gap-3 transition-all shadow-lg hover:scale-105 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Add Service</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {externalServices.map(s => (
                                    <div key={s.id} className="glass-card p-6 rounded-[32px] border border-white/5 bg-black/40 flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ExternalLink className="w-4 h-4 shrink-0" style={{ color: s.color }} />
                                                <span className="text-xs font-black text-white tracking-tight uppercase truncate">{s.name}</span>
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                                            </div>
                                            <p className="text-[9px] text-white/30 leading-tight line-clamp-1 mb-2">{s.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(s.capabilities || []).map(c => (
                                                    <span key={c} className="text-[7px] font-black text-white/20 bg-white/5 px-1.5 py-0.5 rounded uppercase">{c}</span>
                                                ))}
                                            </div>
                                            {s.models?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {s.models.slice(0, 4).map(m => (
                                                        <span key={m} className="text-[7px] font-mono text-white/10 bg-white/5 px-1 py-0.5 rounded">{m}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mt-2">
                                                <span className="text-[7px] font-mono text-white/10 truncate block">{s.url}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleDeleteExternalService(s.id)}
                                                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-white/20 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {externalServices.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[40px] text-white/10">
                                        <ExternalLink className="w-16 h-16 mb-4 opacity-10" />
                                        <span className="text-sm font-black uppercase tracking-[0.3em]">No external services registered</span>
                                    </div>
                                )}
                            </div>
                            {/* Add External Service Modal */}
                            <AnimatePresence>
                                {isAddingExternal && (
                                    <motion.div 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
                                        onClick={() => setIsAddingExternal(false)}
                                    >
                                        <motion.div 
                                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                            className="glass-card w-full max-w-lg rounded-[40px] border border-white/10 bg-black/90 p-10 shadow-2xl"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Register External Service</h3>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 block">Service Name</label>
                                                    <input 
                                                        type="text" value={newExternalService.name}
                                                        onChange={e => setNewExternalService(s => ({ ...s, name: e.target.value }))}
                                                        className="w-full glass-input px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest"
                                                        placeholder="e.g. Labnana AI"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 block">URL</label>
                                                    <input 
                                                        type="text" value={newExternalService.url}
                                                        onChange={e => setNewExternalService(s => ({ ...s, url: e.target.value }))}
                                                        className="w-full glass-input px-4 py-3 rounded-2xl text-xs font-black tracking-widest"
                                                        placeholder="https://api.labnana.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 block">Description</label>
                                                    <input 
                                                        type="text" value={newExternalService.description}
                                                        onChange={e => setNewExternalService(s => ({ ...s, description: e.target.value }))}
                                                        className="w-full glass-input px-4 py-3 rounded-2xl text-xs font-black tracking-widest"
                                                        placeholder="AI image generation service"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 block">Capabilities (comma-separated)</label>
                                                    <input 
                                                        type="text" 
                                                        value={newExternalService.capabilities.join(', ')}
                                                        onChange={e => setNewExternalService(s => ({ ...s, capabilities: e.target.value.split(',').map(x => x.trim()).filter(Boolean) }))}
                                                        className="w-full glass-input px-4 py-3 rounded-2xl text-xs font-black tracking-widest"
                                                        placeholder="text, image, video"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 block">Models (comma-separated)</label>
                                                    <input 
                                                        type="text" 
                                                        value={newExternalService.models.join(', ')}
                                                        onChange={e => setNewExternalService(s => ({ ...s, models: e.target.value.split(',').map(x => x.trim()).filter(Boolean) }))}
                                                        className="w-full glass-input px-4 py-3 rounded-2xl text-xs font-black tracking-widest"
                                                        placeholder="flux-pro, sdxl"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Color</label>
                                                    <input 
                                                        type="color" value={newExternalService.color}
                                                        onChange={e => setNewExternalService(s => ({ ...s, color: e.target.value }))}
                                                        className="w-10 h-10 rounded-xl cursor-pointer"
                                                    />
                                                    <label className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-widest cursor-pointer">
                                                        <input 
                                                            type="checkbox" checked={newExternalService.isFree}
                                                            onChange={e => setNewExternalService(s => ({ ...s, isFree: e.target.checked }))}
                                                            className="rounded"
                                                        />
                                                        Free Service
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-4 mt-10">
                                                <button 
                                                    onClick={() => setIsAddingExternal(false)}
                                                    className="px-6 py-3 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleAddExternalService}
                                                    disabled={!newExternalService.name || !newExternalService.url}
                                                    className="px-8 py-3 bg-[var(--color-accent)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                                                >
                                                    Register
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto pr-2 suggestions-scrollbar space-y-8 pb-12">
                            {activeSettingsView === 'governance' ? (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] opacity-30">Governance & Security</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <GovernancePanel 
                                            title="System Shell"
                                            desc="Restrict neural access globally"
                                            icon={Lock}
                                            active={systemConfig.maintenanceMode}
                                            onToggle={() => updateSystemConfig({ maintenanceMode: !systemConfig.maintenanceMode })}
                                            variant="danger"
                                        />
                                        <GovernancePanel 
                                            title="Protocol Onboarding"
                                            desc="Allow new minds to register"
                                            icon={Users}
                                            active={systemConfig.allowNewRegistrations}
                                            onToggle={() => updateSystemConfig({ allowNewRegistrations: !systemConfig.allowNewRegistrations })}
                                            variant="success"
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] opacity-30">Application Ecosystem</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <EcosystemCard 
                                                title="Visual Identity" 
                                                desc="Aesthetics & Colors" 
                                                icon={Palette} 
                                                onClick={() => setActiveSettingsView('appearance')} 
                                            />
                                            <EcosystemCard 
                                                title="Core Config" 
                                                desc="General Protocols" 
                                                icon={Settings} 
                                                onClick={() => setActiveSettingsView('general')} 
                                            />
                                            <EcosystemCard 
                                                title="Neural Vault" 
                                                desc="Asset Management" 
                                                icon={Archive} 
                                                onClick={() => setActiveSettingsView('vault')} 
                                            />
                                            <EcosystemCard 
                                                title="Archives" 
                                                desc="Neural Memories" 
                                                icon={History} 
                                                onClick={() => setActiveSettingsView('history')} 
                                            />
                                        </div>
                                    </div>

                                    <div className="glass-card p-10 border border-white/5 bg-black/40 rounded-[40px]">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <Zap className="w-5 h-5 text-[var(--color-accent)]" />
                                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural OS Lifecycle</h3>
                                            </div>
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Core Version: {systemConfig.version}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest">v</div>
                                                <input 
                                                    type="text" 
                                                    value={systemConfig.version}
                                                    onChange={(e) => setSystemConfig(s => ({ ...s, version: e.target.value }))}
                                                    className="w-full glass-input pl-8 pr-4 py-3 rounded-2xl text-[11px] font-black tracking-widest"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => updateSystemConfig({ version: systemConfig.version })}
                                                className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all"
                                            >
                                                Update Nexus
                                            </button>
                                        </div>
                                    </div>

                                    <div className="glass-card p-10 border border-white/5 bg-black/40 rounded-[40px]">
                                        <div className="flex items-center gap-3 mb-8">
                                            <Layers className="w-5 h-5 text-[var(--color-accent)]" />
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Studio Modalities</h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                            {[
                                                { id: 'creator_studio', label: 'Creator' },
                                                { id: 'photoshoot_director', label: 'Photoshoot' },
                                                { id: 'video_studio', label: 'Video' },
                                                { id: 'voice_over_studio', label: 'Voice' },
                                                { id: 'branding_studio', label: 'Branding' },
                                                { id: 'campaign_studio', label: 'Campaign' },
                                                { id: 'plan_studio', label: 'Plan' },
                                                { id: 'storyboard_studio', label: 'Storyboard' },
                                                { id: 'marketing_studio', label: 'Marketing' },
                                                { id: 'edit_studio', label: 'Edit' },
                                                { id: 'prompt_studio', label: 'Prompt' },
                                                { id: 'controller_studio', label: 'Face' }
                                            ].map(studio => {
                                                const isActive = (systemConfig.activeStudios || []).includes(studio.id);
                                                return (
                                                    <button
                                                        key={studio.id}
                                                        onClick={() => {
                                                            const active = systemConfig.activeStudios || [];
                                                            const next = active.includes(studio.id) 
                                                                ? active.filter(a => a !== studio.id)
                                                                : [...active, studio.id];
                                                            updateSystemConfig({ activeStudios: next });
                                                        }}
                                                        className={`p-5 rounded-[28px] border transition-all flex flex-col items-center gap-3 group relative ${isActive ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40' : 'bg-white/[0.02] border-white/5'}`}
                                                    >
                                                        <div className={`p-4 rounded-2xl transition-all ${isActive ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'bg-white/5 text-white/10 group-hover:text-white/30'}`}>
                                                            <Settings className="w-5 h-5" />
                                                        </div>
                                                        <div className="text-center">
                                                            <span className={`block text-[10px] font-black uppercase tracking-widest truncate ${isActive ? 'text-white' : 'text-white/20'}`}>{studio.label}</span>
                                                            <span className="text-[8px] font-black opacity-20 uppercase">{isActive ? 'ONLINE' : 'STBY'}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : activeSettingsView === 'vault' ? (
                                <div className="space-y-6">
                                    <ViewHeader label="Neural Vault" onBack={() => setActiveSettingsView('governance')} />
                                    <AssetLibraryPanel />
                                </div>
                            ) : activeSettingsView === 'history' ? (
                                <div className="space-y-6">
                                    <ViewHeader label="Temporal Archives" onBack={() => setActiveSettingsView('governance')} />
                                    <GlobalHistoryPanel />
                                </div>
                            ) : activeSettingsView === 'appearance' ? (
                                <div className="space-y-6">
                                    <ViewHeader label="Visual Identity" onBack={() => setActiveSettingsView('governance')} />
                                    <div className="glass-card p-10 border border-white/5 bg-black/40 rounded-[40px] space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                    <Palette className="w-4 h-4 text-[var(--color-accent)]" />
                                                    Neural Palette Spectrum
                                                </h4>
                                                <div className="grid grid-cols-5 gap-4">
                                                    {[
                                                        { id: 'crimson', color: '#ff3e3e', label: 'Crimson' },
                                                        { id: 'sky', color: '#3b82f6', label: 'Sky' },
                                                        { id: 'emerald', color: '#10b981', label: 'Emerald' },
                                                        { id: 'amber', color: '#f59e0b', label: 'Amber' },
                                                        { id: 'violet', color: '#8b5cf6', label: 'Violet' }
                                                    ].map(theme => (
                                                        <div 
                                                            key={theme.id} 
                                                            onClick={() => {
                                                                document.documentElement.style.setProperty('--color-accent', theme.color);
                                                                // Convert hex to rgb for rgba usage
                                                                const r = parseInt(theme.color.slice(1, 3), 16);
                                                                const g = parseInt(theme.color.slice(3, 5), 16);
                                                                const b = parseInt(theme.color.slice(5, 7), 16);
                                                                document.documentElement.style.setProperty('--color-accent-rgb', `${r}, ${g}, ${b}`);
                                                            }}
                                                            className="flex flex-col items-center gap-2 group cursor-pointer"
                                                        >
                                                            <div className="w-14 h-14 rounded-2xl border border-white/10 p-1 bg-white/5 group-hover:border-white/30 transition-all">
                                                                <div className="w-full h-full rounded-xl transition-transform group-hover:scale-110 shadow-2xl" style={{ backgroundColor: theme.color }} />
                                                            </div>
                                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{theme.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                    <Layout className="w-4 h-4 text-[var(--color-accent)]" />
                                                    Neural Density Configuration
                                                </h4>
                                                <div className="space-y-4">
                                                    {[
                                                        { id: 'fluid', label: 'Fluid / Relaxed', desc: 'Standard spatial buffer for neural clarity' },
                                                        { id: 'packed', label: 'Packed / Technical', desc: 'Minimized latency with high information density' },
                                                        { id: 'matrix', label: 'Matrix / Cinematic', desc: 'Oversized controls for terminal interaction' }
                                                    ].map(mode => (
                                                        <button 
                                                            key={mode.id} 
                                                            className="w-full group p-5 rounded-[2rem] bg-white/[0.02] border border-white/10 text-left hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/5 transition-all flex items-center justify-between"
                                                        >
                                                            <div>
                                                                <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1 group-hover:text-[var(--color-accent)]">{mode.label}</div>
                                                                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">{mode.desc}</div>
                                                            </div>
                                                            <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center">
                                                                <div className="w-2 h-2 rounded-full bg-white/5" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-12 border-t border-white/5">
                                            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                <Terminal className="w-4 h-4 text-[var(--color-accent)]" />
                                                CSS Injection Protocol (Imp 12)
                                            </h4>
                                            <div className="relative">
                                                <div className="absolute top-4 left-4 p-2 bg-white/5 rounded-lg border border-white/10 z-10">
                                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Active Runtime Override</span>
                                                </div>
                                                <textarea 
                                                    className="w-full h-40 glass-input p-16 pt-20 rounded-[2.5rem] font-mono text-[10px] text-[var(--color-accent)] tracking-widest leading-relaxed focus:ring-2 ring-[var(--color-accent)]/20 transition-all shadow-inner"
                                                    placeholder="/* Inject custom neural styling nodes here */"
                                                    defaultValue={`:root {\n  --nexus-blur: 40px;\n  --card-radius: 48px;\n  --neural-glow: 0 0 20px rgba(var(--color-accent-rgb), 0.2);\n}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <ViewHeader label="General Protocols" onBack={() => setActiveSettingsView('governance')} />
                                    <div className="glass-card p-10 border border-white/5 bg-black/40 rounded-[40px] space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <GovernancePanel 
                                                title="Neural Auto-Archive (Imp 10)" 
                                                desc="Automatically move inactive projects to archives after 30 cycles" 
                                                icon={Archive} 
                                                active={true} 
                                                onToggle={() => {}} 
                                            />
                                            <GovernancePanel 
                                                title="Diagnostic Telemetry" 
                                                desc="Transmit anonymized neural diagnostic data to central nexus" 
                                                icon={Activity} 
                                                active={false} 
                                                onToggle={() => {}} 
                                                variant="success"
                                            />
                                            <GovernancePanel 
                                                title="Smart Suggestions (Imp 17)" 
                                                desc="Enable AI-driven optimization prompts across studios" 
                                                icon={Zap} 
                                                active={true} 
                                                onToggle={() => {}} 
                                            />
                                            <GovernancePanel 
                                                title="Global Search Index" 
                                                desc="Real-time indexing of all nexus assets and projects" 
                                                icon={Search} 
                                                active={true} 
                                                onToggle={() => {}} 
                                            />
                                        </div>

                                        <div className="pt-12 border-t border-white/5">
                                            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-[var(--color-accent)]" />
                                                Regional Node Localization
                                            </h4>
                                            <div className="flex flex-wrap gap-4">
                                                {['English (US)', 'Arabic (MENA)', 'Neural (Binary)', 'Cybernetic (Hex)'].map(lang => (
                                                    <button key={lang} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-white/30 transition-all">
                                                        {lang}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Detail Modal for History Items */}
            <AnimatePresence>
                {selectedHistoryItem && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-6" onClick={() => setSelectedHistoryItem(null)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-white/10 rounded-[48px] bg-black/60 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative">
                                {selectedHistoryItem.type === 'image' ? (
                                    <img src={selectedHistoryItem.content} className="w-full h-full object-contain" alt="Neural Memory" />
                                ) : (
                                    <div className="p-20 text-center">
                                        <Activity className="w-20 h-20 text-[var(--color-accent)] mx-auto mb-6 opacity-20 animate-pulse" />
                                        {selectedHistoryItem.type === 'audio' && <audio src={selectedHistoryItem.content} controls className="w-full" />}
                                    </div>
                                )}
                                <button 
                                    onClick={() => setSelectedHistoryItem(null)}
                                    className="absolute top-6 left-6 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all"
                                >
                                    <RefreshCcw className="w-5 h-5 rotate-45" />
                                </button>
                            </div>
                            <div className="w-full md:w-1/2 p-12 flex flex-col gap-8 overflow-y-auto suggestions-scrollbar">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 shadow-inner">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{selectedHistoryItem.studio}</span>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full border ${selectedHistoryItem.type === 'image' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{selectedHistoryItem.type}</span>
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-tight">Neural Prompt Memory</h2>
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mt-2 italic line-clamp-1">{selectedHistoryItem.id}</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <Terminal className="w-3 h-3" />
                                        Command Input
                                    </label>
                                    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                                        <p className="text-sm font-medium text-white/80 italic leading-relaxed">
                                            "{selectedHistoryItem.prompt || 'Autonomous generation - No direct prompt'}"
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Origin Mind</label>
                                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-xs font-black text-white">
                                                {selectedHistoryItem.userEmail?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[11px] font-bold text-white/60 truncate">{selectedHistoryItem.userEmail}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Temporal Sync</label>
                                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <Activity className="w-4 h-4 text-white/20" />
                                            <span className="text-[11px] font-bold text-white/60">
                                                {selectedHistoryItem.timestamp instanceof Object ? new Date(selectedHistoryItem.timestamp.seconds * 1000).toLocaleString() : 'Syncing...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedHistoryItem.metadata && (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Neural Metadata</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(selectedHistoryItem.metadata).map(([key, val]: any) => (
                                                <div key={key} className="p-3 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col gap-1">
                                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{key}</span>
                                                    <span className="text-[10px] font-bold text-white/60 uppercase">{String(val)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 mt-auto pt-8 border-t border-white/5">
                                    <a 
                                        href={selectedHistoryItem.content} 
                                        download={`memory_${selectedHistoryItem.id}.png`}
                                        className="flex-grow py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all text-center"
                                    >
                                        Extract Artifact
                                    </a>
                                    <button 
                                        onClick={() => {
                                            handleDeleteHistory(selectedHistoryItem.id);
                                            setSelectedHistoryItem(null);
                                        }}
                                        className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10"
                                    >
                                        Purge
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal for adding integration node */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-6" onClick={() => setIsAdding(false)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card w-full max-w-lg p-10 relative border border-white/10 rounded-[48px] bg-black/60 shadow-[0_0_100px_rgba(0,0,0,1)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-4 bg-[var(--color-accent)]/10 rounded-2xl border border-[var(--color-accent)]/20">
                                    <Plus className="w-6 h-6 text-[var(--color-accent)]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Initialize Pipeline</h2>
                                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">Register new neural processing node</p>
                                </div>
                            </div>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Node Identifier</label>
                                    <input 
                                        type="text" 
                                        value={newIntegration.name} 
                                        onChange={e => setNewIntegration({...newIntegration, name: e.target.value})}
                                        className="w-full glass-input p-4 rounded-3xl text-sm font-bold uppercase tracking-widest" 
                                        placeholder="e.g. Gemini Ultra Pro" 
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Architecture</label>
                                    <select 
                                        value={newIntegration.provider} 
                                        onChange={e => setNewIntegration({...newIntegration, provider: e.target.value as any})}
                                        className="w-full glass-input p-4 rounded-3xl text-sm font-bold uppercase tracking-widest appearance-none bg-black/40 cursor-pointer"
                                    >
                                        <option value="gemini">Google Gemini Core</option>
                                        <option value="openai">OpenAI Synapse</option>
                                        <option value="anthropic">Claude Neural</option>
                                        <option value="custom">Generic REST Hub</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">API Keys (one per line — rotates between them)</label>
                                    {newIntegration.apiKeys.map((key, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <div className="relative flex-1">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input 
                                                    type="password" 
                                                    value={key}
                                                    onChange={e => {
                                                        const keys = [...newIntegration.apiKeys];
                                                        keys[i] = e.target.value;
                                                        setNewIntegration({...newIntegration, apiKeys: keys});
                                                    }}
                                                    className="w-full glass-input p-4 pl-12 rounded-3xl text-sm font-mono tracking-widest" 
                                                    placeholder={`API Key ${i + 1}`} 
                                                />
                                            </div>
                                            {newIntegration.apiKeys.length > 1 && (
                                                <button onClick={() => {
                                                    const keys = newIntegration.apiKeys.filter((_, j) => j !== i);
                                                    setNewIntegration({...newIntegration, apiKeys: keys});
                                                }} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setNewIntegration({...newIntegration, apiKeys: [...newIntegration.apiKeys, '']})}
                                        className="text-[9px] font-black text-[var(--color-accent)] uppercase tracking-widest hover:opacity-80 transition-opacity"
                                    >
                                        + Add Another Key
                                    </button>
                                </div>

                                {newIntegration.provider === 'custom' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">API Endpoint URL</label>
                                            <input 
                                                type="text" 
                                                value={newIntegration.endpoint} 
                                                onChange={e => setNewIntegration({...newIntegration, endpoint: e.target.value})}
                                                className="w-full glass-input p-4 rounded-3xl text-sm font-mono tracking-widest" 
                                                placeholder="https://api.example.com/v1/generate" 
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Auth Type</label>
                                                <select 
                                                    value={newIntegration.authType} 
                                                    onChange={e => setNewIntegration({...newIntegration, authType: e.target.value as any})}
                                                    className="w-full glass-input p-4 rounded-3xl text-xs font-bold appearance-none bg-black/40 cursor-pointer"
                                                >
                                                    <option value="header">Header (API Key)</option>
                                                    <option value="bearer">Bearer Token</option>
                                                    <option value="api-key">URL Query Key</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Auth Header Name</label>
                                                <input 
                                                    type="text" 
                                                    value={newIntegration.authHeaderName} 
                                                    onChange={e => setNewIntegration({...newIntegration, authHeaderName: e.target.value})}
                                                    className="w-full glass-input p-4 rounded-3xl text-xs font-mono" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Request Body Template</label>
                                            <textarea 
                                                value={newIntegration.requestTemplate} 
                                                onChange={e => setNewIntegration({...newIntegration, requestTemplate: e.target.value})}
                                                className="w-full glass-input p-4 rounded-3xl text-xs font-mono h-24 resize-none" 
                                                placeholder='{"contents":[{"role":"user","parts":[{"text":"{{prompt}}"}]}]}'
                                            />
                                            <p className="text-[7px] text-white/20 px-2">Use <span className="font-mono text-[var(--color-accent)]">{'{{prompt}}'}</span> as placeholder for the prompt text</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Response Path</label>
                                            <input 
                                                type="text" 
                                                value={newIntegration.responsePath} 
                                                onChange={e => setNewIntegration({...newIntegration, responsePath: e.target.value})}
                                                className="w-full glass-input p-4 rounded-3xl text-xs font-mono tracking-widest" 
                                                placeholder="candidates[0].content.parts[0].text" 
                                            />
                                            <p className="text-[7px] text-white/20 px-2">JSON path to extract text from response</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-4 mt-12">
                                <button 
                                    onClick={() => setIsAdding(false)} 
                                    className="px-8 py-4 text-xs font-black text-white/30 uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Abort
                                </button>
                                <button 
                                    onClick={handleAddIntegration}
                                    disabled={!newIntegration.name || !newIntegration.provider}
                                    className="flex-grow bg-white text-black font-black py-4 rounded-3xl shadow-xl transition-all disabled:opacity-20 text-xs uppercase tracking-widest hover:scale-105 active:scale-95"
                                >
                                    Initialize
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Model Management Modal */}
            <AnimatePresence>
                {isAddingModel && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-6" onClick={() => setIsAddingModel(false)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card w-full max-w-2xl border border-white/10 rounded-[48px] bg-black/60 shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 bg-[var(--color-accent)] rounded-2xl flex items-center justify-center shadow-lg">
                                        <Cpu className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-widest">{editingModel ? 'Update Node' : 'Register AI Model'}</h2>
                                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">Configure neural bridge parameters</p>
                                    </div>
                                </div>

                                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 suggestions-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Node Name</label>
                                            <input 
                                                type="text" 
                                                value={newModel.name}
                                                onChange={e => setNewModel({...newModel, name: e.target.value})}
                                                placeholder="e.g. Gemini Ultra"
                                                className="w-full glass-input px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Architect</label>
                                            <select 
                                                value={newModel.provider}
                                                onChange={e => setNewModel({...newModel, provider: e.target.value})}
                                                className="w-full glass-input px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest appearance-none"
                                            >
                                                <option value="google">Google AI</option>
                                                <option value="openai">OpenAI</option>
                                                <option value="anthropic">Anthropic</option>
                                                <option value="custom">Custom Pipeline</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Model Identifier</label>
                                            <input 
                                                type="text" 
                                                value={newModel.modelId}
                                                onChange={e => setNewModel({...newModel, modelId: e.target.value})}
                                                placeholder="e.g. gemini-1.5-pro"
                                                className="w-full glass-input px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Operational Status</label>
                                            <select 
                                                value={newModel.status}
                                                onChange={e => setNewModel({...newModel, status: e.target.value})}
                                                className="w-full glass-input px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest appearance-none"
                                            >
                                                <option value="active">Active</option>
                                                <option value="deprecated">Deprecated</option>
                                                <option value="maintenance">Maintenance</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Node Description</label>
                                        <textarea 
                                            value={newModel.description}
                                            onChange={e => setNewModel({...newModel, description: e.target.value})}
                                            placeholder="Neural function details..."
                                            rows={2}
                                            className="w-full glass-input px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Access Type</label>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setNewModel({...newModel, isFree: true})}
                                                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newModel.isFree ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-white/5 border-white/5 text-white/20'}`}
                                                >
                                                    Free Node
                                                </button>
                                                <button 
                                                    onClick={() => setNewModel({...newModel, isFree: false})}
                                                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${!newModel.isFree ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-white/5 border-white/5 text-white/20'}`}
                                                >
                                                    Paid Node
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Unit Cost ($)</label>
                                            <input 
                                                type="number" 
                                                value={newModel.costPerCall}
                                                onChange={e => setNewModel({...newModel, costPerCall: Number(e.target.value)})}
                                                disabled={newModel.isFree}
                                                step="0.01"
                                                className={`w-full glass-input px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest ${newModel.isFree ? 'opacity-20 pointer-events-none' : ''}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Authorized Domains (Studios)</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'creator_studio', label: 'Creator' },
                                                { id: 'photoshoot_director', label: 'Photoshoot' },
                                                { id: 'video_studio', label: 'Video' },
                                                { id: 'voice_over_studio', label: 'Voice' },
                                                { id: 'branding_studio', label: 'Branding' },
                                                { id: 'campaign_studio', label: 'Campaign' },
                                                { id: 'plan_studio', label: 'Plan' },
                                                { id: 'storyboard_studio', label: 'Storyboard' },
                                                { id: 'marketing_studio', label: 'Marketing' },
                                                { id: 'edit_studio', label: 'Edit' },
                                                { id: 'prompt_studio', label: 'Prompt' },
                                                { id: 'controller_studio', label: 'Face' }
                                            ].map(studio => {
                                                const isSelected = (newModel.studios || []).includes(studio.id);
                                                return (
                                                    <button
                                                        key={studio.id}
                                                        onClick={() => {
                                                            const current = newModel.studios || [];
                                                            const next = current.includes(studio.id)
                                                                ? current.filter((s: string) => s !== studio.id)
                                                                : [...current, studio.id];
                                                            setNewModel({...newModel, studios: next});
                                                        }}
                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20' : 'bg-white/5 border-white/5 text-white/40'}`}
                                                    >
                                                        {studio.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <button 
                                        onClick={() => setIsAddingModel(false)}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                                    >
                                        Cancel Command
                                    </button>
                                    <button 
                                        onClick={handleAddModel}
                                        className="flex-1 py-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[var(--color-accent)]/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {editingModel ? 'Update Node' : 'Initialize Link'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TabItem = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all duration-300 relative group ${active ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
    >
        <Icon className={`w-4 h-4 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        {active && (
            <motion.div 
                layoutId="admin_tab_bg"
                className="absolute inset-0 bg-white/10 rounded-xl z-[-1] border border-white/10 shadow-inner"
            />
        )}
    </button>
);

const StatMetric = ({ label, value, icon: Icon, trend }: any) => (
    <div className="glass-card p-6 border border-white/5 relative overflow-hidden group hover:border-[var(--color-accent)]/30 transition-all bg-black/40 rounded-[32px]">
        <div className="flex justify-between items-start mb-2">
            <div className="p-3 bg-white/5 rounded-2xl text-white/30 group-hover:text-[var(--color-accent)] transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${trend.includes('+') || trend === 'Active' || trend === 'Stable' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/30'}`}>
                {trend}
            </span>
        </div>
        <div>
            <span className="text-[32px] font-black text-white tabular-nums tracking-tighter">{value}</span>
            <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">{label}</p>
        </div>
    </div>
);

const IntegrationCard = ({ int, onToggle, onDelete }: any) => (
    <div className="glass-card p-8 relative group border border-white/5 hover:border-[var(--color-accent)]/30 transition-all shadow-2xl bg-black/40 rounded-[40px] overflow-hidden">
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${int.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_#10b98110]' : 'bg-red-500/10 text-red-500 opacity-50'}`}>
                <Cpu className="w-7 h-7" />
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={onDelete} 
                    className="p-3 rounded-2xl bg-white/5 text-white/10 hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button 
                    onClick={onToggle} 
                    className={`p-3 rounded-2xl ${int.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'} shadow-lg transition-all hover:scale-105 active:scale-95`}
                >
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
        
        <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight italic">{int.name}</h3>
        <div className="flex items-center gap-2 mb-6">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 bg-white/5 px-3 py-1 rounded-full">{int.provider}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${int.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
        </div>

        <div className="space-y-3 pt-6 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-widest">
                <span className="opacity-40">Status Code</span>
                <span className={int.status === 'active' ? 'text-emerald-500' : 'text-red-500'}>{int.status === 'active' ? '0xREADY' : '0xSTALL'}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-widest">
                <span className="opacity-40">Frequency</span>
                <span className="text-white/60">60Hz</span>
            </div>
        </div>
    </div>
);

const GovernancePanel = ({ title, desc, icon: Icon, active, onToggle, variant }: any) => (
    <div className={`p-10 rounded-[48px] border transition-all duration-700 relative overflow-hidden group ${active 
        ? (variant === 'danger' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30') 
        : 'bg-white/[0.02] border-white/5'}`}>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className={`p-6 rounded-[32px] ${active 
                ? (variant === 'danger' ? 'bg-red-500 text-white shadow-2xl' : 'bg-emerald-500 text-white shadow-2xl') 
                : 'bg-white/5 text-white/20'}`}>
                <Icon className="w-8 h-8" />
            </div>
            <div className="flex-grow text-center md:text-left">
                <h4 className="text-xl font-black text-white tracking-tighter uppercase italic mb-1">{title}</h4>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{desc}</p>
            </div>
            <div className="shrink-0">
                <button 
                    onClick={onToggle}
                    className={`w-20 h-10 rounded-full transition-all relative ${active 
                        ? (variant === 'danger' ? 'bg-red-500' : 'bg-emerald-500') 
                        : 'bg-white/10'}`}
                >
                    <motion.div 
                        initial={false}
                        animate={{ x: active ? 44 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1.5 w-7 h-7 rounded-full bg-white shadow-2xl"
                    />
                </button>
            </div>
        </div>
        
        {/* Background Decorative Aura */}
        <div className={`absolute -bottom-20 -right-20 w-40 h-40 blur-[80px] opacity-20 pointer-events-none rounded-full ${active 
            ? (variant === 'danger' ? 'bg-red-500' : 'bg-emerald-500') 
            : 'bg-transparent'}`} />
    </div>
);

export default AdminStudio;
