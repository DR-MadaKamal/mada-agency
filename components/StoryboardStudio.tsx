import React, { useState, useEffect, useRef } from 'react';
import { 
    StoryboardStudioProject, 
    StoryboardScene, 
    ImageFile,
    AspectRatio
} from '../types';
import { 
    generateStoryboardPlan, 
    generateCharacterAnalysis, 
    generateLocationGuide,
    generateImage,
    generateShotScript,
    generateMoodboardPlan,
    generateDirectorCritique
} from '../services/geminiService';
import { logHistory } from '../lib/admin';
import { 
    Film, 
    Type, 
    Users, 
    MapPin, 
    Settings, 
    Sparkles, 
    Plus, 
    Trash2, 
    Download, 
    Share2, 
    ChevronRight, 
    ChevronLeft,
    Play,
    Split,
    Layout,
    Camera,
    Info,
    CheckCircle2,
    Clock,
    FileDigit,
    ListFilter,
    Maximize2,
    Pause,
    Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

interface Props {
    project: StoryboardStudioProject;
    setProject: React.Dispatch<React.SetStateAction<StoryboardStudioProject>>;
}

const SHOT_TYPES = [
    'Extreme Close-up',
    'Close-up',
    'Medium Shot',
    'Wide Shot',
    'Extreme Wide Shot',
    'Low Angle',
    'High Angle',
    'POV Shot',
    'Dutch Angle',
    'Over the Shoulder'
];

const CAMERA_MOVEMENTS = [
    'Static',
    'Pan Left/Right',
    'Tilt Up/Down',
    'Zoom In/Out',
    'Dolly In/Out',
    'Truck Left/Right',
    'Arc Shot',
    'Handheld'
];

const LIGHTING_STYLES = [
    'Natural',
    'Studio/Key Lighting',
    'Low Key (Dramatic)',
    'High Key (Bright)',
    'Cinematic / Moody',
    'Neon / Cyberpunk',
    'Noir (B&W)',
    'Golden Hour'
];

const VISUAL_STYLES = [
    'Cinematic',
    'Anime / Manga',
    'Digital Painting',
    'Rough Sketch',
    'Oil Painting',
    '3D Render (Unreal Engine 5)',
    'Noir Film',
    'Vibrant Concept Art'
];

export default function StoryboardStudio({ project, setProject }: Props) {
    const [isThinking, setIsThinking] = useState(false);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [showSceneEditor, setShowSceneEditor] = useState(false);

    const [critique, setCritique] = useState<string | null>(null);

    const activeTab = project.activeTab || 'script';

    useEffect(() => {
        if (selectedSceneId) {
            const scene = project.scenes.find(s => s.id === selectedSceneId);
            const index = project.scenes.findIndex(s => s.id === selectedSceneId);
            const prevScene = index > 0 ? project.scenes[index - 1] : null;
            
            if (scene) {
                setCritique(null);
                generateDirectorCritique(scene, prevScene, project.aiConfig).then(setCritique);
            }
        }
    }, [selectedSceneId]);

    // Playback Logic
    useEffect(() => {
        let interval: any;
        if (project.isPlaying && project.scenes.length > 0) {
            const currentScene = project.scenes[project.currentPlayIndex];
            const durationMs = parseFloat(currentScene.duration || '3') * 1000;

            interval = setTimeout(() => {
                setProject(s => ({
                    ...s,
                    currentPlayIndex: (s.currentPlayIndex + 1) % s.scenes.length
                }));
            }, durationMs);
        }
        return () => clearTimeout(interval);
    }, [project.isPlaying, project.currentPlayIndex, project.scenes]);

    const handleGeneratePlan = async () => {
        if (!project.script) return;
        setIsThinking(true);
        setProject(s => ({ ...s, isGeneratingPlan: true, error: null }));
        try {
            const scenes = await generateStoryboardPlan(
                project.script,
                project.visualStyle,
                project.aspectRatio,
                project.aiConfig
            );

            const decodedScenes: StoryboardScene[] = scenes.map((s: any, idx: number) => ({
                id: Math.random().toString(36).substr(2, 9),
                sequence: s.sequence || idx + 1,
                description: s.description || '',
                visualPrompt: s.visualPrompt || '',
                image: null,
                dialogue: s.dialogue || '',
                shotType: s.shotType || 'Medium Shot',
                cameraMovement: s.cameraMovement || 'Static',
                lighting: s.lighting || 'Natural',
                duration: s.duration || '3.0s',
                notes: s.notes || '',
                location: s.location || 'Unknown',
                isLoading: false,
                error: null
            }));

            setProject(s => ({ 
                ...s, 
                scenes: decodedScenes, 
                isGeneratingPlan: false,
                activeTab: 'board' 
            }));

            await logHistory({
                type: 'text',
                studio: 'storyboard_studio',
                prompt: `Generated ${decodedScenes.length} scenes from script for: ${project.projectTitle}`,
                content: `Generated ${decodedScenes.length} scenes`
            });
        } catch (err: any) {
            setProject(s => ({ ...s, isGeneratingPlan: false, error: err.message }));
        } finally {
            setIsThinking(false);
        }
    };

    const handleGenerateCharacters = async () => {
        if (!project.script) return;
        setIsThinking(true);
        try {
            const analysis = await generateCharacterAnalysis(project.script, project.aiConfig);
            setProject(s => ({ ...s, characterProfiles: analysis }));
        } catch (err: any) {
            setProject(s => ({ ...s, error: err.message }));
        } finally {
            setIsThinking(false);
        }
    };

    const handleGenerateLocations = async () => {
        if (!project.script) return;
        setIsThinking(true);
        try {
            const guide = await generateLocationGuide(project.script, project.aiConfig);
            setProject(s => ({ ...s, locationGuide: guide }));
        } catch (err: any) {
            setProject(s => ({ ...s, error: err.message }));
        } finally {
            setIsThinking(false);
        }
    };

    const handleGenerateMoodboard = async () => {
        if (!project.script) return;
        setIsThinking(true);
        try {
            const concepts = await generateMoodboardPlan(project.script, project.aiConfig);
            setProject(s => ({ 
                ...s, 
                moodboardConcepts: concepts.map((c: any) => ({ ...c, image: null })) 
            }));
            await logHistory({
                type: 'text',
                studio: 'storyboard_studio',
                prompt: `Generated visual moodboard for: ${project.projectTitle}`,
                content: `Generated moodboard with ${concepts.length} concepts`
            });
        } catch (err: any) {
            setProject(s => ({ ...s, error: err.message }));
        } finally {
            setIsThinking(false);
        }
    };

    const handleGenerateMoodImage = async (conceptTitle: string) => {
        const concept = project.moodboardConcepts.find(c => c.title === conceptTitle);
        if (!concept) return;

        setProject(s => ({
            ...s,
            moodboardConcepts: s.moodboardConcepts.map(c => c.title === conceptTitle ? { ...c, isLoading: true } : c)
        }));

        try {
            const image = await generateImage([], concept.prompt, null, '16:9', { provider: 'google', modelId: 'gemini-2.1-flash-image' });
            setProject(s => ({
                ...s,
                moodboardConcepts: s.moodboardConcepts.map(c => c.title === conceptTitle ? { ...c, image, isLoading: false } : c)
            }));
        } catch (err: any) {
            setProject(s => ({
                ...s,
                moodboardConcepts: s.moodboardConcepts.map(c => c.title === conceptTitle ? { ...c, isLoading: false } : c)
            }));
        }
    };

    const reorderScene = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === project.scenes.length - 1) return;

        const newScenes = [...project.scenes];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newScenes[index], newScenes[targetIndex]] = [newScenes[targetIndex], newScenes[index]];

        // Update sequence numbers
        const updatedScenes = newScenes.map((s, i) => ({ ...s, sequence: i + 1 }));
        setProject(s => ({ ...s, scenes: updatedScenes }));
    };

    const handleExportScript = async () => {
        if (project.scenes.length === 0) return;
        setIsThinking(true);
        try {
            const script = await generateShotScript(project.scenes, project.aiConfig);
            // Optionally store it in project state or just show it
            // For now, let's open it in a specialized view or log it
            await logHistory({
                type: 'text',
                studio: 'storyboard_studio',
                prompt: `Exported production script for ${project.projectTitle}`,
                content: script
            });
            // We'll store it in note style or just download it?
            // Let's download as a markdown file for the user
            const element = document.createElement("a");
            const file = new Blob([script], {type: 'text/markdown'});
            element.href = URL.createObjectURL(file);
            element.download = `${project.projectTitle || 'Project'}_Directing_Script.md`;
            document.body.appendChild(element);
            element.click();
        } catch (err: any) {
            setProject(s => ({ ...s, error: err.message }));
        } finally {
            setIsThinking(false);
        }
    };

    const handleGenerateImage = async (sceneId: string) => {
        const scene = project.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        setProject(s => ({
            ...s,
            scenes: s.scenes.map(p => p.id === sceneId ? { ...p, isLoading: true } : p)
        }));

        try {
            const prompt = `${scene.visualPrompt}. Visual style: ${project.visualStyle}. Lighting: ${scene.lighting}. Shot: ${scene.shotType}. High quality cinematic render, extreme detail.`;
            const image = await generateImage([], prompt, null, project.aspectRatio, { provider: 'google', modelId: 'gemini-2.1-flash-image' });
            
            setProject(s => ({
                ...s,
                scenes: s.scenes.map(p => p.id === sceneId ? { ...p, image, isLoading: false } : p)
            }));
        } catch (err: any) {
            setProject(s => ({
                ...s,
                scenes: s.scenes.map(p => p.id === sceneId ? { ...p, isLoading: false, error: err.message } : p)
            }));
        }
    };

    const updateScene = (id: string, updates: Partial<StoryboardScene>) => {
        setProject(s => ({
            ...s,
            scenes: s.scenes.map(sc => sc.id === id ? { ...sc, ...updates } : sc)
        }));
    };

    const selectedScene = project.scenes.find(s => s.id === selectedSceneId);

    return (
        <div className="min-h-screen bg-black text-zinc-100 selection:bg-rose-500/30 overflow-hidden flex flex-col pt-4">
            {/* Cinematic Header */}
            <div className="h-16 border-b border-white/5 bg-zinc-950/20 backdrop-blur-2xl flex items-center justify-between px-8 z-50 rounded-t-[2.5rem] mx-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <Film className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white/50">Storyboard Studio</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <input 
                        type="text"
                        value={project.projectTitle}
                        onChange={e => setProject(s => ({ ...s, projectTitle: e.target.value }))}
                        placeholder="UNTITLED SEQUENCE"
                        className="bg-transparent border-none outline-none font-bold tracking-widest text-sm text-white/80 w-64 placeholder:text-white/10"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                        {(['script', 'board', 'visuals', 'characters', 'locations', 'specs', 'timeline'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setProject(s => ({ ...s, activeTab: tab }))}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === tab ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 px-6">
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Studio Canvas */}
            <div className="flex-1 overflow-hidden relative flex mx-4 mb-4 bg-zinc-950/20 rounded-b-[2.5rem]">
                <main className="flex-1 relative overflow-y-auto custom-scrollbar p-12">
                    <AnimatePresence mode="wait">
                        {activeTab === 'script' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-4xl mx-auto space-y-12"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-4xl font-black tracking-tighter text-white">Neural Script Processor</h2>
                                            <p className="text-sm text-zinc-500 font-medium tracking-wide">Transform raw text into professional scene breakdowns.</p>
                                        </div>
                                        <button 
                                            onClick={handleGeneratePlan}
                                            disabled={isThinking || !project.script}
                                            className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isThinking ? (
                                                <Sparkles className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-4 h-4" />
                                            )}
                                            Generate Storyboard
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-[1px] bg-white/5"></div>
                                        <button 
                                            onClick={async () => {
                                                setIsThinking(true);
                                                const prompt = `Refine this movie script for better cinematic pacing and clearer visual descriptions. Keep the core story same but make it more 'directable'.\n\nScript: ${project.script}`;
                                                const refined = await generateShotScript([{ description: project.script }], project.aiConfig); // Reusing logic
                                                setProject(s => ({ ...s, script: refined }));
                                                setIsThinking(false);
                                            }}
                                            className="px-4 py-2 bg-white/5 border border-white/10 text-white/40 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                                        >
                                            Refine Screenplay with AI
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Visual Style</label>
                                            <select 
                                                value={project.visualStyle}
                                                onChange={e => setProject(s => ({ ...s, visualStyle: e.target.value }))}
                                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-rose-500/50 transition-colors"
                                            >
                                                {VISUAL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Aspect Ratio</label>
                                            <select 
                                                value={project.aspectRatio}
                                                onChange={(e) => setProject(s => ({ ...s, aspectRatio: e.target.value as AspectRatio }))}
                                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-rose-500/50 transition-colors"
                                            >
                                                <option value="16:9">Cinematic (16:9)</option>
                                                <option value="9:16">Vertical (9:16)</option>
                                                <option value="1:1">Square (1:1)</option>
                                                <option value="4:3">Classic (4:3)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Complexity</label>
                                            <div className="flex gap-2 p-2 bg-zinc-900 rounded-2xl border border-white/5">
                                                {['Fast', 'Refined', 'Precision'].map(m => (
                                                    <button key={m} className={cn("flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest", m === 'Refined' ? "bg-white text-black" : "text-white/40 hover:text-white")}>
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-[40px] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                                    <textarea 
                                        value={project.script}
                                        onChange={e => setProject(s => ({ ...s, script: e.target.value }))}
                                        placeholder="Paste your script, scene description, or raw narrative here... Be as detailed as possible."
                                        className="relative w-full h-[500px] bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-12 text-lg font-medium text-white/90 leading-relaxed outline-none focus:border-white/10 transition-all resize-none shadow-2xl custom-scrollbar"
                                    />
                                    <div className="absolute bottom-8 right-8 flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Type to begin the narrative</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'board' && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-12"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black tracking-tighter text-white">Sequence Board</h2>
                                        <p className="text-sm text-zinc-500 font-medium tracking-wide">Orchestrating {project.scenes.length} cinematic frames.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                            <Layout className="w-3.5 h-3.5" />
                                            Grid Mode
                                        </button>
                                        <button 
                                            onClick={() => setProject(s => ({ ...s, isPlaying: true, currentPlayIndex: 0 }))}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                        >
                                            <Play className="w-3.5 h-3.5" />
                                            Start Animatic
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                                    {project.scenes.map((scene, idx) => (
                                        <motion.div 
                                            key={scene.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group relative cursor-pointer"
                                            onClick={() => {
                                                setSelectedSceneId(scene.id);
                                                setShowSceneEditor(true);
                                            }}
                                        >
                                            <div className={cn(
                                                "aspect-video rounded-[32px] bg-zinc-900/50 border border-white/5 overflow-hidden relative group-hover:border-rose-500/50 transition-all shadow-2xl",
                                                project.aspectRatio === '9:16' && "aspect-[9/16]",
                                                project.aspectRatio === '1:1' && "aspect-square"
                                            )}>
                                                {/* Reorder Controls */}
                                                <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); reorderScene(idx, 'up'); }}
                                                        className="p-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 text-white/40 hover:text-white"
                                                    >
                                                        <ChevronLeft className="w-4 h-4 rotate-90" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); reorderScene(idx, 'down'); }}
                                                        className="p-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 text-white/40 hover:text-white"
                                                    >
                                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                                    </button>
                                                </div>

                                                {scene.image ? (
                                                    <img src={`data:${scene.image.mimeType};base64,${scene.image.base64}`} className="w-full h-full object-cover" />
                                                ) : scene.isLoading ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                                        <div className="w-12 h-12 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                                                        <span className="text-[10px] font-black text-rose-500 tracking-widest animate-pulse">RENDERING...</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Camera className="w-10 h-10 text-white/5" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleGenerateImage(scene.id);
                                                                }}
                                                                className="px-6 py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                                Render Concept
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-xs font-black text-white">
                                                    {scene.sequence}
                                                </div>
                                            </div>

                                            <div className="mt-6 space-y-2 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">{scene.shotType}</span>
                                                    <div className="h-[1px] flex-1 bg-white/5"></div>
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{scene.duration}</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-white/80 line-clamp-1 group-hover:text-white transition-colors uppercase tracking-tight">{scene.description || "Enter scene details..."}</h4>
                                                <p className="text-[11px] text-zinc-500 font-medium tracking-wide line-clamp-2 italic leading-relaxed">
                                                    {scene.dialogue || "No dialogue specified."}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            const newScene: StoryboardScene = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                sequence: project.scenes.length + 1,
                                                description: '',
                                                visualPrompt: '',
                                                image: null,
                                                dialogue: '',
                                                shotType: 'Medium Shot',
                                                cameraMovement: 'Static',
                                                lighting: 'Natural',
                                                duration: '3.0s',
                                                notes: '',
                                                location: '',
                                                isLoading: false,
                                                error: null
                                            };
                                            setProject(s => ({ ...s, scenes: [...s.scenes, newScene] }));
                                        }}
                                        className="aspect-video rounded-[32px] border border-dashed border-white/10 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-4 text-white/20 hover:text-white/40 group"
                                    >
                                        <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-all">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add New Frame</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'visuals' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-4xl font-black tracking-tighter text-white">Visual DNA</h2>
                                        <p className="text-sm text-zinc-500 font-medium tracking-wide">Generate style concepts to lock in the cinematic mood.</p>
                                    </div>
                                    <button 
                                        onClick={handleGenerateMoodboard}
                                        disabled={isThinking || !project.script}
                                        className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate Moodboard
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {project.moodboardConcepts.map((concept, idx) => (
                                        <div key={idx} className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-6 group overflow-hidden relative">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-2xl font-black text-white italic">{concept.title}</h3>
                                                <button 
                                                    onClick={() => handleGenerateMoodImage(concept.title)}
                                                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-zinc-400 font-medium leading-relaxed">{concept.description}</p>
                                            
                                            <div className="aspect-video rounded-3xl bg-black/40 border border-white/5 overflow-hidden relative">
                                                {concept.image ? (
                                                    <img src={`data:${concept.image.mimeType};base64,${concept.image.base64}`} className="w-full h-full object-cover" />
                                                ) : (
                                                     <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                                        <Camera className="w-8 h-8 text-white/5" />
                                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Awaiting Render</span>
                                                     </div>
                                                )}
                                            </div>
                                            <div className="p-4 bg-black/20 rounded-2xl">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">AI Prompt Hook</p>
                                                <p className="text-[11px] text-zinc-300 font-mono line-clamp-2 italic">{concept.prompt}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'characters' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="space-y-1">
                                        <h2 className="text-4xl font-black tracking-tighter text-white">Visual Casting</h2>
                                        <p className="text-sm text-zinc-500 font-medium tracking-wide">Define character consistency and traits.</p>
                                    </div>
                                    <button 
                                        onClick={handleGenerateCharacters}
                                        disabled={isThinking || !project.script}
                                        className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all"
                                    >
                                        <Users className="w-4 h-4" />
                                        Extract Profiles
                                    </button>
                                </div>

                                {project.characterProfiles ? (
                                    <div className="prose prose-invert max-w-none bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-12 custom-markdown shadow-2xl">
                                        <Markdown>{project.characterProfiles}</Markdown>
                                    </div>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center gap-6 text-white/10">
                                        <Users className="w-32 h-32" />
                                        <p className="text-sm font-black uppercase tracking-widest">No character profiles generated yet.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'locations' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="space-y-1">
                                        <h2 className="text-4xl font-black tracking-tighter text-white">World Building</h2>
                                        <p className="text-sm text-zinc-500 font-medium tracking-wide">Atmosphere and location scouting.</p>
                                    </div>
                                    <button 
                                        onClick={handleGenerateLocations}
                                        disabled={isThinking || !project.script}
                                        className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        Scout Locations
                                    </button>
                                </div>

                                {project.locationGuide ? (
                                    <div className="prose prose-invert max-w-none bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-12 custom-markdown shadow-2xl">
                                        <Markdown>{project.locationGuide}</Markdown>
                                    </div>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center gap-6 text-white/10">
                                        <MapPin className="w-32 h-32" />
                                        <p className="text-sm font-black uppercase tracking-widest">No location guide generated yet.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'specs' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-full">
                                <div className="flex items-center justify-between mb-12 px-4">
                                    <div className="space-y-1">
                                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Production Shot List</h2>
                                        <p className="text-sm text-zinc-500 font-medium tracking-wide">Dense technical breakdown for camera and lighting crews.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button className="px-6 py-3 bg-white/5 border border-white/10 text-white/40 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:text-white transition-all">
                                            <ListFilter className="w-4 h-4" />
                                            Filter by Shot
                                        </button>
                                        <button 
                                            onClick={handleExportScript}
                                            className="px-6 py-3 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-rose-600 transition-all"
                                        >
                                            <FileDigit className="w-4 h-4" />
                                            Export Production Script
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">ID</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Shot / Movement</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Action & Narrative</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Audio / Dialogue</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Lighting / Env</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Dur</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {project.scenes.map((scene) => (
                                                <tr key={scene.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-4 align-top">
                                                        <span className="text-xs font-black text-rose-500">#{scene.sequence.toString().padStart(2, '0')}</span>
                                                    </td>
                                                    <td className="p-4 align-top">
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-black uppercase text-white tracking-tight">{scene.shotType}</p>
                                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{scene.cameraMovement}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-top max-w-sm">
                                                        <p className="text-xs font-bold text-white/60 leading-relaxed italic">{scene.description}</p>
                                                    </td>
                                                    <td className="p-4 align-top max-w-xs">
                                                        <p className="text-xs font-black text-emerald-500/80 uppercase tracking-tight">{scene.dialogue || "-"}</p>
                                                    </td>
                                                    <td className="p-4 align-top">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">{scene.lighting}</p>
                                                            <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase">{scene.location}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-top">
                                                        <span className="text-[10px] font-black text-white/40">{scene.duration}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'timeline' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="space-y-1">
                                        <h2 className="text-4xl font-black tracking-tighter text-white">Animatic Timeline</h2>
                                        <p className="text-sm text-zinc-500 font-medium tracking-wide">Timed sequence playback and audio synchrony.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => setProject(s => ({ ...s, isPlaying: !s.isPlaying }))}
                                            className={cn(
                                                "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-xl",
                                                project.isPlaying ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-white text-black shadow-white/20"
                                            )}
                                        >
                                            {project.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                            {project.isPlaying ? 'Stop Playback' : 'Start Playback'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 bg-zinc-900/30 border border-white/5 rounded-[40px] overflow-hidden flex flex-col items-center justify-center relative p-8 group">
                                    {project.scenes.length > 0 ? (
                                        <>
                                            <div className={cn(
                                                "w-full h-full max-w-4xl flex flex-col items-center justify-center transition-all duration-700",
                                                project.isPlaying ? "scale-100" : "scale-95 opacity-50 blur-sm"
                                            )}>
                                                <div className={cn(
                                                    "overflow-hidden rounded-3xl shadow-2xl relative border border-white/10",
                                                    project.aspectRatio === '16:9' ? "aspect-video w-full" : 
                                                    project.aspectRatio === '9:16' ? "aspect-[9/16] h-full" : "aspect-square h-full"
                                                )}>
                                                    <AnimatePresence mode="wait">
                                                        <motion.div
                                                            key={project.currentPlayIndex}
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -20 }}
                                                            className="absolute inset-0"
                                                        >
                                                            {project.scenes[project.currentPlayIndex]?.image ? (
                                                                <img 
                                                                    src={`data:${project.scenes[project.currentPlayIndex].image?.mimeType};base64,${project.scenes[project.currentPlayIndex].image?.base64}`} 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center gap-4">
                                                                    <Camera className="w-12 h-12 text-white/5" />
                                                                    <span className="text-[10px] font-black text-white/20 tracking-widest uppercase">Visual Missing</span>
                                                                </div>
                                                            )}
                                                            {/* Caption Overlay */}
                                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-12 pt-24">
                                                                 <div className="max-w-2xl mx-auto space-y-4">
                                                                     <p className="text-sm font-black text-emerald-400 text-center uppercase tracking-widest drop-shadow-lg">
                                                                        {project.scenes[project.currentPlayIndex]?.dialogue}
                                                                     </p>
                                                                     <p className="text-xs font-bold text-white/40 text-center uppercase tracking-[0.3em]">
                                                                        {project.scenes[project.currentPlayIndex]?.description}
                                                                     </p>
                                                                 </div>
                                                            </div>
                                                        </motion.div>
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="absolute bottom-12 inset-x-12 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div 
                                                    className="h-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: `${((project.currentPlayIndex + 1) / project.scenes.length) * 100}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <Play className="w-20 h-20 text-white/5 mx-auto" />
                                            <p className="text-xs font-black uppercase tracking-widest text-white/20">Generate a Board to Begin Playback</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* Intelligent Sidebar (Contextual) */}
                <aside className="w-[450px] border-l border-white/5 bg-zinc-950/40 backdrop-blur-3xl overflow-y-auto custom-scrollbar flex flex-col">
                    {showSceneEditor && selectedScene ? (
                        <div className="p-8 space-y-8 animate-in slide-in-from-right duration-500">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 font-black">
                                        {selectedScene.sequence}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Frame Specialist</span>
                                </div>
                                <button 
                                    onClick={() => setShowSceneEditor(false)}
                                    className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                             </div>

                             <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Visual Prompt (AI Refined)</label>
                                    <textarea 
                                        value={selectedScene.visualPrompt}
                                        onChange={e => updateScene(selectedScene.id, { visualPrompt: e.target.value })}
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white/90 leading-relaxed outline-none focus:border-rose-500/50 transition-colors resize-none"
                                    />
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => handleGenerateImage(selectedScene.id)}
                                            className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                                        >
                                            Regenerate Visual
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Shot Type</label>
                                        <select 
                                            value={selectedScene.shotType}
                                            onChange={e => updateScene(selectedScene.id, { shotType: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white appearance-none outline-none"
                                        >
                                            {SHOT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Movement</label>
                                        <select 
                                            value={selectedScene.cameraMovement}
                                            onChange={e => updateScene(selectedScene.id, { cameraMovement: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white appearance-none outline-none"
                                        >
                                            {CAMERA_MOVEMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Dialogue / Audio</label>
                                    <textarea 
                                        value={selectedScene.dialogue}
                                        onChange={e => updateScene(selectedScene.id, { dialogue: e.target.value })}
                                        rows={2}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white/90 outline-none focus:border-rose-500/50 transition-colors resize-none"
                                        placeholder="Enter character dialogue..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Scene Action</label>
                                    <textarea 
                                        value={selectedScene.description}
                                        onChange={e => updateScene(selectedScene.id, { description: e.target.value })}
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white/60 outline-none focus:border-rose-500/50 transition-colors resize-none"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" />
                                        Director's Verdict
                                    </h5>
                                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                                        <p className="text-[11px] text-white/70 font-medium leading-relaxed italic">
                                            {critique || "Analyzing cinematic grammar..."}
                                        </p>
                                    </div>
                                </div>
                             </div>

                             <div className="pt-8 border-t border-white/5 space-y-4">
                                <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Metadata</h5>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Location</span>
                                        <p className="text-[11px] font-black text-white/60">{selectedScene.location}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Duration</span>
                                        <p className="text-[11px] font-black text-white/60">{selectedScene.duration}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Lighting</span>
                                        <p className="text-[11px] font-black text-white/60">{selectedScene.lighting}</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col p-8">
                             <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
                                <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-rose-500/20 rotate-6 group-hover:rotate-12 transition-transform">
                                    <Info className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white tracking-widest uppercase">Select a Frame</h3>
                                    <p className="text-xs text-white/40 leading-relaxed font-medium">Select a scene from the sequence to access technical directors controls and visual refinements.</p>
                                </div>
                             </div>

                             <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 mt-auto">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Intelligent Status</span>
                                </div>
                                <p className="text-[11px] text-white/50 leading-relaxed italic">
                                    "Visual consistency is currently maintained based on the script context. Character features and environments will persist across frames."
                                </p>
                             </div>
                        </div>
                    )}
                </aside>
            </div>

            {/* Render Overlay for full-screen previews or animatics */}
            <AnimatePresence>
                {project.isPlaying && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center cursor-none"
                    >
                        <div className="absolute top-8 left-8 flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">LIVE PRODUCTION PREVIEW</span>
                            </div>
                            <div className="h-4 w-[1px] bg-white/10"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Scene {project.currentPlayIndex + 1} of {project.scenes.length}</span>
                        </div>

                        <button 
                            onClick={() => setProject(s => ({ ...s, isPlaying: false }))}
                            className="absolute top-8 right-8 p-4 rounded-2xl bg-white/5 hover:bg-white hover:text-black transition-all group z-50 pointer-events-auto"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        <div className={cn(
                            "w-full h-full max-w-[90vw] max-h-[80vh] flex flex-col items-center justify-center",
                            project.aspectRatio === '16:9' ? "aspect-video" : 
                            project.aspectRatio === '9:16' ? "aspect-[9/16]" : "aspect-square"
                        )}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={project.currentPlayIndex}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="relative w-full h-full rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/10"
                                >
                                    {project.scenes[project.currentPlayIndex]?.image ? (
                                        <img 
                                            src={`data:${project.scenes[project.currentPlayIndex].image?.mimeType};base64,${project.scenes[project.currentPlayIndex].image?.base64}`} 
                                            className="w-full h-full object-cover transition-transform duration-[4000ms] ease-linear transform scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center gap-8">
                                            <div className="w-48 h-48 rounded-full border border-white/5 flex items-center justify-center">
                                                <Camera className="w-16 h-16 text-white/5" />
                                            </div>
                                            <h3 className="text-3xl font-black text-white/10 uppercase tracking-[0.5em]">Scene {project.currentPlayIndex + 1} Missing</h3>
                                        </div>
                                    )}

                                    {/* HUD Overlays */}
                                    <div className="absolute inset-x-8 top-8 flex justify-between pointer-events-none">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest drop-shadow-lg">Lens Type</span>
                                            <span className="text-xs font-black text-white uppercase tracking-tight drop-shadow-lg">{project.scenes[project.currentPlayIndex]?.shotType}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest drop-shadow-lg">Duration</span>
                                            <span className="text-xs font-black text-white uppercase tracking-tight drop-shadow-lg">{project.scenes[project.currentPlayIndex]?.duration}</span>
                                        </div>
                                    </div>

                                    {/* Dialogue / Script Hud */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-24 pb-16">
                                        <div className="max-w-4xl mx-auto space-y-6 text-center">
                                            <motion.p 
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)] uppercase tracking-wide leading-relaxed"
                                            >
                                                {project.scenes[project.currentPlayIndex]?.dialogue}
                                            </motion.p>
                                            <motion.p 
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="text-xs font-bold text-white/40 uppercase tracking-[0.4em]"
                                            >
                                                {project.scenes[project.currentPlayIndex]?.description}
                                            </motion.p>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Timeline HUD */}
                        <div className="absolute bottom-8 inset-x-12 flex items-center gap-8">
                            <div className="flex-1 h-[2px] bg-white/5 rounded-full relative overflow-hidden">
                                <motion.div 
                                    className="absolute inset-y-0 left-0 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${((project.currentPlayIndex + 1) / project.scenes.length) * 100}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">FPS</span>
                                    <span className="text-xs font-black text-white/60 tracking-tight italic">24.000</span>
                                </div>
                                <div className="h-6 w-[1px] bg-white/10"></div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Timecode</span>
                                    <span className="text-xs font-black text-white tracking-widest italic">
                                        00:00:{project.currentPlayIndex.toString().padStart(2, '0')}:00
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {isThinking && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center gap-8"
                    >
                        <div className="relative">
                            <div className="w-32 h-32 border-4 border-white/5 rounded-full border-t-rose-500 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-rose-500 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h4 className="text-2xl font-black tracking-[0.3em] text-white uppercase animate-pulse">Neural Synthesizing</h4>
                            <p className="text-xs text-white/30 font-black uppercase tracking-widest">Directors Intelligence is processing the narrative arc...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
