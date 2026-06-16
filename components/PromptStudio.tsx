
import React, { useState, useCallback } from 'react';
import { PromptStudioProject, ImageFile, PromptStudioHistoryItem, AppView } from '../types';
import { deconstructImageForPrompts, generateProfessionalPrompt } from '../services/geminiService';
import { resizeImage } from '../utils';
import { logHistory } from '../lib/admin';
import ImageWorkspace from './ImageWorkspace';
import AISelector from './AISelector';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy, Check, Sparkles, Image as ImageIcon, Cpu, Target,
    Camera, Zap, Settings2, History, Trash2, Send, Wand2,
    Layers, Aperture, Video, Focus, Box
} from 'lucide-react';

const PARAMETERS = {
    camera: ['Arri Alexa 65', 'RED V-Raptor', 'Sony A7R V', 'Hasselblad H6D', 'iPhone 15 Pro Cinematic'],
    lens: ['35mm Prime f/1.4', '85mm Portrait f/1.2', '24mm Wide-Angle', 'Anamorphic Lens', 'Macro 100mm'],
    lighting: ['Volumetric Fog Lighting', 'Golden Hour', 'Cinematic Rim Light', 'High-Key Studio', 'Natural Soft Window Light'],
    film: ['Kodak Portra 400', 'Fujifilm Velvia', 'Agfa Vista 200', 'Technicolor Stage', 'B&W Tri-X 400']
};

const PromptStudio: React.FC<{
  project: PromptStudioProject;
  setProject: React.Dispatch<React.SetStateAction<PromptStudioProject>>;
  onExport?: (targetView: AppView, data: any) => void;
}> = ({ project, setProject, onExport }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [isDeconstructing, setIsDeconstructing] = useState(false);

    const handleFileUpload = async (files: File[]) => {
      if (!files || files.length === 0) return;
      setProject(s => ({ ...s, isUploading: true, error: null }));
      
      try {
          const uploaded = await Promise.all(files.map(async file => {
              const resizedFile = await resizeImage(file, 1024, 1024);
              const reader = new FileReader();
              return new Promise<ImageFile>(res => {
                  reader.onloadend = () => res({ base64: (reader.result as string).split(',')[1], mimeType: resizedFile.type, name: resizedFile.name });
                  reader.readAsDataURL(resizedFile);
              });
          }));
          setProject(s => ({ ...s, images: [...s.images, ...uploaded], isUploading: false }));
      } catch (err) {
          setProject(s => ({ ...s, error: "Upload failed", isUploading: false }));
      }
    };

    const handleDeconstruct = async () => {
        if (project.images.length === 0) return;
        setIsDeconstructing(true);
        setProject(s => ({ ...s, error: null }));
        try {
            const data = await deconstructImageForPrompts(project.images, project.aiConfig);
            setProject(s => ({ ...s, deconstruction: data }));
        } catch (err) {
            setProject(s => ({ ...s, error: 'Failed to deconstruct image.' }));
        } finally {
            setIsDeconstructing(false);
        }
    };

    const handleGenerate = useCallback(async () => {
        setProject(s => ({ ...s, isLoading: true, error: null }));
        try {
            const prompt = await generateProfessionalPrompt({
                deconstruction: project.deconstruction,
                instructions: project.instructions,
                parameters: project.selectedParameters
            }, project.aiConfig);

            const newHistoryItem: PromptStudioHistoryItem = {
                image: project.images[0] || { base64: '', mimeType: 'image/png', name: 'text-guided' },
                instructions: project.instructions,
                generatedPrompt: prompt,
            };
            
            logHistory({
                type: 'text',
                studio: 'prompt_studio',
                content: prompt,
                prompt: project.instructions || 'Direct synthesis'
            });

            setProject(s => ({
                ...s,
                isLoading: false,
                generatedPrompt: prompt,
                history: [newHistoryItem, ...s.history]
            }));
        } catch (err) {
            setProject(s => ({ ...s, isLoading: false, error: 'Generation failed.' }));
        }
    }, [project.images, project.instructions, project.deconstruction, project.selectedParameters, project.aiConfig, setProject]);

    const updateParam = (type: keyof typeof PARAMETERS, value: string) => {
        setProject(s => ({
            ...s,
            selectedParameters: {
                ...s.selectedParameters,
                [type]: s.selectedParameters?.[type] === value ? undefined : value
            }
        }));
    };

    return (
        <main className="w-full max-w-7xl mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Prompt Studio</h1>
                    <p className="text-white/40 font-medium tracking-widest uppercase text-[10px]">Professional Prompt Engineering Hub</p>
                </div>
                <div className="flex gap-4">
                    <AISelector 
                        config={project.aiConfig || { provider: 'google', modelId: 'gemini-2.1-flash' }} 
                        onChange={(cfg) => setProject(s => ({ ...s, aiConfig: cfg }))}
                        studioId="prompt_studio"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: Input & Analysis */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Image DNA Analysis */}
                    <div className="glass-card rounded-[3rem] p-8 border border-white/5 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-80">
                                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Reference DNA
                                </h3>
                                <div className="aspect-square bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 relative group">
                                    <ImageWorkspace
                                        id="prompt-analysis-workspace"
                                        title=""
                                        images={project.images}
                                        onImagesUpload={handleFileUpload}
                                        onImageRemove={(idx) => setProject(s => ({ ...s, images: s.images.filter((_, i) => i !== idx), deconstruction: null }))}
                                        isUploading={project.isUploading}
                                        onImageUpdate={(idx, img) => setProject(s => {
                                            const next = [...s.images];
                                            next[idx] = img;
                                            return { ...s, images: next, deconstruction: null };
                                        })}
                                    />
                                </div>
                                {project.images.length > 0 && !project.deconstruction && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDeconstruct}
                                        disabled={isDeconstructing}
                                        className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isDeconstructing ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Cpu className="w-3 h-3" />}
                                        {isDeconstructing ? 'Analyzing...' : 'Deconstruct DNA'}
                                    </motion.button>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Professional Objective
                                </h3>
                                <textarea
                                    value={project.instructions}
                                    onChange={e => setProject(s => ({ ...s, instructions: e.target.value }))}
                                    className="w-full h-48 glass-input rounded-[2rem] p-6 text-lg font-medium resize-none mb-6"
                                    placeholder="Describe your vision, subject, or modify the reference style..."
                                />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {['Cinematic', 'Hyper-Real', 'Surreal', 'Architectural'].map(style => (
                                        <button 
                                            key={style}
                                            onClick={() => setProject(s => ({ ...s, instructions: s.instructions ? `${s.instructions}, ${style}` : style }))}
                                            className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/60 transition-all"
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Parameter Grid */}
                    <div className="glass-card rounded-[3rem] p-8 border border-white/5">
                        <div className="flex items-center gap-3 mb-8">
                            <Settings2 className="w-5 h-5 text-[var(--color-accent)]" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Technical Overrides</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {Object.entries(PARAMETERS).map(([category, options]) => (
                                <div key={category} className="space-y-4">
                                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{category}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {options.map(opt => {
                                            const isSelected = project.selectedParameters?.[category as keyof typeof PARAMETERS] === opt;
                                            return (
                                                <button
                                                    key={opt}
                                                    onClick={() => updateParam(category as any, opt)}
                                                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all border ${
                                                        isSelected 
                                                            ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' 
                                                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Results & Deconstruction Flow */}
                <div className="lg:col-span-4 space-y-6">
                    <button
                        onClick={handleGenerate}
                        disabled={project.isLoading || project.isUploading}
                        className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-black py-8 rounded-[2rem] transition-all disabled:opacity-50 shadow-2xl shadow-[var(--color-accent)]/20 flex flex-col items-center gap-2 group"
                    >
                        <Sparkles className={`w-8 h-8 group-hover:scale-125 transition-transform ${project.isLoading ? 'animate-pulse' : ''}`} />
                        <span className="text-xs uppercase tracking-[0.4em]">{project.isLoading ? 'Processing...' : 'Engineer Master Prompt'}</span>
                    </button>

                    <AnimatePresence mode="wait">
                        {project.deconstruction && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-[2.5rem] p-8 border border-white/5 space-y-6"
                            >
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                    <Layers className="w-5 h-5 text-emerald-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">DNA Deconstruction</h3>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(project.deconstruction).map(([key, value]) => (
                                        <div key={key}>
                                            <h4 className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{key}</h4>
                                            <p className="text-[11px] text-white/60 font-medium leading-relaxed italic line-clamp-3">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {project.generatedPrompt && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card rounded-[2.5rem] p-8 border-2 border-[var(--color-accent)]/20 shadow-2xl shadow-[var(--color-accent)]/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Engineered Prompt</h3>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(project.generatedPrompt || '');
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="p-3 bg-white/5 rounded-2xl hover:bg-[var(--color-accent)] transition-colors group"
                                >
                                    {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white group-hover:scale-110" />}
                                </button>
                            </div>
                            <div className="bg-black/40 rounded-2xl p-6 font-mono text-[11px] text-white/80 leading-relaxed max-h-64 overflow-y-auto suggestions-scrollbar border border-white/5">
                                {project.generatedPrompt}
                            </div>
                            
                            <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-4">Deploy to Studio</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => onExport?.('photoshoot_director', { customStylePrompt: project.generatedPrompt, productImages: project.images })}
                                        className="p-4 glass-card border border-white/5 hover:border-[var(--color-accent)]/30 rounded-2xl flex flex-col items-center gap-2 group transition-all"
                                    >
                                        <Camera className="w-4 h-4 text-white/40 group-hover:text-[var(--color-accent)]" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Photoshoot</span>
                                    </button>
                                    <button 
                                        onClick={() => onExport?.('creator_studio', { prompt: project.generatedPrompt, initialImage: project.images[0] })}
                                        className="p-4 glass-card border border-white/5 hover:border-[var(--color-accent)]/30 rounded-2xl flex flex-col items-center gap-2 group transition-all"
                                    >
                                        <Wand2 className="w-4 h-4 text-white/40 group-hover:text-[var(--color-accent)]" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Creator</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* History Section - Sleeker Design */}
            <div className="mt-20">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <History className="w-6 h-6 text-white/20" /> Engineer Archives
                    </h2>
                    <button 
                        onClick={() => setProject(s => ({ ...s, history: [] }))}
                        className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-3 h-3" /> Purge Archives
                    </button>
                </div>
                
                {project.history.length === 0 ? (
                    <div className="glass-card rounded-[3rem] p-20 text-center border border-white/5">
                        <Box className="w-16 h-16 text-white/5 mx-auto mb-6" />
                        <p className="text-white/20 font-black uppercase tracking-widest text-xs">No records found in current session</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {project.history.map((item, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 group hover:border-white/20 transition-all"
                            >
                                <div className="h-48 bg-white/5 relative overflow-hidden">
                                   {item.image.base64 ? (
                                        <img src={`data:${item.image.mimeType};base64,${item.image.base64}`} alt="Ref" className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                   ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-[0.05]">
                                            <Sparkles className="w-24 h-24" />
                                        </div>
                                   )}
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                       <p className="text-[10px] font-bold text-white uppercase tracking-widest truncate w-full">{item.instructions || 'Direct Synthesis'}</p>
                                   </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 max-h-32 overflow-hidden relative">
                                        <p className="text-[10px] font-mono text-white/60 leading-relaxed italic">{item.generatedPrompt}</p>
                                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(item.generatedPrompt);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white/5"
                                    >
                                        <Copy className="w-3 h-3" /> Restore & Copy
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default PromptStudio;

