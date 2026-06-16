
import React, { useCallback, useState, useEffect } from 'react';
import { PlanStudioProject, ImageFile, PlanIdea } from '../types';
import { resizeImage } from '../utils';
import { generateCampaignPlan, generateImage, analyzeProductForCampaign, generatePlanStrategy } from '../services/geminiService';
import { logHistory } from '../lib/admin';
import ImageWorkspace from './ImageWorkspace';
import AISelector from './AISelector';
import { LOGO_IMAGE_URL } from '../constants';
import { 
    Zap, 
    Sparkles, 
    Target, 
    Globe, 
    MessageSquare, 
    Download, 
    Plus, 
    Briefcase,
    Layout,
    Layers,
    BookOpen,
    Users,
    TrendingUp,
    ShieldAlert,
    BarChart3,
    Compass,
    Map,
    Presentation
} from 'lucide-react';
import { cn } from '../lib/utils';

const TARGET_MARKETS = [
    'Egypt', 'Saudi Arabia (KSA)', 'United Arab Emirates (UAE)', 'Oman (Sultanate of Oman)', 'The Gulf (General)', 'Global / International', 'Europe', 'North America'
];

const BASE_LANGUAGES = [
    { id: 'egy', label: 'Egyptian / مصرية' },
    { id: 'sau', label: 'Saudi / سعودية' },
    { id: 'oma', label: 'Omani / عمانية' },
    { id: 'gulf', label: 'Gulf / خليجية عامة' },
    { id: 'msa', label: 'Modern Standard / فصحى' },
    { id: 'lev', label: 'Levantine / شامي' },
    { id: 'eng', label: 'English / إنجليزية' }
];

const FORMALITY_OPTIONS = [
    { id: 'slang', label: 'Slang / عامية دارجة' },
    { id: 'formal', label: 'Formal / رسمي - فصحى' }
];

const PlanStudio: React.FC<{
    project: PlanStudioProject;
    setProject: React.Dispatch<React.SetStateAction<PlanStudioProject>>;
    allProjects?: PlanStudioProject[];
    onSelectProject?: (index: number) => void;
}> = ({ project, setProject, allProjects = [], onSelectProject }) => {

    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [selectedLang, setSelectedLang] = useState('egy');
    const [selectedFormality, setSelectedFormality] = useState('slang');

    // Update dialect in project when internal selects change
    useEffect(() => {
        const langLabel = BASE_LANGUAGES.find(l => l.id === selectedLang)?.label || 'Arabic';
        const formLabel = FORMALITY_OPTIONS.find(f => f.id === selectedFormality)?.label || 'Slang';
        
        // Special mapping for requested "Saudi native pure"
        let finalDialect = `${langLabel} (${formLabel})`;
        if (selectedLang === 'sau' && selectedFormality === 'slang') {
            finalDialect = "اللهجة السعودية الدارجة الصرفة (Native Pure Saudi Slang)";
        } else if (selectedLang === 'oma' && selectedFormality === 'slang') {
            finalDialect = "اللهجة العمانية الدارجة (Omani Slang)";
        }
        
        setProject(s => ({ ...s, dialect: finalDialect }));
    }, [selectedLang, selectedFormality, setProject]);

    // Trigger Category Analysis when images change
    useEffect(() => {
        if (project.productImages.length > 0 && !project.categoryAnalysis && !project.isAnalyzingCategory) {
            const runAnalysis = async () => {
                setProject(s => ({ ...s, isAnalyzingCategory: true }));
                try {
                    const analysis = await analyzeProductForCampaign(project.productImages);
                    setProject(s => ({ ...s, categoryAnalysis: analysis, isAnalyzingCategory: false }));
                    logHistory({
                        type: 'text',
                        studio: 'plan_studio',
                        content: analysis,
                        prompt: 'Product Category Analysis'
                    });
                } catch (err) {
                    setProject(s => ({ ...s, isAnalyzingCategory: false }));
                }
            };
            runAnalysis();
        }
    }, [project.productImages.length, project.categoryAnalysis, project.isAnalyzingCategory, setProject]);

    const handleFileUpload = (target: 'product') => async (files: File[]) => {
        if (!files || files.length === 0) return;
        setProject(s => ({ ...s, isUploading: true, error: null, categoryAnalysis: null }));
        try {
            const uploaded = await Promise.all(files.map(async file => {
                const resized = await resizeImage(file, 2048, 2048);
                const reader = new FileReader();
                return new Promise<ImageFile>(res => {
                    reader.onloadend = () => res({ base64: (reader.result as string).split(',')[1], mimeType: resized.type, name: resized.name });
                    reader.readAsDataURL(resized);
                });
            }));
            setProject(s => ({
                ...s,
                productImages: [...s.productImages, ...uploaded],
                isUploading: false
            }));
        } catch (err) {
            setProject(s => ({ ...s, isUploading: false, error: "Upload failed" }));
        }
    };

    const onCreatePlan = async () => {
        if (!project.prompt.trim()) {
            setProject(s => ({ ...s, error: 'Please describe your goal or campaign vision.' }));
            return;
        }
        setProject(s => ({ ...s, isGeneratingPlan: true, error: null }));
        try {
            const plan = await generateCampaignPlan(project.productImages, project.prompt, project.targetMarket, project.dialect, project.aiConfig);
            const ideas: PlanIdea[] = plan.map(p => ({
                ...p,
                image: null,
                isLoadingImage: false,
                imageError: null
            }));
            setProject(s => ({ ...s, ideas, isGeneratingPlan: false, activeTab: 'posts' }));
            logHistory({
                type: 'text',
                studio: 'plan_studio',
                content: ideas.map(i => `TOV: ${i.tov}\nCaption: ${i.caption}\nSchedule: ${i.schedule}`).join('\n\n'),
                prompt: `Generate Campaign Plan: ${project.prompt}`
            });
        } catch (err) {
            setProject(s => ({ ...s, isGeneratingPlan: false, error: "Plan generation failed" }));
        }
    };

    const handleFullSynthesis = async () => {
        if (!project.prompt.trim()) {
            setProject(s => ({ ...s, error: 'Please describe your goal or campaign vision for full synthesis.' }));
            return;
        }
        setProject(s => ({ ...s, isGeneratingPlan: true, error: null }));
        try {
            // 1. Strategic Foundation (Pillars & Personas)
            const strategy = await generatePlanStrategy(project.productImages, project.prompt, project.targetMarket, project.aiConfig);
            
            // 2. Campaign Plan (Posts)
            const plan = await generateCampaignPlan(project.productImages, project.prompt, project.targetMarket, project.dialect, project.aiConfig);
            const ideas: PlanIdea[] = plan.map(p => ({
                ...p,
                image: null,
                isLoadingImage: false,
                imageError: null
            }));

            setProject(s => ({ 
                ...s, 
                pillars: strategy?.pillars || [],
                personas: strategy?.personas || [], 
                swot: strategy?.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] },
                positioning: strategy?.positioning || { valueProp: '', competitorGaps: [], targetPricing: '' },
                roadmap: strategy?.roadmap || [],
                canvas: strategy?.canvas || { keyPartners: [], keyActivities: [], valueProps: [], customerRelations: [], segments: [], channels: [], costStructure: [], revenueStreams: [] },
                battleCards: strategy?.battleCards || [],
                pitchDeck: strategy?.pitchDeck || [],
                ideas, 
                isGeneratingPlan: false,
                activeTab: 'strategy'
            }));

            logHistory({
                type: 'text',
                studio: 'plan_studio',
                prompt: `Full Campaign Synthesis: ${project.prompt}`,
                content: `Strategic Pillars and ${ideas.length} ideas developed.`
            });
        } catch (err) {
            setProject(s => ({ ...s, isGeneratingPlan: false, error: "Full synthesis failed" }));
        }
    };

    const onGenerateIdeaImage = async (ideaId: string) => {
        const ideaIdx = project.ideas.findIndex(i => i.id === ideaId);
        if (ideaIdx === -1) return;

        setProject(s => {
            const next = [...s.ideas];
            next[ideaIdx] = { ...next[ideaIdx], isLoadingImage: true, imageError: null };
            return { ...s, ideas: next };
        });

        try {
            const textConstraint = "STRICTLY PRESERVE all original branding from the product images if provided. NO EXTRA generated text in the scene.";
            const categoryContext = project.categoryAnalysis ? `Product Category context: ${project.categoryAnalysis}.` : '';
            const finalPrompt = `Professional commercial photography for social media. ${categoryContext} Scenario: ${project.ideas[ideaIdx].scenario}. Style: Photorealistic, high-end commercial shot. ${textConstraint}`;
            
            const image = await generateImage(project.productImages, finalPrompt, null, "3:4", project.aiConfig);
            
            setProject(s => {
                const next = [...s.ideas];
                next[ideaIdx] = { ...next[ideaIdx], image, isLoadingImage: false };
                return { ...s, ideas: next };
            });

            logHistory({
                type: 'image',
                studio: 'plan_studio',
                content: `data:${image.mimeType};base64,${image.base64}`,
                prompt: `Plan Idea visual: ${project.ideas[ideaIdx].scenario}`
            });
        } catch (err) {
            setProject(s => {
                const next = [...s.ideas];
                next[ideaIdx] = { ...next[ideaIdx], isLoadingImage: false, imageError: "Failed to generate image" };
                return { ...s, ideas: next };
            });
        }
    };

    const handleDownload = (image: ImageFile, label: string, resolution: '2k' | '4k' | 'original' = 'original') => {
        if (resolution === 'original') {
            const link = document.createElement('a');
            link.href = `data:${image.mimeType};base64,${image.base64}`;
            link.download = `Mada-Plan-${label.replace(/\s+/g, '-')}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        setIsDownloading(`${label}-${resolution}`);
        const img = new Image();
        img.src = `data:${image.mimeType};base64,${image.base64}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setIsDownloading(null);
                return;
            };

            const targetWidth = resolution === '4k' ? 4096 : 2048;
            const aspectRatio = img.width / img.height;
            
            canvas.width = targetWidth;
            canvas.height = targetWidth / aspectRatio;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const link = document.createElement('a');
            link.download = `Mada-Plan-${label.replace(/\s+/g, '-')}-${resolution}-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setIsDownloading(null);
        };
        img.onerror = () => setIsDownloading(null);
    };

    const updateIdea = (id: string, field: keyof PlanIdea, value: string) => {
        setProject(s => ({
            ...s,
            ideas: (s.ideas || []).map(i => i.id === id ? { ...i, [field]: value } : i)
        }));
    };

    const handleExportFullReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const ideasRows = (project.ideas || []).map((idea, idx) => `
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold; width: 50px;">${idx + 1}</td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; font-weight: bold; color: #ff0000; width: 150px;">${idea.tov}</td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; line-height: 1.6;">${idea.caption}</td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; font-size: 11px; color: #666; width: 120px;">${idea.schedule}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Mada Campaign Plan - ${project.name}</title>
                <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Tajawal', sans-serif; direction: rtl; padding: 40px; color: #333; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ff0000; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { height: 60px; }
                    .title-box h1 { margin: 0; color: #000; font-size: 28px; }
                    .title-box p { margin: 5px 0 0 0; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f9f9f9; padding: 15px; text-align: right; border-bottom: 2px solid #eee; font-size: 14px; text-transform: uppercase; }
                    @media print {
                        .no-print { display: none; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title-box">
                        <h1>خطة الحملة الإعلانية الذكية</h1>
                        <p>بواسطة Mada Agency</p>
                    </div>
                    <img src="${LOGO_IMAGE_URL}" class="logo" />
                </div>
                
                <div style="margin-bottom: 30px; background: #fff5f5; padding: 20px; border-radius: 10px; border-right: 5px solid #ff0000;">
                    <h3 style="margin-top: 0; color: #ff0000;">تفاصيل الحملة:</h3>
                    <p><strong>السوق المستهدف:</strong> ${project.targetMarket}</p>
                    <p><strong>اللهجة:</strong> ${project.dialect}</p>
                    <p><strong>الرؤية:</strong> ${project.prompt}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>العنوان / الخطاف</th>
                            <th>نص المنشور (Caption)</th>
                            <th>وقت النشر</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ideasRows}
                    </tbody>
                </table>

                <div class="no-print" style="position: fixed; bottom: 30px; left: 30px;">
                    <button onclick="window.print()" style="background: #ff0000; color: white; border: none; padding: 18px 35px; border-radius: 50px; font-weight: bold; cursor: pointer; box-shadow: 0 15px 30px rgba(255,0,0,0.4); font-size: 16px; transition: transform 0.2s;">
                        تأكيد وتحميل كـ PDF / طباعة
                    </button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <main className="w-full flex flex-col gap-8 pt-4 pb-12 animate-in fade-in duration-700">
            <AISelector 
                config={project.aiConfig || { provider: 'google', modelId: 'gemini-2.1-flash' }} 
                onChange={(cfg) => setProject(s => ({ ...s, aiConfig: cfg }))}
                studioId="plan_studio"
            />

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-[32px] border border-white/5 w-fit">
                {[
                    { id: 'brief', label: 'Brief', icon: MessageSquare },
                    { id: 'strategy', label: 'Strategy', icon: Target },
                    { id: 'market', label: 'Market Intelligence', icon: BarChart3 },
                    { id: 'architecture', label: 'Business Architecture', icon: Layers },
                    { id: 'roadmap', label: 'Roadmap', icon: Map },
                    { id: 'pitch', label: 'Pitch Deck', icon: Presentation },
                    { id: 'posts', label: 'Content', icon: Layout },
                    { id: 'history', label: 'Archives', icon: Briefcase }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setProject(s => ({ ...s, activeTab: tab.id as any }))}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all",
                            project.activeTab === tab.id 
                                ? "bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20" 
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {project.activeTab === 'brief' && (
                <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-[var(--color-accent)]" /> STRATEGIC CAMPAIGN PLANNER
                        </h2>
                        <div className="flex gap-3">
                            {project.ideas.length > 0 && (
                                <button
                                    onClick={handleExportFullReport}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full text-sm font-black uppercase tracking-widest flex items-center border border-white/10 transition-all"
                                >
                                    <Download className="w-4 h-4 mr-2" /> Download Report
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="flex flex-col gap-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Product Reference (Optional)</label>
                                <ImageWorkspace
                                    id="plan-product-up"
                                    images={project.productImages}
                                    onImagesUpload={handleFileUpload('product')}
                                    onImageRemove={(i) => setProject(s => ({ ...s, productImages: s.productImages.filter((_, idx) => idx !== i), categoryAnalysis: null }))}
                                    isUploading={project.isUploading}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <div className="flex flex-col gap-2 bg-white/5 p-6 rounded-3xl border border-white/5">
                                <label className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-widest">Campaign Goal & Brand Vision</label>
                                <textarea
                                    value={project.prompt}
                                    onChange={(e) => setProject(s => ({ ...s, prompt: e.target.value }))}
                                    placeholder="e.g. 'Launching a limited edition luxury perfume for women. Focus on mystery and elegance.'"
                                    className="w-full bg-transparent border-none p-0 text-lg font-medium focus:ring-0 placeholder:text-white/20 min-h-[100px] suggestions-scrollbar"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-[var(--color-accent)]" /> Target Market
                                    </label>
                                    <select 
                                        value={project.targetMarket}
                                        onChange={(e) => setProject(s => ({ ...s, targetMarket: e.target.value }))}
                                        className="bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0 cursor-pointer"
                                    >
                                        {TARGET_MARKETS.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                                    </select>
                                </div>
                                
                                <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" /> Language
                                    </label>
                                    <select 
                                        value={selectedLang}
                                        onChange={(e) => setSelectedLang(e.target.value)}
                                        className="bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0 cursor-pointer"
                                    >
                                        {BASE_LANGUAGES.map(l => <option key={l.id} value={l.id} className="bg-gray-900">{l.label}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <Target className="w-4 h-4 text-[var(--color-accent)]" /> Style
                                    </label>
                                    <select 
                                        value={selectedFormality}
                                        onChange={(e) => setSelectedFormality(e.target.value)}
                                        className="bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0 cursor-pointer"
                                        disabled={selectedLang === 'msa'} 
                                    >
                                        {FORMALITY_OPTIONS.map(f => <option key={f.id} value={f.id} className="bg-gray-900">{f.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={onCreatePlan}
                                    disabled={project.isGeneratingPlan || !project.prompt.trim()}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-2xl border border-white/10 transition-all text-xs uppercase tracking-widest"
                                >
                                    Quick Post Ideas
                                </button>
                                <button
                                    onClick={handleFullSynthesis}
                                    disabled={project.isGeneratingPlan || !project.prompt.trim()}
                                    className="flex-[2] bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-black py-5 rounded-2xl shadow-xl shadow-[var(--color-accent)]/20 transition-all active:scale-[0.98] text-lg uppercase tracking-widest flex items-center justify-center gap-3"
                                >
                                    {project.isGeneratingPlan ? <Zap className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {project.isGeneratingPlan ? 'ORCHESTRATING...' : 'Full Strategy Synthesis'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {project.activeTab === 'strategy' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Strategic Pillars */}
                        <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Content Pillars</h3>
                            </div>
                            
                            <div className="space-y-6">
                                {project.pillars.length === 0 ? (
                                    <div className="py-12 text-center text-white/20 italic text-sm">Perform full synthesis to define pillars</div>
                                ) : (
                                    project.pillars.map((p, i) => (
                                        <div key={i} className="p-6 bg-white/[0.02] rounded-[32px] border border-white/5 hover:bg-white/5 transition-all group">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="text-[10px] font-black text-[var(--color-accent)]/40 w-6">0{i+1}</div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-wider">{p.title}</h4>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed ml-10 italic">{p.description}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Audience Personas */}
                        <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Target Personas</h3>
                            </div>

                            <div className="space-y-6">
                                {project.personas.length === 0 ? (
                                    <div className="py-12 text-center text-white/20 italic text-sm">Perform full synthesis to define personas</div>
                                ) : (
                                    project.personas.map((p, i) => (
                                        <div key={i} className="p-6 bg-white/[0.02] rounded-[32px] border border-white/5 hover:bg-white/5 transition-all group">
                                            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">{p.title}</h4>
                                            <p className="text-xs text-white/50 leading-relaxed mb-4 italic">{p.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(p.painPoints || []).map((pp, pi) => (
                                                    <span key={pi} className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-white/30 uppercase tracking-widest border border-white/5">
                                                        {pp}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {project.activeTab === 'market' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* SWOT Analysis */}
                        <div className="lg:col-span-12 glass-card rounded-[2.5rem] p-8 border border-white/5">
                            <div className="flex items-center gap-3 mb-12">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">SWOT Matrix</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 rounded-[32px] overflow-hidden border border-white/5">
                                {[
                                    { label: 'Strengths', data: project.swot.strengths, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
                                    { label: 'Weaknesses', data: project.swot.weaknesses, color: 'text-red-400', bg: 'bg-red-500/5' },
                                    { label: 'Opportunities', data: project.swot.opportunities, color: 'text-blue-400', bg: 'bg-blue-500/5' },
                                    { label: 'Threats', data: project.swot.threats, color: 'text-orange-400', bg: 'bg-orange-500/5' }
                                ].map((box, i) => (
                                    <div key={i} className={cn("p-10", box.bg)}>
                                        <h4 className={cn("text-xs font-black uppercase tracking-[0.3em] mb-6", box.color)}>{box.label}</h4>
                                        <ul className="space-y-4">
                                            {box.data.length === 0 ? (
                                                <li className="text-[10px] text-white/10 uppercase tracking-widest italic">Data Pending Synthesis</li>
                                            ) : (
                                                box.data.map((item, idx) => (
                                                    <li key={idx} className="flex gap-3 text-sm text-white/70 italic leading-relaxed">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", box.color.replace('text', 'bg'))}></div>
                                                        {item}
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Positioning & Value Prop */}
                        <div className="lg:col-span-12 glass-card rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                                <Compass className="w-64 h-64" />
                            </div>
                            
                            <div className="relative z-10 space-y-12">
                                <div className="space-y-4 max-w-2xl">
                                    <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-[0.4em]">Core Value Proposition</h4>
                                    <p className="text-3xl font-black text-white italic leading-tight uppercase tracking-tighter">
                                        {project.positioning.valueProp || "Architecture in progress..."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <h5 className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></div>
                                            Competitive Gaps
                                        </h5>
                                        <div className="space-y-3">
                                            {(project.positioning?.competitorGaps || []).map((gap, i) => (
                                                <div key={i} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/60 italic font-medium">
                                                    {gap}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h5 className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Monetization / Pricing
                                        </h5>
                                        <div className="p-8 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                                            <p className="text-xl font-black text-white uppercase italic tracking-tight">{project.positioning.targetPricing || "TBD"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {project.activeTab === 'architecture' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Business Model Canvas */}
                    <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                                <Layers className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Business Model Canvas</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* Key Partners */}
                            <div className="md:row-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest">Key Partners</h4>
                                <ul className="space-y-2">
                                     {(project.canvas?.keyPartners || []).map((p, i) => <li key={i} className="text-[11px] text-white/50 italic leading-relaxed">• {p}</li>)}
                                </ul>
                            </div>
                            
                            <div className="md:col-span-2 space-y-4">
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                    <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest">Key Activities</h4>
                                    <ul className="space-y-2">
                                        {(project.canvas?.keyActivities || []).map((p, i) => <li key={i} className="text-[11px] text-white/50 italic leading-relaxed">• {p}</li>)}
                                    </ul>
                                </div>
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                    <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest">Value Propositions</h4>
                                    <ul className="space-y-2">
                                        {(project.canvas?.valueProps || []).map((p, i) => <li key={i} className="text-[11px] text-white/50 italic leading-relaxed font-bold">• {p}</li>)}
                                    </ul>
                                </div>
                            </div>

                            <div className="md:col-span-1 space-y-4">
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                    <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest">Relations</h4>
                                    <ul className="space-y-2">
                                        {(project.canvas?.customerRelations || []).map((p, i) => <li key={i} className="text-[11px] text-white/50 italic">• {p}</li>)}
                                    </ul>
                                </div>
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                    <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest">Channels</h4>
                                    <ul className="space-y-2">
                                        {(project.canvas?.channels || []).map((p, i) => <li key={i} className="text-[11px] text-white/50 italic">• {p}</li>)}
                                    </ul>
                                </div>
                            </div>

                            <div className="md:row-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest">Segments</h4>
                                <ul className="space-y-2">
                                    {(project.canvas?.segments || []).map((p, i) => <li key={i} className="text-[11px] text-white/50 italic">• {p}</li>)}
                                </ul>
                            </div>

                            <div className="md:col-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest">Cost Structure</h4>
                                <ul className="space-y-2">
                                    {(project.canvas?.costStructure || []).map((p, i) => <li key={i} className="text-[11px] text-white/50 italic leading-relaxed">• {p}</li>)}
                                </ul>
                            </div>
                            <div className="md:col-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest">Revenue Streams</h4>
                                <ul className="space-y-2">
                                    {(project.canvas?.revenueStreams || []).map((p, i) => <li key={i} className="text-[11px] text-white/50 italic leading-relaxed">• {p}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Competitor Battle Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(project.battleCards || []).map((card, idx) => (
                            <div key={idx} className="glass-card rounded-[2.5rem] p-8 border border-white/5 overflow-hidden group">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{card.competitor}</h4>
                                    <div className="bg-red-500/10 text-red-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-red-500/20">Competitor</div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 block">The Kill Shot (Our Advantage)</label>
                                        <p className="text-sm font-black text-[var(--color-accent)] italic bg-[var(--color-accent)]/5 p-4 rounded-xl border border-[var(--color-accent)]/10">{card.killShot}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/[0.02] rounded-2xl">
                                            <label className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest mb-1 block">Their Strengths</label>
                                            <p className="text-[11px] text-white/50 italic">{card.strengths}</p>
                                        </div>
                                        <div className="p-4 bg-white/[0.02] rounded-2xl">
                                            <label className="text-[8px] font-black text-red-500/50 uppercase tracking-widest mb-1 block">Their Weaknesses</label>
                                            <p className="text-[11px] text-white/50 italic">{card.weaknesses}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {project.activeTab === 'roadmap' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="glass-card rounded-[2.5rem] p-10 border border-white/5">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <Map className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Strategic Growth Roadmap</h3>
                        </div>

                        <div className="space-y-8">
                            {project.roadmap.length === 0 ? (
                                <div className="py-24 text-center text-white/20 italic text-sm">Forge roadmap through full synthesis</div>
                            ) : (
                                project.roadmap.map((step, i) => (
                                    <div key={i} className="relative pl-12 group">
                                        {/* Connector Line */}
                                        {i < project.roadmap.length - 1 && (
                                            <div className="absolute left-5 top-10 bottom-0 w-[2px] bg-white/5 group-hover:bg-[var(--color-accent)]/20 transition-colors"></div>
                                        )}
                                        
                                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 group-hover:scale-110 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all">
                                            0{i+1}
                                        </div>

                                        <div className="space-y-6">
                                            <h4 className="text-xl font-black text-white uppercase italic tracking-widest">{step.phase}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(step.tasks || []).map((task, ti) => (
                                                    <div key={ti} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group/task hover:bg-white/5 transition-all">
                                                        <div className="w-5 h-5 rounded border border-white/10 flex items-center justify-center bg-white/5 text-transparent group-hover/task:text-[var(--color-accent)] group-hover/task:border-[var(--color-accent)]/50 transition-all">
                                                            <Sparkles className="w-3 h-3" />
                                                        </div>
                                                        <span className="text-xs text-white/50 font-medium italic">{task}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {project.activeTab === 'pitch' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {project.pitchDeck.length === 0 ? (
                            <div className="lg:col-span-2 py-32 glass-card rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 italic">
                                <Presentation className="w-12 h-12 mb-4" />
                                <p>Shed light on your startup with a neural pitch deck synthesis</p>
                            </div>
                        ) : (
                            project.pitchDeck.map((slide, idx) => (
                                <div key={idx} className="glass-card rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group hover:border-[var(--color-accent)]/30 transition-all">
                                    <div className="absolute top-0 right-0 p-8 text-[60px] font-black text-white/[0.03] pointer-events-none group-hover:text-[var(--color-accent)]/5 transition-colors">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <h4 className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-[0.4em] mb-2">{slide.slide}</h4>
                                        <div className="text-xl font-black text-white italic leading-relaxed uppercase tracking-tighter markdown-body">
                                            {slide.content}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {project.activeTab === 'posts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(project.ideas || []).map((idea, idx) => (
                        <div key={idea.id} className="glass-card rounded-[2rem] overflow-hidden flex flex-col border border-white/5 group hover:border-[var(--color-accent)]/30 transition-all shadow-2xl animate-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="aspect-[3/4] bg-black/40 relative overflow-hidden flex items-center justify-center">
                                {idea.isLoadingImage ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-accent)]"></div>
                                        <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Generating 3:4 Visual...</span>
                                    </div>
                                ) : idea.image ? (
                                    <div className="w-full h-full relative group/img">
                                        <img src={`data:${idea.image.mimeType};base64,${idea.image.base64}`} alt="Post Visual" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleDownload(idea.image!, `Post-${idx+1}`, '2k')}
                                                className="p-3 bg-white text-black rounded-full hover:bg-[var(--color-accent)] hover:text-white transition-all transform hover:scale-110 shadow-xl"
                                                title="Download 2K"
                                            >
                                                <span className="text-[10px] font-black">2K</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDownload(idea.image!, `Post-${idx+1}`, '4k')}
                                                className="p-3 bg-white text-black rounded-full hover:bg-[var(--color-accent)] hover:text-white transition-all transform hover:scale-110 shadow-xl"
                                                title="Download 4K"
                                            >
                                                <span className="text-[10px] font-black">4K</span>
                                            </button>
                                            <button 
                                                onClick={() => onGenerateIdeaImage(idea.id)}
                                                className="p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all transform hover:scale-110 border border-white/10"
                                                title="Regenerate"
                                            >
                                                <Zap className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 px-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                            <Sparkles className="w-6 h-6 text-white/20" />
                                        </div>
                                        <button 
                                            onClick={() => onGenerateIdeaImage(idea.id)}
                                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-colors uppercase tracking-widest border border-white/10"
                                        >
                                            Forge Image
                                        </button>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white/80 border border-white/10">
                                    POST 0{idx + 1}
                                </div>
                            </div>

                            <div className="p-6 flex flex-col gap-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-[var(--color-accent)] uppercase tracking-widest">Caption ({project.dialect})</label>
                                    </div>
                                    <textarea
                                        value={idea.caption}
                                        onChange={(e) => updateIdea(idea.id, 'caption', e.target.value)}
                                        className="w-full bg-black/20 rounded-xl p-3 text-sm text-white/90 border border-white/5 focus:border-[var(--color-accent)]/50 focus:ring-0 resize-none suggestions-scrollbar h-24"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Design Hook / Text</label>
                                        <input
                                            value={idea.tov}
                                            onChange={(e) => updateIdea(idea.id, 'tov', e.target.value)}
                                            className="w-full bg-black/20 rounded-xl px-3 py-2 text-[11px] text-white/70 border border-white/5"
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end">
                                        <div className="flex gap-1.5 h-full pt-1">
                                            <button 
                                                onClick={() => handleDownload(idea.image!, `Post-${idx+1}`, '2k')}
                                                disabled={!idea.image || isDownloading === `Post-${idx+1}-2k`}
                                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black rounded-lg transition-all text-white/60 disabled:opacity-20 flex items-center justify-center"
                                            >
                                                {isDownloading === `Post-${idx+1}-2k` ? '...' : '2K'}
                                            </button>
                                            <button 
                                                onClick={() => handleDownload(idea.image!, `Post-${idx+1}`, '4k')}
                                                disabled={!idea.image || isDownloading === `Post-${idx+1}-4k`}
                                                className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-[10px] font-black rounded-lg transition-all text-white disabled:opacity-20 flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/20"
                                            >
                                                {isDownloading === `Post-${idx+1}-4k` ? '...' : '4K'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Visual Scenario (AI Prompt)</label>
                                    <textarea
                                        value={idea.scenario}
                                        onChange={(e) => updateIdea(idea.id, 'scenario', e.target.value)}
                                        className="w-full bg-black/10 rounded-xl px-3 py-2 text-[10px] text-white/50 border border-dashed border-white/10 focus:border-white/30 focus:ring-0 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {project.activeTab === 'history' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Campaign Archives</h3>
                            <p className="text-xs text-white/30 font-black uppercase tracking-widest">History of Neural Strategies</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allProjects.map((p, i) => (
                            <div
                                key={p.id}
                                onClick={() => onSelectProject?.(i)}
                                className={cn(
                                    "glass-card rounded-[40px] p-8 border cursor-pointer transition-all relative overflow-hidden group",
                                    project.id === p.id ? "border-[var(--color-accent)] ring-4 ring-[var(--color-accent)]/10" : "border-white/5 hover:border-white/20"
                                )}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-white/20">
                                        {String(i + 1).padStart(2, '0')}
                                    </div>
                                    <div className="flex -space-x-2">
                                        {(p.productImages || []).slice(0, 3).map((img, imgIdx) => (
                                            <img 
                                                key={imgIdx}
                                                src={`data:${img.mimeType};base64,${img.base64}`}
                                                className="w-8 h-8 rounded-full border-2 border-black object-cover"
                                                alt="Ref"
                                            />
                                        ))}
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                                    {p.prompt || 'Untitled Campaign'}
                                </h4>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">
                                    <Globe className="w-3 h-3" /> {p.targetMarket}
                                </div>
                                
                                <div className="flex justify-between items-center mt-6">
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn("w-2 h-2 rounded-full", p.ideas.length > 0 ? "bg-emerald-500" : "bg-white/10")}></div>
                                        <span className="text-[9px] font-black text-white/20 uppercase">{p.ideas.length} Posts</span>
                                    </div>
                                    {project.id === p.id && (
                                        <div className="bg-[var(--color-accent)] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Active</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        <button 
                            onClick={() => {
                                const addBtn = document.querySelector('[aria-label="Add project"]');
                                if (addBtn instanceof HTMLElement) addBtn.click();
                            }}
                            className="glass-card rounded-[40px] p-8 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-white/30 hover:bg-white/[0.02] transition-all group min-h-[220px]"
                        >
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-white/20 group-hover:text-white" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black text-white/40 uppercase tracking-widest">New Strategic Plan</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {project.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center font-bold">
                    {project.error}
                </div>
            )}
        </main>
    );
};

export default PlanStudio;
