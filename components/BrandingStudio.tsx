
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useGlobalShortcuts } from '../lib/useGlobalShortcuts';
import { useToast } from '../lib/useToast';
import { ImageFile, BrandingStudioProject, BrandingResultCategory, AspectRatio } from '../types';
import { resizeImage } from '../utils';
import { 
    analyzeLogoForBranding, 
    generateImage, 
    generateBrandManual, 
    generateMissionVisionValues, 
    generateBrandPersona, 
    generateBrandStory, 
    generateCompetitorAnalysis,
    generateBrandStrategy,
    generateNeuralNaming,
    generateVisualIdentity
} from '../services/geminiService';
import { logHistory } from '../lib/admin';
import ImageWorkspace from './ImageWorkspace';
import BrandingResultsGrid from './BrandingResultsGrid';
import AISelector from './AISelector';
import { motion, AnimatePresence } from 'framer-motion';
import { ASPECT_RATIOS } from '../constants';
import { 
    Download, 
    Copy, 
    Check, 
    FileText, 
    Palette, 
    MessageSquare, 
    Type, 
    Target, 
    TrendingUp, 
    Camera, 
    Mic, 
    Layout, 
    Sparkles, 
    Briefcase, 
    Fingerprint, 
    Search, 
    Cpu, 
    Command,
    Globe,
    Layers,
    BookOpen,
    Zap,
    Plus,
    Users,
    Crosshair
} from 'lucide-react';
import { AILoadingOverlay } from '../lib/AILoadingOverlay';
import { CommentsOverlay } from './CommentsOverlay';
import { VersionTimeline } from './VersionTimeline';
import { ShareableLink } from './ShareableLink';
import { TemplatePicker } from './TemplatePicker';
import { BrandTools } from './BrandTools';
import { cn } from '../lib/utils';

const MOCKUP_CATEGORIES: BrandingResultCategory[] = [
    'Logo Construction Grid', 'Typography Showcase', 'Logo Color Variations', 'Monochrome Version',
    '3D Glass Logo', 'Business Card Mockup', '3D Glass App Icon', 'Creative Pen Mockup',
    'Merchandise (Tote Bag)', 'Pencil Sketch Logo', 'Notebook Mockup', 'Waving Flag Mockup',
    'Instagram Post Mockup', 'TikTok View Mockup', 'Letterhead Design', 'Email Signature'
];

const PERSONALITY_TRAITS = [
    'Modern', 'Luxury', 'Minimalist', 'Playful', 'Professional', 'Bold', 'Friendly', 'Technical', 'Artistic', 'Vintage'
];

const getPromptForCategory = (category: BrandingResultCategory, aspectRatio: AspectRatio, personality: string[]): string => {
    const aspectRatioRequirement = ` The final image must have a ${aspectRatio} aspect ratio.`;
    const styleContext = personality.length > 0 ? ` The visual style should be ${personality.join(', ')}.` : '';
    
    switch (category) {
        case 'Logo Construction Grid':
            return "Create a technical brand guideline image. Display the provided logo on a light grid, showing construction lines, proportions, and a clear space margin around it." + aspectRatioRequirement;
        case 'Typography Showcase':
            return "Create a brand typography specimen sheet. Analyze the font style used in the provided logo and display full English alphabet neatly on a minimalist background." + aspectRatioRequirement + styleContext;
        case 'Logo Color Variations':
            return "Create a brand guideline image showing logo color variations. Display four versions of the provided logo on different solid-colored backgrounds." + aspectRatioRequirement;
        case 'Monochrome Version':
            return 'A high-contrast, single-color (white) version of the provided logo, presented on a black background.' + aspectRatioRequirement;
        case '3D Glass Logo':
            return "Create a photorealistic 3D mockup of the provided logo rendered in glossy, translucent glass." + aspectRatioRequirement + styleContext;
        case 'Business Card Mockup':
            return "A photorealistic mockup of a premium business card featuring the provided logo on a high-end textured paper or marble background." + aspectRatioRequirement + styleContext;
        case '3D Glass App Icon':
            return "Create a photorealistic 3D app icon from the provided logo in glossy translucent glass." + aspectRatioRequirement + styleContext;
        case 'Creative Pen Mockup':
            return "A photorealistic mockup of a high-end elegant pen with the provided logo subtly engraved." + aspectRatioRequirement + styleContext;
        case 'Merchandise (Tote Bag)':
            return "A photorealistic lifestyle mockup of the provided logo printed on a high-quality canvas tote bag." + aspectRatioRequirement + styleContext;
        case 'Pencil Sketch Logo':
            return "Create a photorealistic artistic sketch of the provided logo as if hand-drawn with graphite pencil." + aspectRatioRequirement;
        case 'Notebook Mockup':
            return "A photorealistic mockup of a premium notebook with logo elegantly debossed on the cover." + aspectRatioRequirement + styleContext;
        case 'Waving Flag Mockup':
            return "A photorealistic mockup of the provided logo on a large flag waving gently against a clear sky." + aspectRatioRequirement;
        case 'Instagram Post Mockup':
            return "A professional Instagram square post template featuring the brand logo and aesthetic imagery aligned with the brand identity." + aspectRatioRequirement + styleContext;
        case 'TikTok View Mockup':
            return "A mobile screen showing a TikTok UI layout with the brand logo used as a profile picture and in a video overlay background." + aspectRatioRequirement + styleContext;
        case 'Letterhead Design':
            return "A clean, minimalist A4 letterhead design featuring the logo at the top and corporate styling at the bottom." + aspectRatioRequirement + styleContext;
        case 'Email Signature':
            return "A horizontal layout for a corporate email signature featuring the logo, placeholder text for name/title, and brand colors." + aspectRatioRequirement + styleContext;
        default:
            return `A professional product shot of the provided logo.` + aspectRatioRequirement + styleContext;
    }
}

const BrandingStudio: React.FC<{
  project: BrandingStudioProject;
  setProject: React.Dispatch<React.SetStateAction<BrandingStudioProject>>;
  onExport: (targetView: any, data: any) => void;
  allProjects?: BrandingStudioProject[];
  onSelectProject?: (index: number) => void;
}> = ({ project, setProject, onExport, allProjects = [], onSelectProject }) => {

    const handleFileUpload = async (files: File[]) => {
        if (!files || files.length === 0) return;
        setProject(s => ({ ...s, isUploading: true, error: null }));
        try {
            const uploaded = await Promise.all(files.map(async file => {
                const resized = await resizeImage(file, 1024, 1024);
                const reader = new FileReader();
                return new Promise<ImageFile>(res => {
                    reader.onloadend = () => res({ base64: (reader.result as string).split(',')[1], mimeType: resized.type, name: resized.name });
                    reader.readAsDataURL(resized);
                });
            }));
            setProject(s => ({
                ...s,
                logos: [...s.logos, ...uploaded],
                isUploading: false,
                results: [],
                colors: [],
            }));

            // Log to central history
            for (const img of uploaded) {
                logHistory({
                    type: 'image',
                    studio: 'branding_studio',
                    content: `data:${img.mimeType};base64,${img.base64}`,
                    prompt: `Brand Identity Asset: ${img.name}`,
                    metadata: { asset: true, originalName: img.name }
                });
            }
        } catch (err) {
            setProject(s => ({ ...s, error: 'Upload failed', isUploading: false }));
        }
    };

    const handleRemoveLogo = (idx: number) => setProject(s => ({ ...s, logos: s.logos.filter((_, i) => i !== idx), results: [], colors: [], error: null }));
    const handleUpdateLogo = (idx: number, newImage: ImageFile) => setProject(s => {
        const nextLogos = [...s.logos];
        nextLogos[idx] = newImage;
        return { ...s, logos: nextLogos, results: [], colors: [] };
    });

    const handleFullSynthesis = async () => {
        if (!project.targetAudience && !project.brandVoice && !project.name) {
            setProject(s => ({ ...s, error: "Please provide a name or a brief to begin synthesis." }));
            return;
        }

        setProject(s => ({ ...s, isAnalyzing: true, error: null }));
        try {
            // 1. Strategy Synthesis
            const strategyPrompt = `Brand: ${project.name}. Brief: ${project.targetAudience}. Voice: ${project.brandVoice}`;
            const strategy = await generateBrandStrategy(strategyPrompt, project.aiConfig);
            if (!strategy) throw new Error("Failed to synthesize brand strategy. Please try again.");
            
            // 2. Naming (if name is missing or we want alternatives)
            let naming = project.brandNaming;
            if (!naming || naming.length === 0) {
                naming = await generateNeuralNaming(strategyPrompt, project.aiConfig);
            }

            // 3. Visual DNA
            const visual = await generateVisualIdentity(project.targetAudience, strategy, project.aiConfig);
            if (!visual) throw new Error("Failed to synthesize visual identity. Please try again.");

            // 4. Update Project State
            setProject(s => ({
                ...s,
                brandArchetype: strategy.archetype || s.brandArchetype,
                missionStatement: strategy.missionStatement || s.missionStatement,
                visionStatement: strategy.visionStatement || s.visionStatement,
                coreValues: strategy.coreValues || s.coreValues,
                brandPersonality: strategy.brandPersonality || s.brandPersonality,
                brandStory: strategy.brandStory || s.brandStory,
                brandNaming: naming,
                colors: visual.colors || s.colors,
                secondaryColors: visual.secondaryColors || s.secondaryColors,
                typography: visual.typography || s.typography,
                isAnalyzing: false
            }));

            // 5. Trigger Mockup Generation if logos exist
            if (project.logos.length > 0) {
                onGenerate();
            }

            await logHistory({
                type: 'text',
                studio: 'branding_studio',
                prompt: `Full Brand Synthesis for ${project.name || 'New Brand'}`,
                content: `Archetype: ${strategy.archetype}\nMission: ${strategy.missionStatement}`
            });

        } catch (err: any) {
            setProject(s => ({ ...s, error: err.message, isAnalyzing: false }));
        }
    };

    const togglePersonality = (trait: string) => {
        setProject(s => {
            const next = s.brandPersonality.includes(trait)
                ? s.brandPersonality.filter(p => p !== trait)
                : [...s.brandPersonality, trait];
            return { ...s, brandPersonality: next };
        });
    };

    const cancelRef = useRef(false);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [editingColorIdx, setEditingColorIdx] = useState<number | null>(null);
    const [editingSecColorIdx, setEditingSecColorIdx] = useState<number | null>(null);
    const [colorPickerTab, setColorPickerTab] = useState<'hex' | 'hsl'>('hex');
    const [fontKey, setFontKey] = useState(0);
    const [comments, setComments] = useState<{id: string; author: string; content: string; timestamp: number}[]>([]);
    const handleAddComment = (content: string) => {
        setComments(prev => [...prev, { id: Date.now().toString(), author: 'local-user', content, timestamp: Date.now() }]);
    };
    const handleDeleteComment = (id: string) => setComments(prev => prev.filter(c => c.id !== id));
    const [versions, setVersions] = useState<{id: string; timestamp: number; label: string; snapshot: any}[]>([]);
    const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
    const [redoStack, setRedoStack] = useState<{id: string; timestamp: number; label: string; snapshot: any}[]>([]);
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

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
      setProject(() => previous.snapshot);
      setCurrentVersionId(previous.id);
      setVersions(prev => prev.slice(0, -1));
    }, [versions, setProject]);

    const handleRedo = useCallback(() => {
      if (redoStack.length === 0) return;
      const next = redoStack[redoStack.length - 1];
      setRedoStack(prev => prev.slice(0, -1));
      setProject(() => next.snapshot);
      setCurrentVersionId(next.id);
      setVersions(prev => [...prev, next]);
    }, [redoStack, setProject]);

    useGlobalShortcuts([
      { key: 'z', meta: true, handler: handleUndo },
      { key: 'z', meta: true, shift: true, handler: handleRedo },
      { key: 's', meta: true, handler: () => pushVersion('Manual save') },
    ]);

    const handleCopyManual = () => {
        if (!project.brandManual) return;
        navigator.clipboard.writeText(project.brandManual);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadManual = () => {
        if (!project.brandManual) return;
        const blob = new Blob([project.brandManual], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brand_manual_${project.name || 'identity'}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const onGenerateStrategy = async () => {
        if (!project.targetAudience && !project.brandVoice) return;
        setProject(s => ({ ...s, isAnalyzing: true, error: null }));
        try {
            const prompt = `Project: ${project.name}. Audience: ${project.targetAudience}. Voice: ${project.brandVoice}. Personality: ${project.brandPersonality.join(', ')}`;
            const strategy = await generateBrandStrategy(prompt, project.aiConfig);
            if (strategy) {
                setProject(s => ({ 
                    ...s, 
                    brandArchetype: strategy.archetype,
                    missionStatement: strategy.missionStatement,
                    visionStatement: strategy.visionStatement,
                    coreValues: strategy.coreValues,
                    brandPersonality: strategy.brandPersonality,
                    brandStory: strategy.brandStory,
                    targetAudience: strategy.targetAudience,
                    brandVoice: strategy.brandVoice,
                    isAnalyzing: false
                }));
            }
        } catch (err) {
            setProject(s => ({ ...s, error: 'Strategy failed', isAnalyzing: false }));
        }
    };

    const onGenerateNaming = async () => {
        setProject(s => ({ ...s, isGeneratingNaming: true, error: null }));
        try {
            const prompt = `Description: ${project.targetAudience}. Voice: ${project.brandVoice}. Archetype: ${project.brandArchetype}`;
            const names = await generateNeuralNaming(prompt, project.aiConfig);
            setProject(s => ({ ...s, brandNaming: names, isGeneratingNaming: false }));
        } catch (err) {
            setProject(s => ({ ...s, error: 'Naming failed', isGeneratingNaming: false }));
        }
    };

    const onGenerateVisualIdentity = async () => {
        setProject(s => ({ ...s, isGenerating: true, error: null }));
        try {
            const strategy = {
                archetype: project.brandArchetype,
                voice: project.brandVoice,
                values: project.coreValues
            };
            const visual = await generateVisualIdentity(project.targetAudience, strategy, project.aiConfig);
            if (visual) {
                setProject(s => ({ 
                    ...s, 
                    colors: visual.colors, 
                    secondaryColors: visual.secondaryColors,
                    typography: visual.typography,
                    isGenerating: false 
                }));
            }
        } catch (err) {
            setProject(s => ({ ...s, error: 'Visual ID failed', isGenerating: false }));
        }
    };
    
    const onGenerate = useCallback(async () => {
        if (project.logos.length === 0) return;
        setProject(s => ({...s, isAnalyzing: true, isGenerating: true, error: null, colors: [], results: [], brandManual: null, missionStatement: null, visionStatement: null, coreValues: null, brandPersona: null, brandStory: null, competitorAnalysis: null}));
        try {
            const analysis = await analyzeLogoForBranding(project.logos);
            setProject(s => ({...s, colors: analysis.colors, isAnalyzing: false}));
            
            const primaryColor = analysis.colors[0] || '';
            const initialResults = MOCKUP_CATEGORIES.map(category => ({ category, image: null, isLoading: true, error: null, editPrompt: '', isEditing: false }));
            setProject(s => ({...s, results: initialResults}));
            
            // Generate manual, vision, story, analysis and assets in parallel
            const manualPromise = generateBrandManual({
                name: project.name || 'The Brand',
                specialty: project.targetAudience || 'Innovation',
                colors: analysis.colors,
                personality: project.brandPersonality,
                voice: project.brandVoice,
                audience: project.targetAudience,
                fonts: project.fontPreferences
            }, 'en', project.aiConfig);

            const mvvPromise = generateMissionVisionValues({
                name: project.name || 'The Brand',
                specialty: project.targetAudience || 'Industry Leader',
                audience: project.targetAudience,
                personality: project.brandPersonality
            }, project.aiConfig);

            const personaPromise = generateBrandPersona({
                name: project.name || 'The Brand',
                specialty: project.targetAudience || 'Service Industry',
                audience: project.targetAudience
            }, project.aiConfig);

            const storyPromise = generateBrandStory({
                name: project.name || 'The Brand',
                specialty: project.targetAudience || 'Modern Brand',
                audience: project.targetAudience,
                personality: project.brandPersonality
            }, project.aiConfig);

            const competitorPromise = generateCompetitorAnalysis({
                name: project.name || 'The Brand',
                specialty: project.targetAudience || 'Mainstream',
                audience: project.targetAudience
            }, project.aiConfig);

            // Handle updates as they arrive
            manualPromise.then(manual => {
                setProject(s => ({ ...s, brandManual: manual }));
                logHistory({
                    type: 'text',
                    studio: 'branding_studio',
                    content: manual,
                    prompt: 'Generate Brand Manual'
                });
            });
            mvvPromise.then(mvv => {
                setProject(s => ({ 
                    ...s, 
                    missionStatement: mvv.mission, 
                    visionStatement: mvv.vision, 
                    coreValues: mvv.values 
                }));
                logHistory({
                    type: 'text',
                    studio: 'branding_studio',
                    content: `Mission: ${mvv.mission}\nVision: ${mvv.vision}\nValues: ${mvv.values.join(', ')}`,
                    prompt: 'Generate Mission, Vision, and Values'
                });
            });
            personaPromise.then(persona => {
                setProject(s => ({ ...s, brandPersona: persona }));
                logHistory({
                    type: 'text',
                    studio: 'branding_studio',
                    content: persona,
                    prompt: 'Generate Brand Persona'
                });
            });
            storyPromise.then(story => {
                setProject(s => ({ ...s, brandStory: story }));
                logHistory({
                    type: 'text',
                    studio: 'branding_studio',
                    content: story,
                    prompt: 'Generate Brand Story'
                });
            });
            competitorPromise.then(comp => {
                setProject(s => ({ ...s, competitorAnalysis: comp }));
                logHistory({
                    type: 'text',
                    studio: 'branding_studio',
                    content: comp,
                    prompt: 'Generate Competitor Analysis'
                });
            });

            const promises = MOCKUP_CATEGORIES.map(category => {
                const basePrompt = getPromptForCategory(category, project.aspectRatio, project.brandPersonality);
                const colorPrompt = primaryColor ? ` Incorporate the color ${primaryColor} as a primary theme.` : '';
                const voicePrompt = project.brandVoice ? ` The brand voice is ${project.brandVoice}.` : '';
                const audiencePrompt = project.targetAudience ? ` The target audience is ${project.targetAudience}.` : '';
                
                const prompt = `${basePrompt}${colorPrompt}${voicePrompt}${audiencePrompt}`;
                
                return generateImage([project.logos[0]], prompt, null) // Primary logo as reference
                    .then(image => ({ status: 'fulfilled' as const, value: { category, image } }))
                    .catch(error => ({ status: 'rejected' as const, reason: { category, error } }));
            });

            // Handle manual update as soon as it filters in
            manualPromise.then(manual => setProject(s => ({ ...s, brandManual: manual })));

            const settledResults = await Promise.all(promises);
            settledResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { category, image } = result.value;
                    setProject(s => ({...s, results: s.results.map(r => r.category === category ? { ...r, image, isLoading: false } : r)}));
                    logHistory({
                        type: 'image',
                        studio: 'branding_studio',
                        content: `data:${image.mimeType};base64,${image.base64}`,
                        prompt: `Branding Asset: ${category}`
                    });
                } else {
                    const { category, error } = result.reason;
                    setProject(s => ({ ...s, results: s.results.map(r => r.category === category ? { ...r, error: error.message || 'Generation failed', isLoading: false } : r)}));
                }
            });
        } catch(err) {
            setProject(s => ({...s, error: 'Analysis failed', isAnalyzing: false }));
        } finally {
            setProject(s => ({...s, isGenerating: false}));
        }
    }, [project.logos, project.aspectRatio, project.brandPersonality, project.brandVoice, project.targetAudience, project.fontPreferences, project.name, setProject]);

    useEffect(() => {
        const fonts = [project.typography?.primary, project.typography?.secondary].filter(Boolean) as string[];
        fonts.forEach(font => {
            if (!font || document.getElementById(`gf-${font}`)) return;
            const link = document.createElement('link');
            link.id = `gf-${font}`;
            link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        });
    }, [project.typography?.primary, project.typography?.secondary, fontKey]);

    if (!project) return null;

    return (
        <main className="w-full max-w-7xl flex flex-col gap-8 pt-4 pb-12 flex-grow">
            {/* Header & Vision Bar */}
            <header className="flex flex-col xl:flex-row items-center justify-between gap-8 py-4">
                <div className="flex flex-col gap-1 text-center xl:text-left">
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.8] flex items-center gap-4">
                        Visual DNA <Sparkles className="w-8 h-8 text-[var(--color-accent)]" />
                    </h1>
                    <p className="text-xs text-white/30 font-bold uppercase tracking-[0.5em] ml-1">Universal Identity Architect v4.0</p>
                </div>

                <div className="flex items-center gap-3">
                    <ShareableLink projectId={project.id} />
                    <CommentsOverlay targetId={project.id} comments={comments} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} />
                    <VersionTimeline versions={versions} currentVersionId={currentVersionId} onRestore={(v) => { setProject(() => v.snapshot); setCurrentVersionId(v.id); }} onUndo={handleUndo} onRedo={handleRedo} canUndo={versions.length > 1} canRedo={redoStack.length > 0} />
                    <button
                        onClick={() => setShowTemplatePicker(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Plus className="w-3 h-3" />
                        New from Template
                    </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1 bg-white/5 p-1.5 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                    {[
                        { id: 'strategy', label: 'Strategy', icon: Target },
                        { id: 'naming', label: 'Naming', icon: Command },
                        { id: 'visuals', label: 'Visuals', icon: Palette },
                        { id: 'mockups', label: 'Mockups', icon: Layout },
                        { id: 'tools', label: 'Tools', icon: Sparkles },
                        { id: 'guidelines', label: 'Guidelines', icon: BookOpen },
                        { id: 'history', label: 'History', icon: Briefcase }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setProject(s => ({ ...s, activeTab: tab.id as any }))}
                            className={cn(
                                "flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 group",
                                project.activeTab === tab.id 
                                    ? "bg-[var(--color-accent)] text-white shadow-[0_0_40px_rgba(var(--color-accent-rgb),0.3)] scale-[1.05] z-10" 
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", project.activeTab === tab.id ? "scale-110" : "opacity-50")} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {project.isGenerating && (
                <AILoadingOverlay message="Synthesizing brand identity..." onCancel={() => setProject(s => ({ ...s, isGenerating: false, isAnalyzing: false }))} />
            )}

            <AnimatePresence mode="wait">
                {project.activeTab === 'strategy' && (
                    <motion.div
                        key="strategy"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-1 space-y-6">
                                <div className="glass-card rounded-[40px] p-10 border border-white/5 space-y-8 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                                        <Fingerprint className="w-48 h-48" />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Brand Brief</h3>
                                        <p className="text-xs text-white/30 font-medium uppercase tracking-widest">Foundation for neural generation.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                                <Target className="w-3 h-3" /> Target Market
                                            </label>
                                            <input 
                                                value={project.targetAudience}
                                                onChange={e => setProject(s => ({ ...s, targetAudience: e.target.value }))}
                                                placeholder="e.g. Luxury Tech Innovators"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                                <MessageSquare className="w-3 h-3" /> Voice / Tone
                                            </label>
                                            <textarea 
                                                value={project.brandVoice}
                                                onChange={e => setProject(s => ({ ...s, brandVoice: e.target.value }))}
                                                rows={4}
                                                placeholder="Professional, Bold, Ethereal..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-[var(--color-accent)] outline-none resize-none transition-all"
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={onGenerateStrategy}
                                                disabled={project.isAnalyzing}
                                                className="flex-1 bg-white/5 text-white/40 border border-white/10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                                            >
                                                <Target className="w-4 h-4" />
                                                Partial Strategy
                                            </button>
                                            <button 
                                                onClick={handleFullSynthesis}
                                                disabled={project.isAnalyzing}
                                                className="flex-[2] bg-[var(--color-accent)] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(var(--color-accent-rgb),0.3)] flex items-center justify-center gap-3"
                                            >
                                                {project.isAnalyzing ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                {project.isAnalyzing ? 'Synthesizing...' : 'Full Brand Synthesis'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass-card rounded-[40px] p-8 border border-white/5 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                                        <Fingerprint className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Archetype</h4>
                                    <p className="text-4xl font-black text-white italic transition-all">{project.brandArchetype || 'Awaiting Discovery'}</p>
                                    <div className="h-px w-full bg-white/5 my-4"></div>
                                    <div className="flex flex-wrap gap-2">
                                        {project.brandPersonality.map((trait, i) => (
                                            <span key={i} className="px-3 py-1 bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest rounded-full">{trait}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-card rounded-[40px] p-8 border border-white/5 flex flex-col justify-between group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <Target className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Mission Pulse</h4>
                                        <p className="text-lg font-black text-white/80 leading-tight italic">{project.missionStatement || "Define your brief to crystallize the brand's true purpose."}</p>
                                    </div>
                                    <div className="relative z-10 pt-6">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Vision Velocity</p>
                                        <p className="text-sm font-bold text-white/40 mt-1">{project.visionStatement || "Mapping the future horizon..."}</p>
                                    </div>
                                </div>

                                <div className="md:col-span-2 glass-card rounded-[40px] p-10 border border-white/5 relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                        <MessageSquare className="w-64 h-64" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-rose-400" />
                                                </div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-widest italic">The Narrative Soul</h3>
                                            </div>
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Origin Story Analysis</p>
                                        </div>
                                        <div className="prose prose-invert max-w-none text-white/50 font-medium leading-[1.8] italic suggestions-scrollbar overflow-y-auto max-h-[300px] pr-8">
                                            {project.brandStory || "The story of your evolution is yet to be told. Provide the prompt hooks above to let the neural strategist weave your legacy."}
                                        </div>
                                    </div>
                                </div>

                                {project.brandPersona && (
                                <div className="md:col-span-2 glass-card rounded-[40px] p-10 border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                        <Users className="w-64 h-64" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-widest italic">Brand Persona</h3>
                                            </div>
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Archetypal Identity</p>
                                        </div>
                                        <div className="prose prose-invert max-w-none text-white/50 font-medium leading-[1.8] italic suggestions-scrollbar overflow-y-auto max-h-[300px] pr-8">
                                            {project.brandPersona}
                                        </div>
                                    </div>
                                </div>
                                )}

                                {project.competitorAnalysis && (
                                <div className="md:col-span-2 glass-card rounded-[40px] p-10 border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                        <Crosshair className="w-64 h-64" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                    <Crosshair className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-widest italic">Competitor Analysis</h3>
                                            </div>
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Market Landscape Intelligence</p>
                                        </div>
                                        <div className="prose prose-invert max-w-none text-white/50 font-medium leading-[1.8] italic suggestions-scrollbar overflow-y-auto max-h-[300px] pr-8">
                                            {project.competitorAnalysis}
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            { (project.coreValues.length > 0 ? project.coreValues : ['Integrity', 'Innovation', 'Impact', 'Inclusion', 'Identity']).map((val, i) => (
                                <div key={i} className="glass-card rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center gap-3 group hover:border-[var(--color-accent)]/30 transition-all">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--color-accent)]/20 transition-all">
                                        <span className="text-[10px] font-black text-white/20 group-hover:text-[var(--color-accent)]">0{i+1}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{val}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {project.activeTab === 'naming' && (
                    <motion.div
                        key="naming"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="space-y-1">
                                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Neural Naming Engine</h2>
                                <p className="text-xs text-white/30 font-black uppercase tracking-[0.4em]">High-Impact Semantic Generation</p>
                            </div>
                            <button 
                                onClick={onGenerateNaming}
                                disabled={project.isGeneratingNaming}
                                className="px-10 py-5 bg-[var(--color-accent)] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[var(--color-accent)]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                                {project.isGeneratingNaming ? <Cpu className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {project.isGeneratingNaming ? 'Processing Logic...' : 'Generate New Names'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {project.brandNaming ? project.brandNaming.map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass-card rounded-[32px] p-8 border border-white/5 hover:border-[var(--color-accent)]/30 transition-all group cursor-pointer h-full flex flex-col justify-between"
                                    onClick={() => setProject(s => ({ ...s, name: item.name }))}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/20">#{i+1}</div>
                                            <Search className="w-4 h-4 text-white/10 group-hover:text-[var(--color-accent)] transition-colors" />
                                        </div>
                                        <h3 className="text-3xl font-black text-white italic transition-all group-hover:text-[var(--color-accent)]">{item.name}</h3>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-relaxed border-l-2 border-[var(--color-accent)]/20 pl-4 italic">
                                            "{item.tagline}"
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <p className="text-[10px] font-medium text-white/20 italic leading-relaxed line-clamp-3 group-hover:text-white/40 transition-colors">
                                            {item.logic}
                                        </p>
                                    </div>
                                </motion.div>
                            )) : (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="glass-card rounded-[32px] p-8 border border-white/5 h-64 flex flex-col items-center justify-center gap-4 opacity-30 border-dashed">
                                        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-dashed animate-spin text-white/10"></div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Command...</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {project.activeTab === 'visuals' && (
                    <motion.div
                        key="visuals"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div className="space-y-8">
                                <div className="glass-card rounded-[40px] p-10 border border-white/5 space-y-8 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                                        <Palette className="w-64 h-64" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Color Alchemy</h3>
                                            <p className="text-xs text-white/30 font-black uppercase tracking-widest">Chromatic Identity Mapping</p>
                                        </div>
                                        <button 
                                            onClick={onGenerateVisualIdentity}
                                            className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                        >
                                            <Search className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-2 flex items-center gap-3">Primary DNA <button onClick={() => setProject(s => ({ ...s, colors: [...s.colors, '#ffffff'] }))} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">+ Add</button></label>
                                        <div className="grid grid-cols-3 gap-6">
                                            {project.colors.map((color, i) => (
                                                <div key={i} className="space-y-3 group">
                                                    <div className="aspect-square rounded-[32px] shadow-2xl transition-transform border border-white/5 relative overflow-hidden cursor-pointer" style={{ background: editingColorIdx !== i ? color : undefined }} onClick={() => setEditingColorIdx(editingColorIdx === i ? null : i)}>
                                                        {editingColorIdx === i ? (
                                                            <div className="absolute inset-0 bg-[#1a1a1a] flex flex-col gap-2 p-3">
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => setColorPickerTab('hex')} className={`flex-1 py-1 text-[7px] font-black uppercase tracking-widest rounded ${colorPickerTab === 'hex' ? 'bg-[var(--color-accent)] text-white' : 'bg-white/10 text-white/40'}`}>Hex</button>
                                                                    <button onClick={() => setColorPickerTab('hsl')} className={`flex-1 py-1 text-[7px] font-black uppercase tracking-widest rounded ${colorPickerTab === 'hsl' ? 'bg-[var(--color-accent)] text-white' : 'bg-white/10 text-white/40'}`}>HSL</button>
                                                                </div>
                                                                {colorPickerTab === 'hex' ? (
                                                                    <input value={color} onChange={e => setProject(s => ({ ...s, colors: s.colors.map((c, j) => j === i ? e.target.value : c) }))} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-white outline-none" placeholder="#hex" />
                                                                ) : (
                                                                    <div className="flex flex-col gap-1.5">
                                                                        {['Hue', 'Sat', 'Light'].map((label, hi) => (
                                                                            <div key={label} className="flex items-center gap-2">
                                                                                <span className="text-[6px] font-black text-white/40 w-6">{label}</span>
                                                                                <input type="range" min={hi === 0 ? 0 : 0} max={hi === 0 ? 360 : 100} value={hi === 0 ? 0 : hi === 1 ? 100 : 50} onChange={e => {}} className="flex-1 accent-[var(--color-accent)] h-0.5" />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <button onClick={() => { setProject(s => ({ ...s, colors: s.colors.filter((_, j) => j !== i) })); setEditingColorIdx(null); }} className="mt-auto text-[7px] font-black text-red-400 uppercase tracking-widest">Remove</button>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-white uppercase">{color}</p>
                                                        <p className="text-[8px] font-medium text-white/20 uppercase tracking-widest mt-1">Weight 0{3-i}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {project.colors.length === 0 && Array(3).fill(0).map((_, i) => (
                                                <div key={i} className="aspect-square rounded-[32px] bg-white/5 border border-dashed border-white/10"></div>
                                            ))}
                                        </div>
                                    </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-2 flex items-center gap-3">System Complements <button onClick={() => setProject(s => ({ ...s, secondaryColors: [...s.secondaryColors, '#ffffff'] }))} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">+ Add</button></label>
                                            <div className="grid grid-cols-4 gap-4">
                                                {project.secondaryColors.map((color, i) => (
                                                    <div key={i} className="flex flex-col gap-2">
                                                        <div className="h-12 rounded-xl border border-white/5 relative overflow-hidden cursor-pointer" style={{ background: editingSecColorIdx !== i ? color : undefined }} onClick={() => setEditingSecColorIdx(editingSecColorIdx === i ? null : i)}>
                                                            {editingSecColorIdx === i ? (
                                                                <div className="absolute inset-0 bg-[#1a1a1a] flex items-center gap-1 p-1">
                                                                    <input value={color} onChange={e => setProject(s => ({ ...s, secondaryColors: s.secondaryColors.map((c, j) => j === i ? e.target.value : c) }))} className="flex-1 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[7px] font-mono text-white outline-none" />
                                                                    <button onClick={() => { setProject(s => ({ ...s, secondaryColors: s.secondaryColors.filter((_, j) => j !== i) })); setEditingSecColorIdx(null); }} className="text-[7px] text-red-400 font-black uppercase">X</button>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <span className="text-[9px] font-mono text-center text-white/30">{color}</span>
                                                    </div>
                                                ))}
                                                {project.secondaryColors.length === 0 && Array(2).fill(0).map((_, i) => (
                                                    <div key={i} className="h-12 rounded-xl bg-white/5 border border-dashed border-white/10"></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="glass-card rounded-[40px] p-10 border border-white/5 space-y-10">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Typographic Grid</h3>
                                        <p className="text-xs text-white/30 font-black uppercase tracking-widest">Google Fonts Pairings</p>
                                    </div>

                                    <div className="space-y-12">
                                        <div className="space-y-4 group">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-2">Display Headings</label>
                                                <div className="flex items-center gap-2">
                                                    <input value={project.typography?.primary || 'Inter'} onChange={e => setProject(s => ({ ...s, typography: { ...s.typography, primary: e.target.value } as any }))} className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] font-mono text-white outline-none" />
                                                    <button onClick={() => { fontLoaded.current = false; setFontKey(k => k + 1); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Preview</button>
                                                </div>
                                            </div>
                                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                                                <p className="text-5xl font-black text-white uppercase tracking-tighter leading-none" style={{ fontFamily: `'${project.typography?.primary || 'Inter'}', sans-serif` }}>The quick brown fox jumps over the lazy dog</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 group">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-2">Body Content</label>
                                                <input value={project.typography?.secondary || 'Inter'} onChange={e => setProject(s => ({ ...s, typography: { ...s.typography, secondary: e.target.value } as any }))} className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] font-mono text-white outline-none" />
                                            </div>
                                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                                                <p className="text-base font-medium text-white/60 leading-relaxed" style={{ fontFamily: `'${project.typography?.secondary || 'Inter'}', sans-serif` }}>Design is not just what it looks like and feels like. Design is how it works. Brand identity is the visual representation of a company's values and mission through a consistent aesthetic language.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </motion.div>
                )}

                {project.activeTab === 'mockups' && (
                    <motion.div
                        key="mockups"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="glass-card rounded-[40px] p-8 md:p-12 border border-white/5 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                                <Layout className="w-96 h-96" />
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Identity Ecosystem</h3>
                                    </div>
                                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em] ml-6">
                                        {project.results.filter(r => !!r.image).length} of {project.results.length} Assets Synchronized
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                     <div className="flex gap-1 bg-black/40 p-1 rounded-2xl border border-white/10">
                                        {ASPECT_RATIOS.map(ratio => (
                                            <button 
                                                key={ratio.value} 
                                                onClick={() => setProject(s => ({ ...s, aspectRatio: ratio.value as AspectRatio }))} 
                                                className={cn(
                                                    "px-6 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all",
                                                    project.aspectRatio === ratio.value ? "bg-white text-black shadow-2xl" : "text-white/30 hover:text-white/60"
                                                )}
                                            >
                                                {ratio.value}
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={onGenerate}
                                        disabled={project.isGenerating || project.logos.length === 0}
                                        className="px-10 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
                                    >
                                        {project.isGenerating ? 'Synthesizing...' : 'Re-Generate All Mockups'}
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <BrandingResultsGrid results={project.results} onEditResult={(idx, prompt) => {
                                    const result = project.results[idx];
                                    if (!result) return;
                                    setProject(s => ({ ...s, results: s.results.map((r, i) => i === idx ? { ...r, isEditing: true } : r) }));
                                    const primaryColor = project.colors[0] || '';
                                    const basePrompt = getPromptForCategory(result.category, project.aspectRatio, project.brandPersonality);
                                    const fullPrompt = `${basePrompt}. Edit request: ${prompt}. Incorporate the color ${primaryColor} as a primary theme. The brand voice is ${project.brandVoice}. The target audience is ${project.targetAudience}.`;
                                    generateImage(project.logos.length > 0 ? [project.logos[0]] : [], fullPrompt, null)
                                        .then(image => {
                                            setProject(s => ({ ...s, results: s.results.map((r, i) => i === idx ? { ...r, image, isEditing: false, isLoading: false } : r) }));
                                        })
                                        .catch(error => {
                                            setProject(s => ({ ...s, results: s.results.map((r, i) => i === idx ? { ...r, error: error.message || 'Edit failed', isEditing: false, isLoading: false } : r) }));
                                        });
                                }} />
                            </div>
                        </div>

                        <div className="glass-card rounded-[40px] p-10 border border-white/5 border-dashed flex flex-col md:flex-row items-center justify-between gap-8 group">
                            <div className="flex items-center gap-8">
                                 <ImageWorkspace
                                    id="brand-logo-processor"
                                    title="Reference Logo"
                                    images={project.logos}
                                    onImagesUpload={handleFileUpload}
                                    onImageRemove={handleRemoveLogo}
                                    isUploading={project.isUploading}
                                    onImageUpdate={handleUpdateLogo}
                                />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tight">Style Consistency Guard</h4>
                                    <p className="text-xs text-white/40 font-medium max-w-md">Our neural engine analyzes your primary logo DNA to ensure every mockup maintains pixel-perfect brand consistency across all touchpoints.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {project.activeTab === 'tools' && (
                    <motion.div
                        key="tools"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <BrandTools 
                            project={project}
                            setProject={setProject as any}
                            brandName={project.name || 'Brand'}
                            specialty={project.targetAudience || 'Industry'}
                            audience={project.targetAudience || ''}
                            voice={project.brandVoice || ''}
                            language="en"
                            aiConfig={project.aiConfig || { provider: 'google', modelId: 'gemini-2.1-flash' }}
                        />
                    </motion.div>
                )}

                {project.activeTab === 'guidelines' && (
                    <motion.div
                        key="guidelines"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 glass-card rounded-[40px] p-12 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
                                    <FileText className="w-96 h-96" />
                                </div>
                                <div className="relative z-10 space-y-12">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="space-y-2">
                                            <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Identity Manual</h3>
                                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em] mb-4">Official Brand Guidelines v1.0</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleCopyManual}
                                                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                {copied ? 'Manual Copied' : 'Copy DNA'}
                                            </button>
                                            <button 
                                                onClick={handleDownloadManual}
                                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                                            >
                                                <Download className="w-3 h-3" />
                                                Export System (.MD)
                                            </button>
                                        </div>
                                    </div>

                                    {!project.brandManual ? (
                                        <div className="h-[500px] rounded-[32px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 opacity-30">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-[0.3em]">Guidelines Not Yet Synthesized</p>
                                            <button 
                                                onClick={onGenerate}
                                                className="px-8 py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                            >
                                                Process Identity DNA
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert max-w-none text-white/60 font-medium leading-[2] italic suggestions-scrollbar overflow-y-auto max-h-[600px] pr-8">
                                            {project.brandManual.split('\n').map((line, i) => {
                                                if (line.startsWith('# ')) return <h1 key={i} className="text-5xl font-black text-white mt-12 mb-8 border-b border-white/10 pb-6 uppercase tracking-tighter italic">{line.replace('# ', '')}</h1>;
                                                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black text-[var(--color-accent)] mt-12 mb-6 uppercase tracking-tight flex items-center gap-4 italic"><div className="w-8 h-[2px] bg-[var(--color-accent)]/30"></div> {line.replace('## ', '')}</h2>;
                                                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-black text-white/90 mt-10 mb-5 uppercase tracking-widest flex items-center gap-3 underline decoration-[var(--color-accent)]/30 decoration-4 underline-offset-[12px] italic"> {line.replace('### ', '')}</h3>;
                                                if (line.trim() === '') return <div key={i} className="h-6"></div>;
                                                return <p key={i} className="mb-6">{line}</p>;
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Professional Integration Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { studio: 'marketing_studio', icon: Globe, label: 'GTM Strategy', desc: 'Deploy SWOT & SEO plans', color: 'blue' },
                                { studio: 'campaign_studio', icon: Layers, label: 'Creative Engine', desc: 'Launch social narratives', color: 'orange' },
                                { studio: 'voice_over_studio', icon: Mic, label: 'Aural Identity', desc: 'Give your DNA a voice', color: 'purple' },
                                { studio: 'photoshoot_director', icon: Camera, label: 'Visual Synthesis', desc: 'Direct aesthetic shoots', color: 'pink' }
                            ].map((item, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    onClick={() => onExport(item.studio as any, {})}
                                    className="p-8 glass-card border border-white/5 rounded-[40px] text-left group transition-all relative overflow-hidden"
                                >
                                    <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br", 
                                        item.color === 'blue' ? "from-blue-500" : 
                                        item.color === 'orange' ? "from-orange-500" : 
                                        item.color === 'purple' ? "from-purple-500" : "from-pink-500"
                                    )}></div>
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border mb-8 transition-all group-hover:scale-110",
                                        item.color === 'blue' ? "bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white" : 
                                        item.color === 'orange' ? "bg-orange-500/10 border-orange-500/20 text-orange-400 group-hover:bg-orange-500 group-hover:text-white" : 
                                        item.color === 'purple' ? "bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white" : 
                                        "bg-pink-500/10 border-pink-500/20 text-pink-400 group-hover:bg-pink-500 group-hover:text-white"
                                    )}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">{item.label}</h4>
                                    <p className="text-xs text-white/40 font-medium leading-relaxed italic">{item.desc}</p>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {project.activeTab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Brand Archives</h3>
                                <p className="text-xs text-white/30 font-black uppercase tracking-widest">Saved Projects & Identities</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allProjects.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    whileHover={{ y: -5 }}
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
                                        {p.logos.length > 0 && (
                                            <img 
                                                src={`data:${p.logos[0].mimeType};base64,${p.logos[0].base64}`}
                                                className="w-10 h-10 object-contain rounded-lg bg-black/20 p-1"
                                                alt="Logo"
                                            />
                                        )}
                                    </div>
                                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                                        {p.name || 'Untitled Identity'}
                                    </h4>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] line-clamp-1">
                                        {p.brandArchetype || 'No Strategy Set'}
                                    </p>
                                    
                                    <div className="mt-8 flex gap-2">
                                        {p.colors.slice(0, 3).map((c, ci) => (
                                            <div key={ci} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c }}></div>
                                        ))}
                                    </div>

                                    {project.id === p.id && (
                                        <div className="absolute top-4 right-4">
                                            <div className="bg-[var(--color-accent)] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Active</div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            
                            <button 
                                onClick={() => {
                                    const addBtn = document.querySelector('[aria-label="Add project"]');
                                    if (addBtn instanceof HTMLElement) addBtn.click();
                                }}
                                className="glass-card rounded-[40px] p-8 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-white/30 hover:bg-white/[0.02] transition-all group min-h-[250px]"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8 text-white/20 group-hover:text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black text-white/40 uppercase tracking-widest">Forge New Identity</p>
                                    <p className="text-[9px] text-white/20 mt-1 uppercase">Initialize Neural Canvas</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showTemplatePicker && (
                <TemplatePicker
                    studioType="branding_studio"
                    onSelect={(template) => {
                        const data = template.defaultData;
                        setProject(s => ({
                            ...s,
                            ...data,
                            targetAudience: data.targetAudience || s.targetAudience,
                            brandVoice: data.brandVoice || s.brandVoice,
                            brandPersonality: data.brandPersonality || s.brandPersonality,
                            fontPreferences: data.fontPreferences || s.fontPreferences,
                        }));
                        setShowTemplatePicker(false);
                    }}
                    onDismiss={() => setShowTemplatePicker(false)}
                />
            )}
        </main>
    );
};

export default BrandingStudio;
