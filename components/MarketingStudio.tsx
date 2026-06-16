
import React, { useState, useRef, useCallback } from 'react';
import { useGlobalShortcuts } from '../lib/useGlobalShortcuts';
import { useToast } from '../lib/useToast';
import { MarketingStudioProject } from '../types';
import { 
    generateMarketingAnalysis, 
    generateAdCopies, 
    generateEmailSequence, 
    generateInfluencerAndCalendar, 
    generateMarketingAssets,
    generateSWOTAnalysis,
    generateCompetitiveStudy,
    generateMarketResearch,
    generateDigitalStrategy,
    generateTraditionalStrategy
} from '../services/geminiService';
import { logHistory } from '../lib/admin';
import { Share2, Download, Copy, Check, Target, TrendingUp, Megaphone, FileText, Sparkles } from 'lucide-react';
import AISelector from './AISelector';
import { LOGO_IMAGE_URL } from '../constants';
import { AILoadingOverlay } from '../lib/AILoadingOverlay';
import { ShareableLink } from './ShareableLink';
import { CommentsOverlay } from './CommentsOverlay';
import { VersionTimeline } from './VersionTimeline';
import { TemplatePicker } from './TemplatePicker';
import { Plus } from 'lucide-react';
import { ContentTools } from './ContentTools';
import { AgentsPanel } from './AgentsPanel';

const MarketingIcon = () => <Share2 className="w-5 h-5 inline mr-2 text-[var(--color-accent)]" />;
const CopyIcon = () => <Copy className="h-4 w-4 mr-1.5" />;
const DownloadIcon = () => <Download className="h-4 w-4 mr-1.5" />;
const CheckIcon = () => <Check className="h-4 w-4 mr-1.5" />;

const PLATFORMS = ['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'Twitter/X', 'YouTube', 'Google Ads'];
const TONES = ['Professional', 'Humorous', 'Bold', 'Minimalist', 'Inspirational', 'Casual', 'Luxurious'];
const GOALS = ['Brand Awareness', 'Lead Generation', 'Sales / Conversions', 'Community Engagement', 'App Installs'];
const CAMPAIGN_TYPES = ['New Product Launch', 'Seasonal/Holiday Sale', 'Brand Awareness Push', 'User Retention', 'Lead Magnet', 'Event Promotion', 'Rebranding'];
const STRATEGY_ARCHETYPES = ['Aggressive Growth', 'Market Disruptor', 'Educational Authority', 'Stealth/Exclusivity', 'Community-Led', 'Viral/Meme-Based', 'Solution-First'];
const TRADITIONAL_CHANNELS = ['Billboards', 'Newspaper/Magazines', 'Direct Mail', 'Radio Spots', 'TV Commercials', 'Event Sponsorship', 'Trade Shows'];
const SEO_FOCUS_AREAS = ['Local SEO', 'E-commerce SEO', 'Content/Blog Authority', 'Technical Infrastructure', 'International expansion'];

const MarketingStudio: React.FC<{
    project: MarketingStudioProject;
    setProject: React.Dispatch<React.SetStateAction<MarketingStudioProject>>;
}> = ({ project, setProject }) => {

    const [copied, setCopied] = useState(false);
    const [adCopiesCopied, setAdCopiesCopied] = useState<number | null>(null);
    const [isRefining, setIsRefining] = useState(false);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [generatingSteps, setGeneratingSteps] = useState<{label:string;done:boolean}[]>([]);
    const [comments, setComments] = useState<{id: string; author: string; content: string; timestamp: number}[]>([]);
    const [versions, setVersions] = useState<{id: string; timestamp: number; label: string; snapshot: any}[]>([]);
    const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
    const [redoStack, setRedoStack] = useState<{id: string; timestamp: number; label: string; snapshot: any}[]>([]);
    const { toast } = useToast();

    const pushVersion = useCallback((label?: string) => {
      const entry = { id: Date.now().toString(), timestamp: Date.now(), label: label || `v${versions.length + 1}`, snapshot: JSON.parse(JSON.stringify(project)) };
      setVersions(prev => [...prev.slice(-49), entry]);
      setCurrentVersionId(entry.id);
      setRedoStack([]);
    }, [versions.length, project]);

    const handleUndo = useCallback(() => {
      if (versions.length < 2) return;
      const current = versions[versions.length - 1];
      const previous = versions[versions.length - 2];
      setRedoStack(prev => [...prev, current]);
      setProject(previous.snapshot);
      setCurrentVersionId(previous.id);
      setVersions(prev => prev.slice(0, -1));
    }, [versions, setProject]);

    const handleRedo = useCallback(() => {
      if (redoStack.length === 0) return;
      const next = redoStack[redoStack.length - 1];
      setRedoStack(prev => prev.slice(0, -1));
      setProject(next.snapshot);
      setCurrentVersionId(next.id);
      setVersions(prev => [...prev, next]);
    }, [redoStack, setProject]);

    useGlobalShortcuts([
      { key: 'z', meta: true, handler: handleUndo },
      { key: 'z', meta: true, shift: true, handler: handleRedo },
      { key: 's', meta: true, handler: () => pushVersion('Manual save') },
    ]);

    const handleAddComment = (content: string) => {
        setComments(prev => [...prev, { id: Date.now().toString(), author: 'local-user', content, timestamp: Date.now() }]);
    };
    const handleDeleteComment = (id: string) => setComments(prev => prev.filter(c => c.id !== id));
    const cancelledRef = useRef(false);

    const activeTab = project.activeTab || 'strategy';

    const setTab = (tab: 'strategy' | 'digital' | 'traditional' | 'research' | 'competitive' | 'swot' | 'plan' | 'content' | 'agents') => {
        setProject(s => ({ ...s, activeTab: tab }));
    };

    const togglePlatform = (p: string) => {
        setProject(s => ({
            ...s,
            platforms: s.platforms.includes(p) ? s.platforms.filter(x => x !== p) : [...s.platforms, p]
        }));
    };

    const handleCopyAd = (copy: string, idx: number) => {
        navigator.clipboard.writeText(copy).catch(() => {});
        setAdCopiesCopied(idx);
        setTimeout(() => setAdCopiesCopied(null), 2000);
    };

    const onGenerate = async () => {
        cancelledRef.current = false;
        if (project.brandType === 'new' && (!project.brandName || !project.specialty)) {
            setProject(s => ({ ...s, error: 'Please enter brand name and specialty' }));
            return;
        }
        if (project.brandType === 'existing' && !project.websiteLink) {
            setProject(s => ({ ...s, error: 'Please enter a website link' }));
            return;
        }

        setProject(s => ({ ...s, isGenerating: true, error: null, result: null, adCopies: null, emailSequence: null, influencerStrategy: null, contentCalendar: null, socialBios: null, hashtags: null, customerJourney: null }));
        try {
            const data = project.brandType === 'new' 
                ? { 
                    type: project.brandType, 
                    name: project.brandName, 
                    specialty: project.specialty, 
                    brief: project.brief,
                    platforms: project.platforms,
                    tone: project.campaignTone,
                    goal: project.campaignGoal,
                    competitors: project.competitors,
                    budget: project.monthlyBudget,
                    archetype: project.competitorStrategy,
                    painPoints: project.customerPainPoints,
                    campaignType: project.campaignType,
                    // Advanced Growth context
                    traditionalChannels: project.traditionalChannels,
                    seoFocus: project.seoFocus,
                    conversionGoal: project.conversionGoal,
                    // Detailed inputs
                    marketTrends: project.marketTrends,
                    targetAudience: project.targetAudience,
                    targetDemographics: project.targetDemographics,
                    perceivedStrengths: project.perceivedStrengths,
                    perceivedWeaknesses: project.perceivedWeaknesses,
                    perceivedOpportunities: project.perceivedOpportunities,
                    perceivedThreats: project.perceivedThreats,
                    positioningStatement: project.positioningStatement,
                    uniqueSellingPoint: project.uniqueSellingPoint,
                    campaignDuration: project.campaignDuration,
                    successMetrics: project.successMetrics,
                    resourceRequirements: project.resourceRequirements
                  }
                : { 
                    type: project.brandType, 
                    link: project.websiteLink,
                    platforms: project.platforms,
                    tone: project.campaignTone,
                    goal: project.campaignGoal,
                    budget: project.monthlyBudget,
                    archetype: project.competitorStrategy,
                    painPoints: project.customerPainPoints,
                    campaignType: project.campaignType,
                    // Advanced Growth context
                    traditionalChannels: project.traditionalChannels,
                    seoFocus: project.seoFocus,
                    conversionGoal: project.conversionGoal,
                    // Detailed inputs
                    marketTrends: project.marketTrends,
                    targetAudience: project.targetAudience,
                    targetDemographics: project.targetDemographics,
                    perceivedStrengths: project.perceivedStrengths,
                    perceivedWeaknesses: project.perceivedWeaknesses,
                    perceivedOpportunities: project.perceivedOpportunities,
                    perceivedThreats: project.perceivedThreats,
                    positioningStatement: project.positioningStatement,
                    uniqueSellingPoint: project.uniqueSellingPoint,
                    campaignDuration: project.campaignDuration,
                    successMetrics: project.successMetrics,
                    resourceRequirements: project.resourceRequirements
                  };
            
            if (activeTab === 'research') {
                const res = await generateMarketResearch({ 
                    specialty: project.specialty, 
                    brief: project.brief,
                    marketTrends: project.marketTrends,
                    targetAudience: project.targetAudience,
                    targetDemographics: project.targetDemographics
                }, project.aiConfig);
                setProject(s => ({ ...s, marketResearch: res }));
                setProject(s => ({ ...s, isGenerating: false }));
                return;
            }
            if (activeTab === 'digital') {
                const res = await generateDigitalStrategy(data as any, project.aiConfig);
                setProject(s => ({ ...s, digitalStrategy: res }));
                setProject(s => ({ ...s, isGenerating: false }));
                return;
            }
            if (activeTab === 'traditional') {
                const res = await generateTraditionalStrategy(data as any, project.aiConfig);
                setProject(s => ({ ...s, traditionalStrategy: res }));
                setProject(s => ({ ...s, isGenerating: false }));
                return;
            }
            if (activeTab === 'competitive') {
                const res = await generateCompetitiveStudy(data as any, project.aiConfig);
                setProject(s => ({ ...s, competitiveStudy: res }));
                setProject(s => ({ ...s, isGenerating: false }));
                return;
            }
            if (activeTab === 'swot') {
                const res = await generateSWOTAnalysis(data as any, project.aiConfig);
                setProject(s => ({ ...s, swotAnalysis: res }));
                setProject(s => ({ ...s, isGenerating: false }));
                return;
            }
            if (activeTab === 'plan') {
                // For plan, we can use the same core generation or a specialized one if we want
                const res = await generateMarketingAnalysis(data as any, project.language, project.aiConfig);
                setProject(s => ({ ...s, marketingPlan: res }));
                setProject(s => ({ ...s, isGenerating: false }));
                return;
            }

            setGeneratingSteps([
                { label: 'Strategy', done: false },
                { label: 'Ad Copies', done: false },
                { label: 'Email Sequence', done: false },
                { label: 'Influencer & Calendar', done: false },
                { label: 'Marketing Assets', done: false },
            ]);

            const trackCall = async <T,>(fn: () => Promise<T>, label: string): Promise<[T | null, string | null]> => {
                try {
                    const r = await fn();
                    setGeneratingSteps(prev => prev.map(s => s.label === label ? { ...s, done: true } : s));
                    return [r, null];
                } catch (err: any) {
                    return [null, `${label}: ${err.message || 'failed'}`];
                }
            };
            const [[strategy, sErr], [ads, aErr], [emails, eErr], [ic, iErr], [assets, asErr]] = await Promise.all([
                trackCall(() => generateMarketingAnalysis(data as any, project.language, project.aiConfig), 'Strategy'),
                trackCall(() => generateAdCopies({
                    name: project.brandName || project.websiteLink || 'Brand',
                    platforms: project.platforms,
                    tone: project.campaignTone,
                    goal: project.campaignGoal,
                    brief: project.brief || 'General campaign',
                    language: project.language
                }, project.aiConfig), 'Ad Copies'),
                trackCall(() => generateEmailSequence({
                    name: project.brandName || project.websiteLink || 'Brand',
                    specialty: project.specialty || 'Direct to Consumer',
                    goal: project.campaignGoal,
                    brief: project.brief || 'General intro',
                    language: project.language
                }, project.aiConfig), 'Email Sequence'),
                trackCall(() => generateInfluencerAndCalendar({
                    name: project.brandName || project.websiteLink || 'Brand',
                    specialty: project.specialty || 'General Lifestyle',
                    goal: project.campaignGoal,
                    brief: project.brief || 'Social expansion',
                    language: project.language
                }, project.aiConfig), 'Influencer & Calendar'),
                trackCall(() => generateMarketingAssets({
                    name: project.brandName || project.websiteLink || 'Brand',
                    specialty: project.specialty || 'Industry',
                    brief: project.brief || 'Analysis',
                    language: project.language
                }, project.aiConfig), 'Marketing Assets')
            ]);

            const errors = [sErr, aErr, eErr, iErr, asErr].filter(Boolean).join('; ');

            setGeneratingSteps([]);
            setProject(s => ({ 
                ...s, 
                result: strategy, 
                adCopies: ads, 
                emailSequence: emails, 
                influencerStrategy: ic?.influencerStrategy || null,
                contentCalendar: ic?.contentCalendar || null,
                socialBios: assets?.socialBios || null,
                hashtags: assets?.hashtags || null,
                customerJourney: assets?.customerJourney || null,
                isGenerating: false,
                error: errors || null
            }));

            if (strategy) {
                await logHistory({
                    type: 'text',
                    studio: 'marketing_studio',
                    content: strategy,
                    prompt: 'Marketing Growth Strategy'
                });
            }

            if (ads && ads.length > 0) {
                await logHistory({
                    type: 'text',
                    studio: 'marketing_studio',
                    content: ads.map(a => `[${a.platform}]\n${a.copy}`).join('\n\n'),
                    prompt: 'Generated Ad Copies'
                });
            }

            if (emails && emails.length > 0) {
                await logHistory({
                    type: 'text',
                    studio: 'marketing_studio',
                    content: emails.map((e, i) => `Email ${i+1}: ${e.subject}\n${e.body}`).join('\n\n'),
                    prompt: 'Generated Email Sequence'
                });
            }
        } catch (err) {
            setProject(s => ({ ...s, isGenerating: false, error: 'Strategy generation failed. Please try again.' }));
        }
        if (cancelledRef.current) return;
    };

    const handleCopy = () => {
        const res = activeTab === 'strategy' ? project.result :
                    activeTab === 'digital' ? project.digitalStrategy :
                    activeTab === 'traditional' ? project.traditionalStrategy :
                    activeTab === 'research' ? project.marketResearch :
                    activeTab === 'competitive' ? project.competitiveStudy :
                    activeTab === 'swot' ? project.swotAnalysis : 
                    activeTab === 'plan' ? project.marketingPlan : null;
        if (!res) return;
        navigator.clipboard.writeText(res).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = (format: 'txt' | 'md' | 'pdf') => {
        const res = activeTab === 'strategy' ? project.result :
                    activeTab === 'digital' ? project.digitalStrategy :
                    activeTab === 'traditional' ? project.traditionalStrategy :
                    activeTab === 'research' ? project.marketResearch :
                    activeTab === 'competitive' ? project.competitiveStudy :
                    activeTab === 'swot' ? project.swotAnalysis : 
                    activeTab === 'plan' ? project.marketingPlan : null;
        if (!res) return;
        
        if (format === 'pdf') {
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;
            printWindow.document.write(`
                <html>
                <head>
                    <title>Marketing Report - ${project.brandName || 'Analysis'}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Tajawal', sans-serif; direction: ${project.language === 'ar' ? 'rtl' : 'ltr'}; padding: 40px; line-height: 1.6; }
                        h1, h2, h3 { color: #ff0000; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        p { font-size: 14px; color: #333; }
                    </style>
                </head>
                <body>
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="margin: 0;">AI Marketing Strategy Report</h1>
                        <p>Generated by Mada Agency</p>
                    </div>
                    <div style="white-space: pre-wrap;">${res}</div>
                    <script>window.onload = () => { window.print(); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
            return;
        }

        const element = document.createElement("a");
        const file = new Blob([res], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `Marketing-Analysis.${format}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const onRefine = async () => {
        const res = activeTab === 'strategy' ? project.result :
                    activeTab === 'digital' ? project.digitalStrategy :
                    activeTab === 'traditional' ? project.traditionalStrategy :
                    activeTab === 'research' ? project.marketResearch :
                    activeTab === 'competitive' ? project.competitiveStudy :
                    activeTab === 'swot' ? project.swotAnalysis : 
                    activeTab === 'plan' ? project.marketingPlan : null;
        if (!res) return;
        setIsRefining(true);
        setProject(s => ({ ...s, error: null }));
        
        try {
            const { IntegrationService } = await import('../services/integrationService');
            const provider = project.aiConfig?.provider || 'gemini';
            
            const refinePrompt = `
                CRITIQUE AND IMPROVE:
                Current Strategy Section (${activeTab}): ${res}
                
                Goal: Refine this ${activeTab} content for maximum impact. 
                Focus on: ${project.campaignGoal}
                Target: ${project.brandName || project.websiteLink}
                
                Please provide an improved version that is more specific, data-driven, and actionable.
            `;

            const response = await IntegrationService.smartCall(provider as any, {
                prompt: refinePrompt,
                systemInstruction: "You are a world-class growth hacker and head of marketing. Improve scripts, strategies, and plans for elite performance."
            });

            if (response.message) {
                const update: any = {};
                switch(activeTab) {
                    case 'strategy': update.result = response.message; break;
                    case 'digital': update.digitalStrategy = response.message; break;
                    case 'traditional': update.traditionalStrategy = response.message; break;
                    case 'research': update.marketResearch = response.message; break;
                    case 'competitive': update.competitiveStudy = response.message; break;
                    case 'swot': update.swotAnalysis = response.message; break;
                    case 'plan': update.marketingPlan = response.message; break;
                }
                setProject(s => ({ ...s, ...update }));
                await logHistory({
                    type: 'text',
                    studio: 'marketing_studio',
                    content: response.message,
                    prompt: `Neural Refinement ${activeTab} V2`
                });
            }
        } catch (err) {
            setProject(s => ({ ...s, error: "Refinement failed." }));
        } finally {
            setIsRefining(false);
        }
    };

    return (
        <main className="w-full flex flex-col gap-8 pt-4 pb-12 animate-in fade-in duration-700">
            {project.isGenerating && (
                <div className="relative">
                    <AILoadingOverlay message="Generating marketing strategy..." steps={generatingSteps} onCancel={() => { cancelledRef.current = true; setProject(s => ({ ...s, isGenerating: false })); }} />
                </div>
            )}
            <div className="relative">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-full self-center border border-white/5 backdrop-blur-xl">
                <button 
                    onClick={() => setTab('strategy')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'strategy' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Core Strategy
                </button>
                <button 
                    onClick={() => setTab('digital')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'digital' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Digital Growth
                </button>
                <button 
                    onClick={() => setTab('traditional')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'traditional' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Traditional Impact
                </button>
                <button 
                    onClick={() => setTab('research')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'research' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Research
                </button>
                <button 
                    onClick={() => setTab('competitive')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'competitive' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Competition
                </button>
                <button 
                    onClick={() => setTab('swot')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'swot' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    SWOT
                </button>
                <button 
                    onClick={() => setTab('plan')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'plan' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Marketing Plan
                </button>
                <button 
                    onClick={() => setTab('content')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Content
                </button>
                <button 
                    onClick={() => setTab('agents')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'agents' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Agents
                </button>
            </div>

            {/* Control Center */}
            <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl border border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-black text-white tracking-tighter flex items-center uppercase">
                            <MarketingIcon /> Marketing Engine
                        </h2>
                        <p className="text-xs text-white/40 font-bold tracking-widest mt-1 ml-8 uppercase">STRATEGIC GROWTH ACCELERATOR</p>
                        </div>
                        <ShareableLink projectId={project.id} projectName={project.name || 'Marketing Strategy'} />
                        <CommentsOverlay targetId={project.id} comments={comments} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} />
                        <VersionTimeline versions={versions} currentVersionId={currentVersionId} onRestore={(v) => { setProject(v.snapshot); setCurrentVersionId(v.id); }} onUndo={handleUndo} onRedo={handleRedo} canUndo={versions.length > 1} canRedo={redoStack.length > 0} />
                        <button onClick={() => setShowTemplatePicker(true)} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Templates"><Plus className="w-4 h-4" /></button>
                        <div className="flex bg-black/40 rounded-full p-1 border border-white/10">
                            <button 
                                onClick={() => setProject(s => ({ ...s, language: 'ar' }))}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${project.language === 'ar' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                        >
                            Arabic
                        </button>
                        <button 
                            onClick={() => setProject(s => ({ ...s, language: 'en' }))}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${project.language === 'en' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                        >
                            English
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    {/* Tab Selection Content */}
                    {activeTab === 'content' ? (
                        <ContentTools 
                            project={project}
                            setProject={setProject}
                            brandName={project.brandName || project.websiteLink || 'Brand'}
                            specialty={project.specialty || 'Industry'}
                            goal={project.campaignGoal || 'brand awareness'}
                            brief={project.brief || ''}
                            language={project.language}
                            aiConfig={project.aiConfig || { provider: 'google', modelId: 'gemini-2.1-flash' }}
                        />
                    ) : activeTab === 'agents' ? (
                        <AgentsPanel />
                    ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Left Column: Context / Brand Info (Shared or Tab Specific) */}
                        <div className="lg:col-span-5 space-y-8">
                            {activeTab === 'strategy' ? (
                                <>
                                    <div className="flex p-1 bg-black/20 rounded-2xl border border-white/5">
                                        <button 
                                            onClick={() => setProject(s => ({ ...s, brandType: 'new' }))}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${project.brandType === 'new' ? 'bg-white/10 text-white shadow-inner' : 'text-white/30 hover:text-white/50'}`}
                                        >
                                            New Brand
                                        </button>
                                        <button 
                                            onClick={() => setProject(s => ({ ...s, brandType: 'existing' }))}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${project.brandType === 'existing' ? 'bg-white/10 text-white shadow-inner' : 'text-white/30 hover:text-white/50'}`}
                                        >
                                            Existing Link
                                        </button>
                                    </div>

                                    {project.brandType === 'new' ? (
                                        <div className="space-y-5 animate-in slide-in-from-left-4 duration-500">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Brand Name</label>
                                                <input 
                                                    value={project.brandName}
                                                    onChange={e => setProject(s => ({ ...s, brandName: e.target.value }))}
                                                    placeholder="e.g. 'Volt Energy'"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Industry / Niche</label>
                                                <input 
                                                    value={project.specialty}
                                                    onChange={e => setProject(s => ({ ...s, specialty: e.target.value }))}
                                                    placeholder="e.g. 'Natural Energy Drinks'"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Competitors (Optional)</label>
                                                <input 
                                                    value={project.competitors}
                                                    onChange={e => setProject(s => ({ ...s, competitors: e.target.value }))}
                                                    placeholder="e.g. RedBull, Monster..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-5 animate-in slide-in-from-left-4 duration-500">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Website or Store Link</label>
                                                <input 
                                                    value={project.websiteLink}
                                                    onChange={e => setProject(s => ({ ...s, websiteLink: e.target.value }))}
                                                    placeholder="https://yourbrand.com"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none"
                                                />
                                            </div>
                                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                                                <p className="text-[11px] text-blue-300 font-medium leading-relaxed italic">
                                                    💡 Deep Analysis Mode: AI will crawl the provided URL to extract design language, copy tone, and target demographics for a precision match.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Strategy Narrative Brief</label>
                                        <textarea 
                                            value={project.brief}
                                            onChange={e => setProject(s => ({ ...s, brief: e.target.value }))}
                                            rows={6}
                                            placeholder="What's the core story? What shift are we making in the market?"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none resize-none suggestions-scrollbar"
                                        />
                                    </div>
                                </>
                            ) : activeTab === 'digital' ? (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Target Platforms</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PLATFORMS.map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => togglePlatform(p)}
                                                    className={`px-4 py-3 rounded-xl text-[10px] font-bold border transition-all ${project.platforms.includes(p) ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white' : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">SEO Keyword Strategy</label>
                                        <select
                                            value={project.seoFocus || ''}
                                            onChange={e => setProject(s => ({ ...s, seoFocus: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none"
                                        >
                                            <option value="" className="bg-zinc-900">Select Organic Priority</option>
                                            {SEO_FOCUS_AREAS.map(area => <option key={area} value={area} className="bg-zinc-900">{area}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Digital Ad Budget Range</label>
                                        <input 
                                            type="number"
                                            value={project.monthlyBudget || ''}
                                            onChange={e => setProject(s => ({ ...s, monthlyBudget: e.target.value }))}
                                            placeholder="Monthly Spend"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none"
                                        />
                                    </div>
                                </div>
                            ) : activeTab === 'traditional' ? (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Traditional Media Selection</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {TRADITIONAL_CHANNELS.map(c => (
                                                <label key={c} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:border-white/20 transition-all">
                                                    <input 
                                                        type="checkbox"
                                                        checked={project.traditionalChannels?.includes(c)}
                                                        onChange={e => {
                                                            const channels = project.traditionalChannels || [];
                                                            setProject(s => ({
                                                                ...s,
                                                                traditionalChannels: e.target.checked 
                                                                    ? [...channels, c]
                                                                    : channels.filter(ch => ch !== c)
                                                            }));
                                                        }}
                                                        className="w-5 h-5 rounded-lg border-white/20 bg-transparent text-[var(--color-accent)] focus:ring-0"
                                                    />
                                                    <span className="text-[12px] font-bold text-white">{c}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'research' ? (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Current Market Trends</label>
                                        <textarea 
                                            value={project.marketTrends || ''}
                                            onChange={e => setProject(s => ({ ...s, marketTrends: e.target.value }))}
                                            rows={4}
                                            placeholder="What's happening in your industry right now?"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Audience Psychographics</label>
                                        <textarea 
                                            value={project.targetAudience || ''}
                                            onChange={e => setProject(s => ({ ...s, targetAudience: e.target.value }))}
                                            rows={4}
                                            placeholder="Values, interests, lifestyles of your ideal customers..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            ) : activeTab === 'competitive' ? (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Direct Competitor List</label>
                                        <textarea 
                                            value={project.competitors}
                                            onChange={e => setProject(s => ({ ...s, competitors: e.target.value }))}
                                            rows={4}
                                            placeholder="Competitor A, Competitor B..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Unique Selling Point (USP)</label>
                                        <input 
                                            value={project.uniqueSellingPoint || ''}
                                            onChange={e => setProject(s => ({ ...s, uniqueSellingPoint: e.target.value }))}
                                            placeholder="Why choose you over them?"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none"
                                        />
                                    </div>
                                </div>
                            ) : activeTab === 'swot' ? (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-1">Strengths</label>
                                            <textarea 
                                                value={project.perceivedStrengths || ''}
                                                onChange={e => setProject(s => ({ ...s, perceivedStrengths: e.target.value }))}
                                                rows={3}
                                                className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 text-xs font-bold text-white outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest ml-1">Weaknesses</label>
                                            <textarea 
                                                value={project.perceivedWeaknesses || ''}
                                                onChange={e => setProject(s => ({ ...s, perceivedWeaknesses: e.target.value }))}
                                                rows={3}
                                                className="w-full bg-rose-500/5 border border-rose-500/10 rounded-2xl p-3 text-xs font-bold text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Opportunities</label>
                                            <textarea 
                                                value={project.perceivedOpportunities || ''}
                                                onChange={e => setProject(s => ({ ...s, perceivedOpportunities: e.target.value }))}
                                                rows={3}
                                                className="w-full bg-blue-500/5 border border-blue-500/10 rounded-2xl p-3 text-xs font-bold text-white outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest ml-1">Threats</label>
                                            <textarea 
                                                value={project.perceivedThreats || ''}
                                                onChange={e => setProject(s => ({ ...s, perceivedThreats: e.target.value }))}
                                                rows={3}
                                                className="w-full bg-amber-500/5 border border-amber-500/10 rounded-2xl p-3 text-xs font-bold text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Campaign Duration</label>
                                        <input 
                                            value={project.campaignDuration || ''}
                                            onChange={e => setProject(s => ({ ...s, campaignDuration: e.target.value }))}
                                            placeholder="e.g. 3 Months, Quarter 4..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Core Objectives Brief</label>
                                        <textarea 
                                            value={project.brief}
                                            onChange={e => setProject(s => ({ ...s, brief: e.target.value }))}
                                            rows={5}
                                            placeholder="Describe the main roadmap goals..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Deep Tuning / Systems */}
                        <div className="lg:col-span-7 space-y-8">
                            {activeTab === 'strategy' ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Campaign Goal</label>
                                            <div className="flex flex-col gap-2">
                                                {GOALS.slice(0, 3).map(g => (
                                                    <button
                                                        key={g}
                                                        onClick={() => setProject(s => ({ ...s, campaignGoal: g }))}
                                                        className={`px-4 py-3 rounded-2xl text-[10px] font-bold border transition-all text-left ${project.campaignGoal === g ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/10'}`}
                                                    >
                                                        {g}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Brand Voice</label>
                                            <select
                                                value={project.campaignTone}
                                                onChange={e => setProject(s => ({ ...s, campaignTone: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none"
                                            >
                                                {TONES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/5 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Neural Precision Options</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Strategy Archetype</label>
                                                <select
                                                    value={project.competitorStrategy || ''}
                                                    onChange={e => setProject(s => ({ ...s, competitorStrategy: e.target.value }))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] font-bold text-white outline-none"
                                                >
                                                    <option value="" className="bg-zinc-900">Adaptive / Natural</option>
                                                    {STRATEGY_ARCHETYPES.map(a => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Campaign Type</label>
                                                <select
                                                    value={project.campaignType || ''}
                                                    onChange={e => setProject(s => ({ ...s, campaignType: e.target.value }))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] font-bold text-white outline-none"
                                                >
                                                    {CAMPAIGN_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Budget Allocation Range ($)</label>
                                            <input 
                                                type="number"
                                                value={project.monthlyBudget || ''}
                                                onChange={e => setProject(s => ({ ...s, monthlyBudget: e.target.value }))}
                                                placeholder="e.g. 10000"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] font-bold text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : activeTab === 'digital' ? (
                                <div className="space-y-8 animate-in delay-100 fade-in duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Primary Conversion Goal</label>
                                        <input 
                                            value={project.conversionGoal || ''}
                                            onChange={e => setProject(s => ({ ...s, conversionGoal: e.target.value }))}
                                            placeholder="e.g. Sales, Email signups..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Growth Friction Areas</label>
                                        <textarea 
                                            value={project.customerPainPoints}
                                            onChange={e => setProject(s => ({ ...s, customerPainPoints: e.target.value }))}
                                            rows={4}
                                            placeholder="Technical hurdles, trust issues, etc."
                                            className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm font-medium text-white outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            ) : activeTab === 'traditional' ? (
                                <div className="space-y-8 animate-in delay-100 fade-in duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Event / Activation Vision</label>
                                        <textarea 
                                            value={project.eventStrategy || ''}
                                            onChange={e => setProject(s => ({ ...s, eventStrategy: e.target.value }))}
                                            rows={5}
                                            placeholder="Guerilla marketing, pop-ups, events..."
                                            className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm font-medium text-white outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Physical Specs</label>
                                        <input 
                                            value={project.printMediaDetails || ''}
                                            onChange={e => setProject(s => ({ ...s, printMediaDetails: e.target.value }))}
                                            placeholder="Merch, brochures, signage..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none"
                                        />
                                    </div>
                                </div>
                            ) : activeTab === 'research' ? (
                                <div className="space-y-6 animate-in delay-100 fade-in duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Target Demographics</label>
                                        <textarea 
                                            value={project.targetDemographics || ''}
                                            onChange={e => setProject(s => ({ ...s, targetDemographics: e.target.value }))}
                                            rows={4}
                                            placeholder="Age, Gender, Location, Income..."
                                            className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm font-medium text-white outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Economic & Regulatory Impact</label>
                                        <textarea 
                                            value={project.economicImpact || ''}
                                            onChange={e => setProject(s => ({ ...s, economicImpact: e.target.value }))}
                                            rows={4}
                                            placeholder="Taxes, laws, economic climate effects..."
                                            className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm font-medium text-white outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            ) : activeTab === 'competitive' ? (
                                <div className="space-y-6 animate-in delay-100 fade-in duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Positioning Statement</label>
                                        <textarea 
                                            value={project.positioningStatement || ''}
                                            onChange={e => setProject(s => ({ ...s, positioningStatement: e.target.value }))}
                                            rows={4}
                                            placeholder="For [Target], [Brand] is the [Category] that [USP]..."
                                            className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm font-medium text-white outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Direct Competitor Focus</label>
                                        <textarea 
                                            value={project.competitorStrategy || ''}
                                            onChange={e => setProject(s => ({ ...s, competitorStrategy: e.target.value }))}
                                            rows={3}
                                            placeholder="Strategy focus against core rivals..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none"
                                        />
                                    </div>
                                </div>
                            ) : activeTab === 'swot' ? (
                                <div className="space-y-6 animate-in delay-100 fade-in duration-500">
                                     <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-4">SWOT Analysis Context</h4>
                                        <p className="text-xs text-white/50 leading-relaxed italic">
                                            AI will synthesize internal perceived factors with external market data to provide a comprehensive SWOT matrix. Ensure you populated the Strengths/Weaknesses on the left.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Top Strategic Threat</label>
                                        <input 
                                            value={project.perceivedThreats || ''}
                                            onChange={e => setProject(s => ({ ...s, perceivedThreats: e.target.value }))}
                                            placeholder="Biggest single threat..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in delay-100 fade-in duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Success Metrics (KPIs)</label>
                                        <textarea 
                                            value={project.successMetrics || ''}
                                            onChange={e => setProject(s => ({ ...s, successMetrics: e.target.value }))}
                                            rows={4}
                                            placeholder="ROAS, CAC, Monthly Revenue Goals, Organic traffic..."
                                            className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm font-medium text-white outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Resource Requirements</label>
                                        <input 
                                            value={project.resourceRequirements || ''}
                                            onChange={e => setProject(s => ({ ...s, resourceRequirements: e.target.value }))}
                                            placeholder="Hiring, Tools, Creative production budget..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Execution Engine Actions */}
                            <div className="pt-8 border-t border-white/5 space-y-6">
                                <AISelector 
                                    config={project.aiConfig || { provider: 'google', modelId: 'gemini-2.1-flash' }} 
                                    onChange={(cfg) => setProject(s => ({ ...s, aiConfig: cfg }))} 
                                    studioId="marketing_studio"
                                />
                                
                                <button 
                                    onClick={onGenerate}
                                    disabled={project.isGenerating}
                                    className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-black py-6 rounded-3xl shadow-2xl shadow-[var(--color-accent)]/30 transition-all active:scale-[0.98] disabled:opacity-30 text-xl uppercase tracking-[0.2em]"
                                >
                                    {project.isGenerating ? 'Synthesizing Intelligence...' : 'Compute Growth Strategy'}
                                </button>
                        </div>
                    </div>
                    </div>
                )}  {/* end content tab ternary */}
                </div>
            </div>

            {/* Strategy Components */}
            {(project.adCopies || project.emailSequence || project.influencerStrategy || project.contentCalendar || project.socialBios || project.hashtags || project.customerJourney) && (
                <div className="space-y-16 animate-in slide-in-from-bottom-8 duration-700">
                    
                    {/* Digital Ecosystem Section */}
                    {(project.socialBios || project.hashtags) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {project.socialBios && (
                                <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 mb-6">
                                        <Share2 className="w-5 h-5 text-pink-400" /> Multi-Platform Bios
                                    </h3>
                                    <div className="space-y-4">
                                        {project.socialBios.map((bio, idx) => (
                                            <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">{bio.platform}</p>
                                                <p className="text-xs text-white/80 leading-relaxed font-medium">{bio.bio}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {project.hashtags && (
                                <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 mb-6">
                                        <Megaphone className="w-5 h-5 text-orange-400" /> Curated Hashtag Stack
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {project.hashtags.map((tag, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-default">#{tag.replace('#', '')}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customer Journey */}
                    {project.customerJourney && (
                        <div className="glass-card rounded-[3rem] p-12 border border-white/5 shadow-3xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-all">
                                <TrendingUp className="w-48 h-48" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 mb-10 relative z-10">
                                <Target className="w-5 h-5 text-emerald-400" /> Strategic Customer Journey
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                                {project.customerJourney.map((step, idx) => (
                                    <div key={idx} className="relative p-6 bg-white/5 rounded-3xl border border-white/5">
                                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg">{idx + 1}</div>
                                        <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest mb-3 pr-4">{step.stage}</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Key Action</p>
                                                <p className="text-xs font-bold text-white leading-tight">{step.action}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Brand Message</p>
                                                <p className="text-[11px] text-white/60 leading-relaxed italic">"{step.message}"</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Influencer & Calendar Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {project.influencerStrategy && (
                            <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-all">
                                    <Target className="w-48 h-48" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 mb-6 relative z-10">
                                    <Target className="w-5 h-5 text-emerald-400" /> Influencer Synergy Mapping
                                </h3>
                                <div className="prose prose-invert max-w-none text-white/70 font-medium leading-[1.8] suggestions-scrollbar overflow-y-auto max-h-[350px] relative z-10">
                                    {project.influencerStrategy.split('\n').map((line, i) => (
                                        <p key={i} className="mb-4">{line}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {project.contentCalendar && (
                            <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                                <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 mb-8">
                                    <TrendingUp className="w-5 h-5 text-purple-400" /> 7-Day Content Pulse
                                </h3>
                                <div className="space-y-4">
                                    {project.contentCalendar.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                            <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/10 pr-4">
                                                <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-tighter">Day</span>
                                                <span className="text-xl font-black text-white">{item.day.replace(/[^0-9]/g, '') || idx + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{item.format}</p>
                                                <p className="text-sm font-bold text-white/90 leading-tight">{item.topic}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {project.adCopies && (
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2.5 mb-6">
                                <Megaphone className="w-5 h-5 text-orange-400" /> Platform-Specific Ad Suite
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {project.adCopies.map((ad, idx) => (
                                    <div key={idx} className="glass-card rounded-3xl p-6 border border-white/5 flex flex-col gap-4 group hover:border-[var(--color-accent)]/30 transition-all shadow-xl">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest bg-[var(--color-accent)]/10 px-3 py-1 rounded-full">{ad.platform}</span>
                                            <button onClick={() => handleCopyAd(ad.copy, idx)} className="text-white/30 hover:text-white">
                                                {adCopiesCopied === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <div className="text-sm text-white/80 leading-relaxed font-medium whitespace-pre-wrap suggestions-scrollbar overflow-y-auto max-h-[150px]">
                                            {ad.copy}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {project.emailSequence && (
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2.5 mb-6">
                                <FileText className="w-5 h-5 text-blue-400" /> Nurture Email Sequence
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {project.emailSequence.map((email, idx) => (
                                    <div key={idx} className="glass-card rounded-3xl p-8 border border-white/5 flex flex-col gap-5 group hover:border-blue-500/30 transition-all shadow-xl">
                                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Email {idx + 1}</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Subject Line</p>
                                                <p className="text-xs font-bold text-white">{email.subject}</p>
                                            </div>
                                            <div className="h-[200px] overflow-y-auto suggestions-scrollbar pr-2">
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Body Content</p>
                                                <p className="text-[11px] text-white/60 leading-relaxed">{email.body}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`).catch(() => {})}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <Copy className="w-3 h-3" /> Copy Sequence
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Intelligence Report Output */}
            {(activeTab === 'strategy' ? project.result :
              activeTab === 'digital' ? project.digitalStrategy :
              activeTab === 'traditional' ? project.traditionalStrategy :
              activeTab === 'research' ? project.marketResearch :
              activeTab === 'competitive' ? project.competitiveStudy :
              activeTab === 'swot' ? project.swotAnalysis : 
              activeTab === 'plan' ? project.marketingPlan : null) && (
                <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2.5">
                            <i className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></i> 
                            {activeTab === 'strategy' ? 'Core Strategy' :
                             activeTab === 'digital' ? 'Digital Growth Blueprint' :
                             activeTab === 'traditional' ? 'Traditional Impact Roadmap' :
                             activeTab === 'research' ? 'Market Research' :
                             activeTab === 'competitive' ? 'Competitive Deep Dive' :
                             activeTab === 'swot' ? 'SWOT Analysis' : 
                             activeTab === 'plan' ? 'Actionable Marketing Plan' : 'Intelligence Report'} Output
                        </h3>
                        {/* ... rest of the buttons ... */}
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={handleCopy} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center transition-all border border-white/5">
                                {copied ? <CheckIcon /> : <CopyIcon />} {copied ? 'Copied' : 'Copy Text'}
                            </button>
                            <button onClick={() => handleDownload('pdf')} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center transition-all border border-white/5">
                                <DownloadIcon /> Export / PDF
                            </button>
                            <button 
                                onClick={onRefine}
                                disabled={isRefining}
                                className="px-6 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center transition-all shadow-xl shadow-[var(--color-accent)]/20 disabled:opacity-50"
                            >
                                <Sparkles className={`w-3.5 h-3.5 mr-2 ${isRefining ? 'animate-spin' : ''}`} /> {isRefining ? 'Neural Refining...' : 'V2 Neural Refine'}
                            </button>
                        </div>
                    </div>

                    <div className="glass-card rounded-[3rem] p-8 md:p-14 shadow-2xl border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-accent)]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

                        <div 
                            className={`prose prose-invert max-w-none text-white/70 font-medium leading-[1.8] suggestions-scrollbar overflow-y-auto max-h-[1500px] relative z-10 ${project.language === 'ar' ? 'text-right' : 'text-left'}`} 
                            style={{ direction: project.language === 'ar' ? 'rtl' : 'ltr' }}
                        >
                            {((activeTab === 'strategy' ? project.result :
                               activeTab === 'research' ? project.marketResearch :
                               activeTab === 'competitive' ? project.competitiveStudy :
                               activeTab === 'swot' ? project.swotAnalysis : 
                               activeTab === 'plan' ? project.marketingPlan : '') || '').split('\n').map((line, i) => {
                                if (line.startsWith('# ')) return <h1 key={i} className="text-4xl font-black text-white mt-10 mb-8 border-b border-white/10 pb-6 uppercase tracking-tighter">{line.replace('# ', '')}</h1>;
                                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black text-[var(--color-accent)] mt-12 mb-6 uppercase tracking-tight flex items-center gap-3"><div className="w-8 h-[2px] bg-[var(--color-accent)]/30"></div> {line.replace('## ', '')}</h2>;
                                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-black text-white mt-10 mb-4 uppercase tracking-widest flex items-center gap-2.5 text-white/90 underline decoration-[var(--color-accent)]/30 underline-offset-8"> {line.replace('### ', '')}</h3>;
                                if (line.trim() === '') return <div key={i} className="h-6"></div>;
                                return <p key={i} className="mb-6">{line}</p>;
                            })}
                        </div>
                        
                        <div className="absolute bottom-12 right-12 opacity-[0.03] pointer-events-none select-none">
                            <img src={LOGO_IMAGE_URL} className="w-[300px]" alt="Mada Agency" />
                        </div>
                    </div>
                </div>
            )}

            {project.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-[2.5rem] text-sm text-center font-bold animate-shake uppercase tracking-widest">
                    ⚠️ Error: {project.error}
                </div>
            )}
            </div>
        {showTemplatePicker && (
            <TemplatePicker
                studioType="marketing_studio"
                onSelect={(template) => {
                    setShowTemplatePicker(false);
                    setProject(s => ({ ...s, ...template.defaultData }));
                }}
                onDismiss={() => setShowTemplatePicker(false)}
            />
        )}
        </main>
    );
};

export default MarketingStudio;
