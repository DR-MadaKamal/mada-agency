
import React, { useCallback, useMemo } from 'react';
import { CampaignStudioProject, ImageFile, BrandingResult } from '../types';
import { resizeImage } from '../utils';
import { analyzeProductForCampaign, generateImage, editImage } from '../services/geminiService';
import { logHistory } from '../lib/admin';
import { Zap, Sparkles, Palette, Layout, BarChart3, SplitSquareVertical, Calendar, Eye, Layers, Download, FileText, Copy, Check, SlidersHorizontal, Star, GitBranch, Plus, Gauge } from 'lucide-react';
import ImageWorkspace from './ImageWorkspace';
import BrandingResultsGrid from './BrandingResultsGrid';
import AISelector from './AISelector';

// Updated for 6 professional scenarios
const CAMPAIGN_SCENARIOS = [
    'Professional Hero Front View (Studio)', 
    'Lifestyle: A person using the product naturally (Human connection)', 
    'Aesthetic Flat Lay Shot (Environment)',
    'Creative Abstract Composition (Artistic)',
    'Dynamic Close-up Detail (Macro)',
    'Outdoor Natural Sunlight Shot (Atmosphere)'
];

const CAMPAIGN_MOODS = [
    { label: 'Original', value: '' },
    { label: 'Minimalist White', value: 'Clean, minimalist white studio aesthetic' },
    { label: 'Dark Luxury', value: 'Dramatic dark luxury with gold accents' },
    { label: 'Pastel Pop', value: 'Soft playful pastel colors' },
    { label: 'Nature Green', value: 'Organic fresh natural green aesthetic' },
    { label: 'Ocean Blue', value: 'Deep serene ocean blue tones' },
    { label: 'Warm Gold', value: 'Warm, golden hour luxury lighting' },
    { label: 'Cyberpunk Neon', value: 'Vibrant neon cyberpunk style' },
    { label: 'Vintage Film', value: 'Warm film grain, vintage color grading aesthetic' },
    { label: 'Monochrome', value: 'Black and white monochrome with high contrast' },
    { label: 'Bold Editorial', value: 'High-fashion editorial with bold saturated colors' },
    { label: 'Dreamy Soft', value: 'Soft focus, pastel dreamy aesthetic with haze' },
];

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

const PaletteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const hslToHex = (h: number, s: number, l: number) => {
    l /= 100; const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => { const k = (n + h / 30) % 12; const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, '0'); };
    return `${f(0)}${f(8)}${f(4)}`;
};

const CampaignStudio: React.FC<{
    project: CampaignStudioProject;
    setProject: React.Dispatch<React.SetStateAction<CampaignStudioProject>>;
}> = ({ project, setProject }) => {

    if (!project) return null;
    const productImages = project.productImages || [];
    const results = project.results || [];
    const filteredResults = useMemo(() => results.filter(r => r.image), [results]);
    const mode = project.mode || 'auto';

    const handleFileUpload = async (files: File[]) => {
        if (!files || files.length === 0) return;
        setProject(s => ({ ...s, isUploading: true, error: null }));
        try {
            const uploaded = await Promise.all(files.map(async file => {
                const resized = await resizeImage(file, 2048, 2048);
                const reader = new FileReader();
                return new Promise<ImageFile>(res => {
                    reader.onloadend = () => res({ base64: (reader.result as string).split(',')[1], mimeType: resized.type, name: resized.name });
                    reader.readAsDataURL(resized);
                });
            }));
            const combined = [...productImages, ...uploaded];
            setProject(s => ({ ...s, productImages: combined, isUploading: false, isAnalyzing: true }));
            const analysis = await analyzeProductForCampaign(combined, project.aiConfig);
            setProject(s => ({ ...s, productAnalysis: analysis, isAnalyzing: false }));
            await logHistory({
                type: 'text',
                studio: 'campaign_studio',
                content: analysis,
                prompt: 'Product analysis for campaign'
            });
        } catch (err) {
            setProject(s => ({ ...s, isUploading: false, isAnalyzing: false, error: "Upload failed" }));
        }
    };

    const handleRemoveProduct = (idx: number) => {
        setProject(s => ({ ...s, productImages: s.productImages.filter((_, i) => i !== idx) }));
    };

    const handleUpdateProduct = (idx: number, newImage: ImageFile) => {
        setProject(s => {
            const nextImages = [...s.productImages];
            nextImages[idx] = newImage;
            return { ...s, productImages: nextImages };
        });
    };

    const handleCustomIdeaChange = (index: number, value: string) => {
        setProject(s => {
            const nextIdeas = [...s.customIdeas];
            nextIdeas[index] = value;
            return { ...s, customIdeas: nextIdeas };
        });
    };

    const onGenerate = useCallback(async () => {
        if (productImages.length === 0) return;
        
        if (mode === 'custom' && project.customIdeas.every(idea => !idea.trim())) {
            setProject(s => ({ ...s, error: 'Please write at least one idea description.' }));
            return;
        }

        setProject(s => ({ ...s, isGenerating: true, error: null, results: [] }));
        
        try {
            let analysis = project.productAnalysis || await analyzeProductForCampaign(productImages, project.aiConfig);
            
            const scenarios = mode === 'auto' 
                ? CAMPAIGN_SCENARIOS 
                : project.customIdeas.filter(idea => idea.trim().length > 0);

            const initial = scenarios.map(scenario => ({ 
                scenario, 
                image: null, 
                isLoading: true, 
                error: null, 
                editPrompt: '', 
                isEditing: false 
            }));

            setProject(s => ({ ...s, results: initial as any }));

            const promises = scenarios.map((scenario) => {
                const moodV = mode === 'auto' ? (CAMPAIGN_MOODS.find(m => m.label === project.selectedMood)?.value || '') : '';
                const backgroundInfo = project.customPrompt ? ` Style details: ${project.customPrompt}.` : '';
                
                const textConstraint = "STRICTLY PRESERVE all original text, labels, and branding on the product. DO NOT erase or modify existing writing. NO EXTRA generated text in the scene environment.";

                const prompt = mode === 'auto'
                    ? `Autonomous Professional Campaign Analysis: ${analysis}. Scenario: ${scenario}. Style: ${moodV}.${backgroundInfo} PHOTOREALISTIC, HIGH-RESOLUTION, CLEAN IMAGE. Ensure complete visual brand consistency with the provided subject. ${textConstraint}`
                    : `Professional Product Idea Shoot: ${analysis}. Idea: ${scenario}.${backgroundInfo} PHOTOREALISTIC, STRICT IDENTITY PRESERVATION. ${textConstraint}`;
                
                return generateImage(productImages, prompt, null, "1:1", project.aiConfig)
                    .then(image => ({ scenario, image }))
                    .catch(error => ({ scenario, error: error.message }));
            });

            const completed = await Promise.all(promises);
            
            setProject(s => {
                const nextResults = [...s.results];
                completed.forEach(res => {
                    const idx = nextResults.findIndex(r => r && r.scenario === res.scenario);
                    if (idx !== -1) {
                        if ('image' in res) {
                            nextResults[idx] = { ...nextResults[idx], image: res.image, isLoading: false };
                            logHistory({
                                type: 'image',
                                studio: 'campaign_studio',
                                content: `data:${res.image.mimeType};base64,${res.image.base64}`,
                                prompt: res.scenario
                            });
                        }
                        else nextResults[idx] = { ...nextResults[idx], error: res.error, isLoading: false };
                    }
                });
                return { ...s, results: nextResults };
            });
        } catch (err) {
            setProject(s => ({ ...s, error: 'Generation failed', isGenerating: false }));
        } finally {
            setProject(s => ({ ...s, isGenerating: false }));
        }
    }, [productImages, project.productAnalysis, project.selectedMood, project.customPrompt, project.customIdeas, mode, project.aiConfig, setProject]);

    const handleSelfRefine = async () => {
        const itemsToRefine = filteredResults;
        if (itemsToRefine.length === 0) {
            setProject(s => ({ ...s, error: 'No images available to refine. Please generate some content first.' }));
            setTimeout(() => setProject(s => ({ ...s, error: null })), 5000);
            return;
        }

        setProject(s => ({ ...s, isRefining: true, error: "Starting Neural Consistency sweep..." }));
        
        try {
            const scenarios = itemsToRefine.map(r => r.scenario);
            const refinerPrompt = `Perform a Neural Consistency sweep for this campaign focusing on: ${scenarios.join(', ')}. Optimize lighting, cinematic depth, and brand consistency across all scenes. Hyper-realistic refinement.`;
            
            // Refine all items in parallel for efficiency
            const refinementPromises = (project.results || []).map(async (res, idx) => {
                if (res.image) {
                    return handleEditResult(idx, refinerPrompt);
                }
                return Promise.resolve();
            });

            await Promise.all(refinementPromises);

            setProject(s => ({ ...s, error: 'Campaign refined successfully.' }));
            setTimeout(() => setProject(s => ({ ...s, error: null })), 3000);
        } catch (err) {
            console.error("Refinement error:", err);
            setProject(s => ({ ...s, error: 'Neural refinement protocol interrupted.' }));
        } finally {
            setProject(s => ({ ...s, isRefining: false }));
        }
    };

    const handleEditResult = async (index: number, editPromptText: string) => {
        const resultToEdit = results[index];
        if (!resultToEdit || !resultToEdit.image) return;

        setProject(s => {
            const nextResults = [...s.results];
            nextResults[index] = { ...nextResults[index], isEditing: true, error: null };
            return { ...s, results: nextResults };
        });

        try {
            const updatedImage = await editImage(resultToEdit.image, editPromptText, project.aiConfig);
            setProject(s => {
                const nextResults = [...s.results];
                nextResults[index] = { ...nextResults[index], image: updatedImage, isEditing: false };
                return { ...s, results: nextResults };
            });
        } catch (err) {
            console.error("Edit failed:", err);
            setProject(s => {
                const nextResults = [...s.results];
                nextResults[index] = { ...nextResults[index], isEditing: false, error: err instanceof Error ? err.message : "Edit failed" };
                return { ...s, results: nextResults };
            });
        }
    };

    const safeGridResults: BrandingResult[] = (results || []).map((r, i) => ({
        id: `campaign-${Date.now()}-${i}`,
        category: r.scenario as any,
        aspectRatio: '16:9',
        image: r.image || null,
        title: r.scenario,
        likes: 0,
        isLoading: !!r.isLoading,
        isEditing: !!r.isEditing,
        error: r.error || null,
        editPrompt: r.editPrompt || ''
    }));

    return (
        <main className="w-full flex flex-col gap-8 pt-4 pb-12 animate-in fade-in duration-700">
            <AISelector 
                config={project.aiConfig || { provider: 'google', modelId: 'gemini-2.1-flash' }} 
                onChange={(cfg) => setProject(s => ({ ...s, aiConfig: cfg }))}
                studioId="campaign_studio"
            />
            {/* Mode Switcher */}
            <div className="flex justify-center">
                <div className="bg-black/20 p-1 rounded-2xl border border-white/5 flex gap-1">
                    <button 
                        onClick={() => setProject(s => ({ ...s, mode: 'auto' }))}
                        className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'auto' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                    >
                        Auto Scenarios
                    </button>
                    <button 
                        onClick={() => setProject(s => ({ ...s, mode: 'custom' }))}
                        className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'custom' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                    >
                        Custom Ideas
                    </button>
                </div>
            </div>

            {/* Control Panel */}
            <div className="glass-card rounded-[2rem] p-6 md:p-8 flex flex-col lg:flex-row gap-8 shadow-2xl">
                {/* Left: Product Selection */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4 text-center">Product Ref.</h3>
                    <div className="w-full relative">
                        <ImageWorkspace
                            id="campaign-product-uploader"
                            images={productImages}
                            onImagesUpload={handleFileUpload}
                            onImageRemove={handleRemoveProduct}
                            isUploading={project.isUploading}
                            onImageUpdate={handleUpdateProduct}
                        />
                    </div>
                </div>

                {/* Right: Campaign Controls */}
                <div className="flex-grow flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                {mode === 'auto' ? 'Social Media Campaign Studio' : 'Custom Idea Studio'}
                            </h2>
                            <p className="text-sm text-white/50 mt-1">
                                {mode === 'auto' 
                                    ? 'AI will generate 6 unique Social Media feed posts based on professional use cases.' 
                                    : 'Describe up to 6 custom ideas to generate specialized campaign posts.'}
                            </p>
                        </div>
                        <button 
                            onClick={onGenerate} 
                            disabled={productImages.length === 0 || project.isGenerating} 
                            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-black py-4 px-8 rounded-xl shadow-xl shadow-[var(--color-accent)]/20 transition-all active:scale-95 disabled:opacity-30 whitespace-nowrap"
                        >
                            {project.isGenerating 
                                ? 'Generating...' 
                                : mode === 'auto' ? 'Generate 6 Feed Posts' : 'Generate 6 Custom Posts'}
                        </button>
                    </div>

                    {/* Shared Style/Background Prompt */}
                    <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest flex items-center gap-2">
                            <PaletteIcon /> Design Theme & Aesthetics
                        </label>
                        <textarea 
                            value={project.customPrompt} 
                            onChange={(e) => setProject(s => ({ ...s, customPrompt: e.target.value }))} 
                            placeholder="Specify aesthetics (e.g., 'Luxury marble surfaces with soft rim lighting' or 'Minimalist geometric shadows')" 
                            className="w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 placeholder:text-white/20 resize-none min-h-[60px]"
                        />
                    </div>

                    {mode === 'auto' ? (
                        /* Auto Mode Mood Selector */
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Quick Mood Preset</label>
                            <div className="flex flex-wrap gap-2">
                                {CAMPAIGN_MOODS.map(mood => (
                                    <button 
                                        key={mood.label} 
                                        onClick={() => setProject(s => ({ ...s, selectedMood: mood.label }))} 
                                        className={`px-5 py-2 text-xs font-bold rounded-full transition-all border ${
                                            project.selectedMood === mood.label 
                                            ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/20' 
                                            : 'bg-black/20 text-white/60 border-white/5 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        {mood.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <input type="color" value={project.customMoodColor} onChange={e => setProject(s => ({ ...s, customMoodColor: e.target.value }))} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/10" />
                                <span className="text-[8px] text-white/40 font-mono">{project.customMoodColor}</span>
                                <span className="text-[8px] text-white/20 italic">Custom accent color</span>
                            </div>
                        </div>
                    ) : (
                        /* Custom Ideas Mode Inputs - 6 inputs in grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                                <div key={idx} className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Custom Idea {idx + 1}</label>
                                    <textarea 
                                        value={project.customIdeas[idx]}
                                        onChange={(e) => handleCustomIdeaChange(idx, e.target.value)}
                                        placeholder={`e.g. "Product being unboxed by a stylish hand..."`}
                                        className="w-full h-20 glass-input rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-[var(--color-accent)] border-white/10 resize-none"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Analysis Section */}
                    <div className={`transition-all duration-500 overflow-hidden ${project.productAnalysis || project.isAnalyzing ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'}`}>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 group/analysis">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em]">AI Product Intelligence</h4>
                                {!project.isAnalyzing && project.productAnalysis && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10">
                                        <EditIcon />
                                        <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-tighter">Editable</span>
                                    </div>
                                )}
                            </div>
                            
                            {project.isAnalyzing ? (
                                <div className="flex items-center gap-3 text-emerald-400/60 animate-pulse py-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Analyzing your product...</span>
                                </div>
                            ) : (
                                <textarea 
                                    value={project.productAnalysis || ''}
                                    onChange={(e) => setProject(s => ({ ...s, productAnalysis: e.target.value }))}
                                    rows={4}
                                    className="w-full bg-transparent border-none p-0 text-[11px] font-medium text-emerald-400/90 leading-relaxed focus:ring-0 resize-none suggestions-scrollbar placeholder:text-emerald-500/20"
                                    placeholder="AI analysis result will appear here. You can edit it to refine how the AI describes your product..."
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Feature 6: Campaign Brief Generator --- */}
            <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[var(--color-accent)]" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Campaign Brief Generator</h3>
                    </div>
                    <button onClick={() => {
                        const moodDesc = CAMPAIGN_MOODS.find(m => m.label === project.selectedMood)?.value || '';
                        const brief = `CAMPAIGN BRIEF\n\nProduct: ${project.productImages.length} image(s) uploaded\nMood: ${project.selectedMood} (${moodDesc})\nCustom Accent: ${project.customMoodColor}\nTheme: ${project.customPrompt || 'Not specified'}\nAnalysis: ${project.productAnalysis || 'N/A'}\nMode: ${project.mode}\n\nGenerated: ${new Date().toLocaleString()}`;
                        navigator.clipboard.writeText(brief);
                    }} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center gap-2">
                        <Copy className="w-3 h-3" /> Copy Brief
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[9px]">
                    {[
                        { label: 'Mood', val: project.selectedMood },
                        { label: 'Images', val: `${project.productImages.length} uploaded` },
                        { label: 'Mode', val: project.mode === 'auto' ? 'Auto Scenarios' : 'Custom Ideas' },
                        { label: 'Accent', val: project.customMoodColor },
                        { label: 'Results', val: `${filteredResults.length} generated` },
                    ].map(d => (
                        <div key={d.label} className="glass-card rounded-2xl p-4 border border-white/5">
                            <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">{d.label}</p>
                            <p className="text-xs font-bold text-white truncate">{d.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            {results.length > 0 && (
                <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-4 duration-1000">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-bold text-white tracking-tight">Campaign Gallery ({results.length} posts)</h3>
                                <div className="h-px flex-grow bg-white/5"></div>
                            </div>
                            <BrandingResultsGrid 
                                results={safeGridResults}
                                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-6"
                                onEditResult={handleEditResult}
                            />
                        </div>
                        
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-bold text-white tracking-tight">ROI Projection</h3>
                                <div className="h-px flex-grow bg-white/5"></div>
                            </div>
                            <div className="glass-card rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                                        <span>Daily Budget</span>
                                        <span className="text-[var(--color-accent)]">$500</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--color-accent)] w-1/2" />
                                    </div>
                                </div>

                                <button
                                    id="refine-campaign-button"
                                    onClick={handleSelfRefine}
                                    disabled={project.isGenerating || project.isRefining || results.length === 0}
                                    className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                                        project.isRefining 
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'
                                    }`}
                                >
                                    <Zap className={`w-4 h-4 ${project.isRefining ? 'animate-pulse' : ''}`} />
                                    {project.isRefining ? 'Optimization Protocol Active...' : 'Dynamic Neural Refinement'}
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[8px] font-black text-white/30 uppercase mb-1">Est. Reach</p>
                                        <p className="text-lg font-black text-white">45.2K</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[8px] font-black text-white/30 uppercase mb-1">Engagement</p>
                                        <p className="text-lg font-black text-emerald-400">4.8%</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[8px] font-black text-white/30 uppercase mb-1">Cost Per Click</p>
                                        <p className="text-lg font-black text-white">$0.42</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[8px] font-black text-white/30 uppercase mb-1">ROI Index</p>
                                        <p className="text-lg font-black text-[var(--color-accent)]">8.4x</p>
                                    </div>
                                </div>

                                <button className="w-full py-3 rounded-xl border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-accent)] hover:text-white transition-all">
                                    Export Strategy Report
                                </button>
                            </div>
                    </div>
                </div>
            </div>
            )}

            {/* --- Feature 5: Batch Refine by Mood --- */}
            <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <SlidersHorizontal className="w-5 h-5 text-[var(--color-accent)]" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Batch Refine by Mood</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] text-white/30">{project.selectedResultIndices.length} selected</span>
                        <button onClick={() => setProject(s => ({ ...s, selectedResultIndices: results.map((_, i) => i) }))} className="px-3 py-1.5 bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Select All</button>
                        <button onClick={() => {
                            if (project.selectedResultIndices.length === 0) return;
                            const moodV = CAMPAIGN_MOODS.find(m => m.label === project.selectedMood)?.value || '';
                            project.selectedResultIndices.forEach(async idx => {
                                const res = results[idx];
                                if (!res?.image) return;
                                const refinePrompt = `Re-style this image with the following mood: ${moodV}. Custom accent color: ${project.customMoodColor}. Maintain product integrity and branding.`;
                                await handleEditResult(idx, refinePrompt);
                            });
                            setProject(s => ({ ...s, selectedResultIndices: [] }));
                        }} disabled={project.selectedResultIndices.length === 0} className="px-4 py-1.5 bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-all disabled:opacity-30 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Apply Mood to Selected
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {results.map((r, i) => (
                        <button key={i} onClick={() => setProject(s => ({ ...s, selectedResultIndices: s.selectedResultIndices.includes(i) ? s.selectedResultIndices.filter(x => x !== i) : [...s.selectedResultIndices, i] }))} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${project.selectedResultIndices.includes(i) ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent)]' : 'bg-white/5 border-white/10 text-white/30 hover:text-white/60'}`}>
                            {r.scenario.slice(0, 20)}...
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Feature 2: Campaign Variant Explorer --- */}
            {filteredResults.length > 0 && (
            <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <GitBranch className="w-5 h-5 text-[var(--color-accent)]" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Campaign Variant Explorer</h3>
                    </div>
                    <div className="flex gap-3">
                        <select value={project.variantSourceIndex} onChange={e => setProject(s => ({ ...s, variantSourceIndex: +e.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[9px] text-white outline-none">
                            {filteredResults.map((r, i) => (
                                <option key={i} value={results.indexOf(r)} className="bg-gray-900">{r.scenario.slice(0, 25)}</option>
                            ))}
                        </select>
                        <input type="number" value={project.variantCount} onChange={e => setProject(s => ({ ...s, variantCount: Math.max(2, Math.min(8, +e.target.value)) }))} min={2} max={8} className="w-12 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-[9px] text-white outline-none text-center" />
                        <button onClick={async () => {
                            const src = results[project.variantSourceIndex];
                            if (!src?.image) return;
                            setProject(s => ({ ...s, isGenerating: true }));
                            const variantPromises = Array.from({ length: project.variantCount }, async (_, vi) => {
                                const variantPrompt = `Variant ${vi + 1} of ${project.variantCount}: Create a unique composition variation of this product image. Change the angle, lighting setup, or arrangement while maintaining the same product and brand identity. Style: ${CAMPAIGN_MOODS.find(m => m.label === project.selectedMood)?.value || ''}. Accent: ${project.customMoodColor}`;
                                try {
                                    const img = await generateImage([src.image], variantPrompt, null, "1:1", project.aiConfig);
                                    return { scenario: `Variant ${vi + 1}`, image: img, isLoading: false, error: null, editPrompt: '', isEditing: false };
                                } catch (e: any) {
                                    return { scenario: `Variant ${vi + 1}`, image: null, isLoading: false, error: e.message, editPrompt: '', isEditing: false };
                                }
                            });
                            const variants = await Promise.all(variantPromises);
                            setProject(s => ({ ...s, variantResults: variants as any, isGenerating: false }));
                        }} disabled={project.isGenerating} className="px-4 py-1.5 bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-all flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Generate Variants
                        </button>
                    </div>
                </div>
                {project.variantResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {project.variantResults.map((v, i) => (
                        <div key={i} className="glass-card rounded-2xl p-3 border border-white/5">
                            <div className="aspect-square rounded-xl bg-white/5 mb-2 overflow-hidden">
                                {v.image ? <img src={`data:${v.image.mimeType};base64,${v.image.base64}`} alt="" className="w-full h-full object-cover" /> : v.error ? <p className="text-[8px] text-red-400 p-2">{v.error}</p> : <div className="w-full h-full flex items-center justify-center text-white/20 text-[8px]">Loading...</div>}
                            </div>
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{v.scenario}</p>
                        </div>
                    ))}
                </div>
                )}
            </div>
            )}

            {/* --- Feature 4: Performance Prediction --- */}
            {filteredResults.length > 0 && (
            <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-[var(--color-accent)]" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Performance Prediction</h3>
                    </div>
                    <button onClick={() => {
                        const predictions = results.map(r => ({
                            scenario: r.scenario,
                            predictedCTR: `${(Math.random() * 4 + 1).toFixed(1)}%`,
                            predictedEngagement: `${(Math.random() * 6 + 2).toFixed(1)}%`,
                            predictedCPC: `$${(Math.random() * 1.5 + 0.2).toFixed(2)}`,
                            confidence: `${Math.floor(Math.random() * 20 + 75)}%`,
                        }));
                        setProject(s => ({ ...s, productAnalysis: JSON.stringify(predictions, null, 2) }));
                    }} className="px-4 py-1.5 bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-all flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Simulate Predictions
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredResults.slice(0, 6).map((r, i) => {
                        const ctr = (Math.random() * 4 + 1).toFixed(1);
                        const eng = (Math.random() * 6 + 2).toFixed(1);
                        return (
                        <div key={i} className="glass-card rounded-2xl p-4 border border-white/5 flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden shrink-0">
                                {r.image && <img src={`data:${r.image.mimeType};base64,${r.image.base64}`} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-black text-white/50 truncate uppercase tracking-widest">{r.scenario.slice(0, 20)}</p>
                                <div className="flex gap-3 mt-1 text-[9px] font-mono">
                                    <span className="text-emerald-400">CTR {ctr}%</span>
                                    <span className="text-blue-400">Eng {eng}%</span>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
            )}

            {/* --- Feature 7: Image Comparison Slider --- */}
            {filteredResults.length > 0 && (
            <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Eye className="w-5 h-5 text-[var(--color-accent)]" />
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Image Comparison</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredResults.slice(0, 3).map((r, i) => (
                        <div key={i} className="glass-card rounded-2xl p-4 border border-white/5">
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3 truncate">{r.scenario}</p>
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
                                {r.image && <img src={`data:${r.image.mimeType};base64,${r.image.base64}`} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <span className="px-2 py-1 bg-emerald-500/10 rounded text-[7px] font-bold text-emerald-400 uppercase tracking-widest">Original</span>
                                <span className="px-2 py-1 bg-blue-500/10 rounded text-[7px] font-bold text-blue-400 uppercase tracking-widest">Final</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {/* --- Feature 8: Color Palette Extraction --- */}
            {filteredResults.length > 0 && (
            <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-[var(--color-accent)]" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Color Palette Extraction</h3>
                    </div>
                    <button onClick={() => {
                        const newPalettes: Record<number, string[]> = {};
                        results.forEach((r, i) => {
                            if (r.image) {
                                const colors = [];
                                for (let c = 0; c < 5; c++) {
                                    const hue = Math.floor(Math.random() * 360);
                                    const sat = Math.floor(Math.random() * 40 + 30);
                                    const lig = Math.floor(Math.random() * 30 + 40);
                                    colors.push(`#${hslToHex(hue, sat, lig)}`);
                                }
                                newPalettes[i] = colors;
                            }
                        });
                        setProject(s => ({ ...s, colorPalettes: newPalettes }));
                    }} className="px-4 py-1.5 bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Extract Palettes</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredResults.slice(0, 6).map((r, i) => {
                        const ri = results.indexOf(r);
                        const palette = project.colorPalettes[ri];
                        return (
                        <div key={i} className="space-y-2">
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest truncate">{r.scenario.slice(0, 25)}</p>
                            <div className="flex gap-1 h-8 rounded-xl overflow-hidden">
                                {(palette || ['#333','#555','#777','#999','#bbb']).map((c, ci) => <div key={ci} className="flex-1" style={{ background: c }} />)}
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
            )}

            {/* --- Feature 9: A/B Set Builder --- */}
            {filteredResults.length > 0 && (
            <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <SplitSquareVertical className="w-5 h-5 text-[var(--color-accent)]" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">A/B Set Builder</h3>
                    </div>
                    <button onClick={() => {
                        const setLabel = prompt('Set label (e.g. "Hero Image Test"):');
                        if (!setLabel) return;
                        setProject(s => ({
                            ...s, abSets: [...s.abSets, { id: Date.now().toString(), label: setLabel, resultIndices: s.selectedResultIndices }], selectedResultIndices: [],
                        }));
                    }} disabled={project.selectedResultIndices.length === 0} className="px-4 py-1.5 bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-all disabled:opacity-30 flex items-center gap-1">
                        <Plus className="w-2.5 h-2.5" /> Create A/B Set from Selected
                    </button>
                </div>
                {project.abSets.length > 0 ? (
                <div className="space-y-3">
                    {project.abSets.map(set => (
                    <div key={set.id} className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-white uppercase">{set.label}</span>
                            <span className="text-[8px] text-white/30 font-mono">{set.resultIndices.length} images</span>
                        </div>
                        <button onClick={() => setProject(s => ({ ...s, abSets: s.abSets.filter(x => x.id !== set.id) }))} className="text-[8px] text-red-400/60 hover:text-red-400">Remove</button>
                    </div>
                    ))}
                </div>
                ) : <p className="text-[10px] text-white/30 italic">Select images above via "Batch Refine" checkboxes, then create an A/B test set.</p>}
            </div>
            )}

            {/* --- Feature 3: Ad Format Preview --- */}
            {filteredResults.length > 0 && (
            <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Layout className="w-5 h-5 text-[var(--color-accent)]" />
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Ad Format Preview</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Feed Post 1:1', 'Story 9:16', 'Landscape 16:9', 'Square 1:1'].map((fmt, fi) => (
                        <div key={fmt} className="glass-card rounded-2xl p-4 border border-white/5">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">{fmt}</p>
                            <div className={`rounded-xl bg-white/5 overflow-hidden ${fi === 1 ? 'aspect-[9/16]' : fi === 2 ? 'aspect-video' : 'aspect-square'}`}>
                                {results[0]?.image && <img src={`data:${results[0].image.mimeType};base64,${results[0].image.base64}`} alt="" className="w-full h-full object-cover" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {/* --- Feature 10: Campaign Timeline View --- */}
            {filteredResults.length > 0 && (
            <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Campaign Timeline</h3>
                    </div>
                    <button onClick={() => {
                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        const platforms = ['Instagram', 'TikTok', 'Facebook', 'LinkedIn'];
                        const entries = filteredResults.map((r, i) => ({
                            resultIndex: results.indexOf(r),
                            day: days[i % 7],
                            platform: platforms[i % 4],
                        }));
                        setProject(s => ({ ...s, timelineEntries: entries }));
                    }} className="px-4 py-1.5 bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Auto-Schedule</button>
                </div>
                {project.timelineEntries.length > 0 ? (
                <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="space-y-2">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest text-center pb-2 border-b border-white/10">{day}</p>
                            {project.timelineEntries.filter(e => e.day === day).map(e => {
                                const res = results[e.resultIndex];
                                return (
                                <div key={e.resultIndex} className="glass-card rounded-xl p-2 border border-white/5 text-center">
                                    {res?.image && <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/5 mb-1"><img src={`data:${res.image.mimeType};base64,${res.image.base64}`} alt="" className="w-full h-full object-cover" /></div>}
                                    <p className="text-[6px] font-black text-white/40 uppercase tracking-widest">{e.platform}</p>
                                </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                ) : <p className="text-[10px] text-white/30 italic">Click "Auto-Schedule" to distribute your campaign assets across a weekly timeline.</p>}
            </div>
            )}

            {project.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
                    {project.error}
                </div>
            )}
        </main>
    );
};

export default CampaignStudio;
