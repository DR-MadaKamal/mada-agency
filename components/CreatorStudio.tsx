
import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useGlobalShortcuts } from '../lib/useGlobalShortcuts';
import { useToast } from '../lib/useToast';
import { CreatorStudioProject, ImageFile, CreativeMode } from '../types';
import { analyzeStyleImage, translateText, generateImage, editImage, expandImage } from '../services/geminiService';
import { logHistory } from '../lib/admin';
import { resizeImage } from '../utils';
import CustomizationPanel from './CustomizationPanel';
import ImageWorkspace from './ImageWorkspace';
import PromptEditor from './PromptEditor';
import HistoryPanel from './HistoryPanel';
import ResultDisplay from './ResultDisplay';
import AISelector from './AISelector';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Layers, Beaker, Wand2, Palette, Zap, Box, Wind, Camera, Plus, Download, Image as ImageIcon, Clock, SlidersHorizontal, Minus, Maximize2, RotateCcw, Trash2, Bookmark, History, RefreshCw } from 'lucide-react';
import { AILoadingOverlay } from '../lib/AILoadingOverlay';
import { ShareableLink } from './ShareableLink';
import { CommentsOverlay } from './CommentsOverlay';
import { VersionTimeline } from './VersionTimeline';
import { TemplatePicker } from './TemplatePicker';

interface CreatorStudioProps {
  project: CreatorStudioProject;
  setProject: React.Dispatch<React.SetStateAction<CreatorStudioProject>>;
}

const PRO_PRESETS = [
    { id: 'cinematic', label: 'Cinematic Cinematic', icon: Camera, prompt: 'Cinematic film aesthetic, anamorphic lens flares, ultra-detailed textures, moody volumetric lighting, 8k raw photo.' },
    { id: 'minimalist', label: 'Minimalist Zen', icon: Wand2, prompt: 'Minimalist composition, clean surgical white space, soft diffused top lighting, focus on product form, elegant simplicity.' },
    { id: 'vaporwave', label: 'Retro Neon', icon: Wind, prompt: '80s vaporwave aesthetic, vibrant neon pink and cyan lighting, retro-futuristic grid background, nostalgic hazy atmosphere.' },
    { id: 'tech', label: 'Cyber Tech', icon: Box, prompt: 'Hi-tech laboratory setting, holographic interfaces, blue technological glow, carbon fiber surfaces, precision engineering vibe.' },
    { id: 'organic', label: 'Nature Fusion', icon: Sparkles, prompt: 'Organic botanical setting, soft morning sunlight through leaves, morning dew drops, natural wood textures, lush greenery.' },
];

const EXPERIMENTAL_MODES = [
    { id: 'abstract', label: 'Abstract Flow', prompt: 'Fluid abstract geometry, swirling liquid metal, gravity-defying compositions, vibrant color eruptions, non-representational art.' },
    { id: 'sketch', label: 'Hybrid Sketch', prompt: 'Masterful architectural pencil sketch merging into hyper-realistic 3D rendering, creative process aesthetic, ink splatters.' },
    { id: 'glitch', label: 'Digital Glitch', prompt: 'Cybernetic glitch art, data corruption artifacts, RGB chromatic aberration, pixel sorting effects, futuristic digital breakdown.' }
];

const CreatorStudio: React.FC<CreatorStudioProps> = ({
  project,
  setProject,
}) => {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [comments, setComments] = useState<{id: string; author: string; content: string; timestamp: number}[]>([]);
  const [versions, setVersions] = useState<{id: string; timestamp: number; label: string; snapshot: any}[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [redoStack, setRedoStack] = useState<{id: string; timestamp: number; label: string; snapshot: any}[]>([]);
  const { toast } = useToast();

  const recentPrompts = useMemo(() => [...new Set(project.history.slice(-5).map(h => h.prompt))].reverse(), [project.history]);

  const pushVersion = useCallback((label?: string) => {
    setProject(s => {
      const entry = { id: Date.now().toString(), timestamp: Date.now(), label: label || `v${versions.length + 1}`, snapshot: JSON.parse(JSON.stringify(s)) };
      setVersions(prev => [...prev.slice(-49), entry]);
      setCurrentVersionId(entry.id);
      setRedoStack([]);
      return s;
    });
  }, [versions.length, setProject]);

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
  
  const translateTimeoutRef = useRef<number | null>(null);
  const translationRequestCounter = useRef(0);
  const cancelRef = useRef<boolean>(false);

  const updateActiveProjectState = useCallback((updater: (projectDraft: CreatorStudioProject) => void) => {
    setProject(currentProject => {
      const projectToUpdate = { ...currentProject };
      updater(projectToUpdate);
      return projectToUpdate;
    });
  }, [setProject]);

  // Analyze style image
  useEffect(() => {
    if (project?.styleImages?.length > 0 && !project.styleDescription && !project.isAnalyzingStyle && !project.error) {
      const getStyleDescription = async () => {
        updateActiveProjectState(p => { 
          p.isAnalyzingStyle = true;
          p.error = null;
        });
        try {
          const description = await analyzeStyleImage(project.styleImages, project.aiConfig);
          updateActiveProjectState(p => { p.styleDescription = description; });
        } catch (err) {
          console.error(err);
          updateActiveProjectState(p => {
            p.error = err instanceof Error ? err.message : "Could not analyze the style image.";
            p.styleDescription = null;
          });
        } finally {
          updateActiveProjectState(p => { p.isAnalyzingStyle = false; });
        }
      };
      getStyleDescription();
    } else if (project?.styleImages?.length === 0 && project?.styleDescription) {
      updateActiveProjectState(p => { p.styleDescription = null; });
    }
  }, [
    project?.id,
    project?.styleImages, 
    project?.styleDescription,
    project?.isAnalyzingStyle,
    project?.error,
    updateActiveProjectState
  ]);

  // Auto-generate prompt - MODIFIED: only fills if empty and auto-mode is ON
  useEffect(() => {
    if (!project || !project.isPromptAutoGenerated) return;
    
    const { productImages, styleImages, options, isAnalyzingStyle, styleDescription, creativeMode } = project;
    
    if (productImages.length === 0 && styleImages.length === 0 && creativeMode === 'classic') {
      return;
    }

    let newPrompt = `Professional high-end commercial photograph`;
    
    if (creativeMode === 'pro') {
        newPrompt = `Advanced Production Shot: `;
    } else if (creativeMode === 'experimental') {
        newPrompt = `Experimental AI Creation: `;
    }

    if (productImages.length > 0) {
      newPrompt += ` of the subject from the provided image`;
    }
    
    newPrompt += `. 

Setting: Place the subject in a sophisticated and professional new environment.`;

    if (creativeMode === 'pro') {
        newPrompt += ` Use professional staging, 3-point studio lighting, and high-quality textures. Ensure an expensive, editorial look.`;
    }

    newPrompt += `\n\nKey requirements:
- Lighting: ${options.lightingStyle} with professional studio quality.
- Perspective: ${options.cameraPerspective}.
- Mood: ${creativeMode === 'experimental' ? 'Artistic and unconventional' : 'High-end, clean, and professional'}.
- Content Protection: STRICTLY PRESERVE all original text, labels, and branding on the product. DO NOT erase or modify existing writing. NO EXTRA generated text in the scene. 8k resolution, sharp focus, hyper-realistic.`;

    if (styleImages.length > 0) {
      if (isAnalyzingStyle) newPrompt += `\n- Visual Inspiration: Reimagining the reference style...`;
      else if (styleDescription) newPrompt += `\n- Background/Style Essence: ${styleDescription}. Create a similar professional atmosphere.`;
      else newPrompt += `\n- Background/Style Essence: Resembling the provided style reference atmosphere and lighting.`;
    }
    
    if(project.prompt === '') updateActiveProjectState(p => { p.prompt = newPrompt; });
  }, [
    project?.id,
    project?.isPromptAutoGenerated,
    project?.productImages, 
    project?.styleImages, 
    project?.options, 
    project?.isAnalyzingStyle, 
    project?.styleDescription,
    project?.creativeMode,
    updateActiveProjectState
  ]);

  // Translation effect
  useEffect(() => {
    const arabicRegex = /[\u0600-\u06FF]/;
    if (!project || project.isPromptAutoGenerated) {
        if (project?.translatedPrompt || project?.isTranslating) {
            updateActiveProjectState(p => { p.translatedPrompt = null; p.isTranslating = false; });
        }
        return;
    }

    if (translateTimeoutRef.current) clearTimeout(translateTimeoutRef.current);
    const promptToTranslate = project.prompt;

    if (!arabicRegex.test(promptToTranslate) || !promptToTranslate.trim()) {
        if (project.translatedPrompt || project.isTranslating) {
            updateActiveProjectState(p => { p.translatedPrompt = null; p.isTranslating = false; });
        }
        return;
    }

    translateTimeoutRef.current = window.setTimeout(async () => {
        translationRequestCounter.current += 1;
        const currentRequestId = translationRequestCounter.current;
        updateActiveProjectState(p => { p.isTranslating = true; p.error = null; });

        try {
            const translated = await translateText(promptToTranslate, project.aiConfig);
            if (translationRequestCounter.current === currentRequestId) {
                updateActiveProjectState(p => { if (p.prompt === promptToTranslate) p.translatedPrompt = translated; });
            }
        } catch (err) {
            console.error(err);
            if (translationRequestCounter.current === currentRequestId) {
                updateActiveProjectState(p => { p.error = err instanceof Error ? err.message : 'Translation failed.'; });
            }
        } finally {
            if (translationRequestCounter.current === currentRequestId) {
                updateActiveProjectState(p => { p.isTranslating = false; });
            }
        }
    }, 700);
  }, [project?.prompt, project?.isPromptAutoGenerated, updateActiveProjectState]);
  
  const handleGenerate = useCallback(async () => {
    if (!project || !project.prompt) {
      updateActiveProjectState(p => { p.error = 'Please write a prompt or select a mode.'; });
      return;
    }
    cancelRef.current = false;
    const currentPrompt = project.prompt;
    updateActiveProjectState(p => { p.isLoading = true; p.error = null; p.generatedImage = null; });

    try {
      const result = await generateImage(project.productImages, project.prompt, project.styleImages, "1:1", project.aiConfig);
      updateActiveProjectState(p => {
          p.generatedImage = result;
          p.history = [{ image: result, prompt: currentPrompt }, ...p.history];
      });
      await logHistory({
        type: 'image',
        studio: 'creator_studio',
        content: `data:${result.mimeType};base64,${result.base64}`,
        prompt: currentPrompt
      });
    } catch (err) {
      console.error(err);
      updateActiveProjectState(p => { p.error = err instanceof Error ? err.message : 'Generation failed.'; });
    } finally {
      updateActiveProjectState(p => { p.isLoading = false; });
    }
    if (cancelRef.current) return;
  }, [project, updateActiveProjectState]);

  const handleCancelGeneration = useCallback(() => {
    cancelRef.current = true;
    updateActiveProjectState(p => { p.isLoading = false; p.error = 'Generation cancelled'; });
  }, [updateActiveProjectState]);

  // Logic for Step 1: APPLY STOCK BASE
  const handleApplyStockBase = useCallback(() => {
    if (!project) return;
    const current = project.prompt.trim();
    const baseText = current && !current.includes("Stock photo") ? current : "the product";
    
    const updatedPrompt = `Stock photo of ${baseText}, pure white background, professional commercial photography, high-end studio lighting, sophisticated white rim lighting accents, 8k resolution, sharp focus, hyper-realistic, extremely high detail. STRICTLY PRESERVE original branding. NO EXTRA generated text.`;
    
    updateActiveProjectState(p => { 
        p.prompt = updatedPrompt; 
        p.isPromptAutoGenerated = false;
    });
  }, [project, updateActiveProjectState]);

  // NEW: Handle AI Vision Modes
  const handleApplyVisionMode = useCallback((mode: 'fusion' | 'placement') => {
    if (!project) return;
    const { styleDescription } = project;
    
    let updatedPrompt = '';
    const textConstraint = "STRICTLY PRESERVE all original text, labels, and branding. DO NOT modify existing writing. NO EXTRA generated text in the scene.";

    if (mode === 'fusion') {
        updatedPrompt = `Professional Style Fusion: Take the subject from the main image and seamlessly re-render it using the visual style, professional lighting, and artistic mood of the reference image. ${styleDescription ? `Reference context: ${styleDescription}.` : ''} High-end commercial quality, 8k resolution, photorealistic. ${textConstraint}`;
    } else {
        updatedPrompt = `Professional Scene Placement: Extract the subject from the main image and place it professionally into the exact environment, background, and spatial context of the reference image. ${styleDescription ? `Reference context: ${styleDescription}.` : ''} Match the lighting, shadows, and perspective of the reference perfectly for a hyper-realistic result. ${textConstraint}`;
    }
    
    updateActiveProjectState(p => { 
        p.prompt = updatedPrompt; 
        p.isPromptAutoGenerated = false;
    });
  }, [project, updateActiveProjectState]);

  // Logic for Step 2: CHANGE RIM COLOR
  const handleApplyRimColor = useCallback((color: string) => {
    if (!project) return;
    const current = project.prompt;
    
    if (current.includes("rim lighting")) {
        const regex = /(\w+)\s+rim lighting/;
        const updated = current.replace(regex, `${color} rim lighting`);
        updateActiveProjectState(p => { p.prompt = updated; });
    } else {
        updateActiveProjectState(p => { p.prompt = `${current} with ${color} rim lighting accents.`; });
    }
  }, [project, updateActiveProjectState]);

  const handleImageEdit = async (editPromptText: string) => {
    if (!project.generatedImage) return;
    
    updateActiveProjectState(p => { p.isEditing = true; p.error = null; });
    try {
        const result = await editImage(project.generatedImage as ImageFile, editPromptText, project.aiConfig);
        updateActiveProjectState(p => {
            p.generatedImage = result;
            p.history = [{ image: result, prompt: editPromptText }, ...p.history];
        });
        await logHistory({
            type: 'image',
            studio: 'creator_studio',
            content: `data:${result.mimeType};base64,${result.base64}`,
            prompt: editPromptText,
            metadata: { edit: true }
        });
    } catch (err) {
        updateActiveProjectState(p => { p.error = err instanceof Error ? err.message : 'Edit failed'; });
    } finally {
        updateActiveProjectState(p => { p.isEditing = false; });
    }
  };

  const handleExpand = useCallback(async (direction: 'left' | 'right' | 'top' | 'bottom') => {
    if (!project || !project.generatedImage) return;
    
    updateActiveProjectState(p => { p.isExpanding = true; p.error = null; });
    
    try {
      const expansionPrompt = `Outpaint and extend the scene to the ${direction}. Seamlessly maintain the environment, lighting, and subjects. High-end professional photography, hyper-realistic, 8k. Preserve historical consistency with the original center as the core context.`;
      
      const result = await expandImage(project.generatedImage as ImageFile, expansionPrompt);
      
      updateActiveProjectState(p => {
          p.generatedImage = result;
          p.history = [{ image: result, prompt: `Canvas Expansion (${direction})` }, ...p.history];
      });

      await logHistory({
        type: 'image',
        studio: 'creator_studio',
        content: `data:${result.mimeType};base64,${result.base64}`,
        prompt: `Outpainted ${direction}`
      });
    } catch (err) {
      console.error(err);
      updateActiveProjectState(p => { p.error = err instanceof Error ? err.message : 'Expansion failed.'; });
    } finally {
      updateActiveProjectState(p => { p.isExpanding = false; });
    }
  }, [project, updateActiveProjectState]);


  const handleFileUpload = (updater: (files: ImageFile[]) => void, target: 'product' | 'style') => async (files: File[]) => {
      if (!files || files.length === 0) return;
      updateActiveProjectState(p => { p.uploadingTarget = target; p.error = null; });
      let currentError: string | null = null;
      
      const filePromises = files.map(file => {
          return new Promise<ImageFile | null>(async (resolve) => {
              if (!file.type.startsWith('image/')) {
                  if(!currentError) currentError = `File '${file.name}' not supported.`;
                  resolve(null); return;
              }
              try {
                  const resizedFile = await resizeImage(file, 2048, 2048);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                      resolve({ base64: (reader.result as string).split(',')[1], mimeType: resizedFile.type, name: resizedFile.name });
                  };
                  reader.readAsDataURL(resizedFile);
              } catch (err) {
                  resolve(null);
              }
          });
      });

      const results = await Promise.all(filePromises);
      const validImages = results.filter((img): img is ImageFile => img !== null);
      if (validImages.length > 0) {
          updater(validImages);
          
          // Log to central history as "Uploaded Asset"
          for (const img of validImages) {
              logHistory({
                  type: 'image',
                  studio: 'creator_studio',
                  content: `data:${img.mimeType};base64,${img.base64}`,
                  prompt: `Uploaded Asset: ${img.name}`,
                  metadata: { asset: true, originalName: img.name }
              });
          }
      }
      updateActiveProjectState(p => { p.error = currentError; p.uploadingTarget = null; });
  };
  
  const handleSetPrompt = (prompt: string) => updateActiveProjectState(p => {
    p.prompt = prompt;
    p.isPromptAutoGenerated = false;
  });

  const handleApplyPreset = (prompt: string, id: string) => {
      setActivePreset(id);
      updateActiveProjectState(p => {
          p.prompt = `Photorealistic subject from the product image, ${prompt}. STRICTLY PRESERVE branding.`;
          p.isPromptAutoGenerated = false;
      });
  };

  if (!project) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Creative Mode Tabs */}
        <div className="flex items-center justify-between glass-card p-1.5 rounded-2xl border border-white/5 max-w-2xl mx-auto w-full">
            {[
                { id: 'classic', label: 'Classic Studio', icon: Layers, desc: 'Legacy creative tools' },
                { id: 'pro', label: 'Pro Studio', icon: Wand2, desc: 'Advanced AI production' },
                { id: 'experimental', label: 'Experimental', icon: Beaker, desc: 'Cutting-edge styles' }
            ].map((mode) => (
                <button
                    key={mode.id}
                    onClick={() => updateActiveProjectState(p => { p.creativeMode = mode.id as CreativeMode; p.prompt = ''; })}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all relative group ${project.creativeMode === mode.id ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                >
                    <mode.icon className={`w-5 h-5 ${project.creativeMode === mode.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                    <span className={`text-[8px] font-medium opacity-60 ${project.creativeMode === mode.id ? 'block' : 'hidden md:block'}`}>{mode.desc}</span>
                    {project.creativeMode === mode.id && (
                        <motion.div layoutId="creative-mode-glow" className="absolute inset-0 bg-white/20 rounded-xl blur-lg pointer-events-none" />
                    )}
                </button>
            ))}
        </div>

        <div className="flex items-center justify-between">
            <div />
            <div className="flex items-center gap-2">
                <ShareableLink projectId={project.id} projectName={project.name} />
                <CommentsOverlay targetId={project.id} comments={comments} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} />
                <VersionTimeline versions={versions} currentVersionId={currentVersionId} onRestore={(v) => { setProject(v.snapshot); setCurrentVersionId(v.id); }} onUndo={handleUndo} onRedo={handleRedo} canUndo={versions.length > 1} canRedo={redoStack.length > 0} />
                <button onClick={() => setShowTemplatePicker(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                    <Plus className="w-3 h-3" />
                    Template
                </button>
            </div>
        </div>

        <main className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12 items-start">
            <div className="flex flex-col gap-6 order-1">
                {/* Visual Context Info */}
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${project.creativeMode === 'classic' ? 'bg-blue-500/10 text-blue-400' : project.creativeMode === 'pro' ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {project.creativeMode === 'classic' ? <Zap className="w-5 h-5" /> : project.creativeMode === 'pro' ? <Wand2 className="w-5 h-5" /> : <Beaker className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-tighter">
                                {project.creativeMode === 'classic' && 'Classic Interface'}
                                {project.creativeMode === 'pro' && 'Pro Neural Engine'}
                                {project.creativeMode === 'experimental' && 'Experimental Lab'}
                            </h2>
                            <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Selected Studio Layer</p>
                        </div>
                    </div>
                    <AISelector 
                        config={project.aiConfig || { provider: 'google', modelId: 'gemini-2.1-flash' }} 
                        onChange={(cfg) => updateActiveProjectState(p => { p.aiConfig = cfg; })}
                        studioId="creator_studio"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-3 rounded-3xl flex flex-col gap-2 items-center border border-white/5 hover:border-white/10 transition-colors">
                        <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Master Identity</h3>
                        <ImageWorkspace
                            id="creator-product-uploader"
                            images={project.productImages}
                            onImagesUpload={handleFileUpload(files => updateActiveProjectState(p => { p.productImages = [...p.productImages, ...files]; }), 'product')}
                            onImageRemove={(idx) => updateActiveProjectState(p => { p.productImages = p.productImages.filter((_, i) => i !== idx); })}
                            isUploading={project.uploadingTarget === 'product'}
                            onImageUpdate={(idx, img) => updateActiveProjectState(p => { p.productImages[idx] = img; })}
                        />
                    </div>
                    <div className="glass-card p-3 rounded-3xl flex flex-col gap-2 items-center border border-white/5 hover:border-white/10 transition-colors">
                        <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Atmospheric Key</h3>
                        <ImageWorkspace 
                            id="creator-style-uploader"
                            title="Style Image"
                            images={project.styleImages}
                            onImagesUpload={handleFileUpload(files => updateActiveProjectState(p => { p.styleImages = [...p.styleImages, ...files]; p.styleDescription = null; }), 'style')}
                            onImageRemove={(idx) => updateActiveProjectState(p => { p.styleImages = p.styleImages.filter((_, i) => i !== idx); p.styleDescription = null; })}
                            isUploading={project.uploadingTarget === 'style'}
                            onImageUpdate={(idx, img) => updateActiveProjectState(p => { p.styleImages[idx] = img; p.styleDescription = null; })}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Aspect</span>
                        <select value={project.aspectRatio} onChange={e => setProject(s => ({ ...s, aspectRatio: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none">
                            {['1:1','16:9','9:16','4:3','3:4'].map(r => <option key={r} value={r} className="bg-gray-900">{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Batch</span>
                        <input type="number" min={1} max={4} value={project.batchCount} onChange={e => setProject(s => ({ ...s, batchCount: Math.max(1, Math.min(4, +e.target.value)) }))} className="w-10 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none text-center" />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest shrink-0">Style Strength</span>
                        <input type="range" min={0} max={100} value={project.styleStrength} onChange={e => setProject(s => ({ ...s, styleStrength: +e.target.value }))} className="w-full accent-[var(--color-accent)]" />
                        <span className="text-[9px] font-mono text-white/60 w-6 text-right">{project.styleStrength}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-white/30" />
                        <span className="text-[8px] font-black text-white/20 font-mono">{project.lastGenerationTime ? `${project.lastGenerationTime}ms` : '---'}</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {project.creativeMode === 'pro' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3 px-2">
                                <Palette className="w-4 h-4 text-[var(--color-accent)]" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Pro Neural Presets</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {PRO_PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => handleApplyPreset(preset.prompt, preset.id)}
                                        className={`group flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${activePreset === preset.id ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className={`p-3 rounded-xl transition-all ${activePreset === preset.id ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10'}`}>
                                            <preset.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-center">{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {project.creativeMode === 'classic' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <CustomizationPanel options={project.options} setOptions={(opt) => updateActiveProjectState(p => { p.options = opt; })} />
                        </motion.div>
                    )}

                    {project.creativeMode === 'experimental' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3 px-2">
                                <Beaker className="w-4 h-4 text-amber-500" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Experimental Neural Labs</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {EXPERIMENTAL_MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => handleApplyPreset(mode.prompt, mode.id)}
                                        className={`group p-6 rounded-2xl border transition-all text-left relative overflow-hidden ${activePreset === mode.id ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="relative z-10">
                                            <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${activePreset === mode.id ? 'text-amber-400' : 'text-white/60 group-hover:text-white'}`}>{mode.label}</h4>
                                            <p className="text-[9px] text-white/30 leading-relaxed font-medium">Inject {mode.id} neural patterns into synthesis</p>
                                        </div>
                                        <Beaker className="absolute -right-4 -bottom-4 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="glass-card rounded-[32px] overflow-hidden border border-white/5">
                    <PromptEditor
                        prompt={project.prompt}
                        setPrompt={handleSetPrompt}
                        isAutoGenerated={project.isPromptAutoGenerated}
                        onResetPrompt={() => updateActiveProjectState(p => { p.isPromptAutoGenerated = !p.isPromptAutoGenerated; })}
                        translatedPrompt={project.translatedPrompt}
                        isTranslating={project.isTranslating}
                        onUseTranslation={(t) => updateActiveProjectState(p => { p.prompt = t; p.isPromptAutoGenerated = false; p.translatedPrompt = null; })}
                        onApplyStockBase={handleApplyStockBase}
                        onApplyRimColor={handleApplyRimColor}
                        onApplyVisionMode={handleApplyVisionMode}
                    />
                </div>

                <div className="flex flex-wrap items-start gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
                    <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Negative Prompt</span>
                            {project.negativePrompt && <button onClick={() => setProject(s => ({ ...s, negativePrompt: '' }))} className="text-[7px] text-red-400/60 hover:text-red-400"><Trash2 className="w-2.5 h-2.5" /></button>}
                        </div>
                        <input value={project.negativePrompt} onChange={e => setProject(s => ({ ...s, negativePrompt: e.target.value }))} placeholder="e.g. blurry, low quality, text, watermark" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white/70 outline-none focus:border-white/20 placeholder:text-white/20" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <button onClick={() => {
                            const name = prompt('Template name:');
                            if (name && project.prompt) setProject(s => ({ ...s, savedPrompts: [...s.savedPrompts, { name, prompt: s.prompt }] }));
                        }} disabled={!project.prompt} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all disabled:opacity-30 flex items-center gap-1">
                            <Bookmark className="w-2.5 h-2.5" /> Save Prompt
                        </button>
                    </div>
                    {project.savedPrompts.length > 0 && (
                        <div className="w-full flex flex-wrap gap-1">
                            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest self-center">Saved:</span>
                            {project.savedPrompts.map((sp, i) => (
                                <button key={i} onClick={() => setProject(s => ({ ...s, prompt: sp.prompt }))} className="px-2 py-1 bg-white/5 rounded-lg text-[7px] font-bold text-white/40 hover:text-white transition-all truncate max-w-[120px]">{sp.name}</button>
                            ))}
                        </div>
                    )}
                    <div className="w-full flex flex-wrap gap-1 min-h-[18px]">
                        <History className="w-2.5 h-2.5 self-center text-white/20" />
                        {recentPrompts.map((p, i) => (
                            <button key={i} onClick={() => setProject(s => ({ ...s, prompt: p }))} className="px-2 py-0.5 bg-white/5 rounded text-[7px] font-bold text-white/30 hover:text-white/60 transition-all truncate max-w-[100px]">{p.slice(0, 30)}</button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={project.isLoading || !project.prompt || !!project.uploadingTarget}
                    className="w-full relative group overflow-hidden bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-black py-6 rounded-[32px] text-xl shadow-2xl shadow-[var(--color-accent)]/30 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:transform-none uppercase tracking-[0.2em]"
                >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {project.isLoading ? (
                            <>
                                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                Splicing Neural Layers...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6" />
                                Generate AI Creation
                            </>
                        )}
                    </span>
                </button>

                {project.error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest"
                    >
                        {project.error}
                    </motion.div>
                )}
            </div>

            <div className="flex flex-col gap-6 order-2">
                 <div className="relative">
                    <div className="glass-card rounded-[40px] p-8 min-h-[500px] border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--color-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <ResultDisplay 
                            imageFile={project.generatedImage} 
                            isLoading={project.isLoading}
                            onEdit={handleImageEdit}
                            onExpand={handleExpand}
                            isEditing={project.isEditing}
                            isExpanding={project.isExpanding}
                        />
                    </div>
                    {project.isLoading && <AILoadingOverlay message="Generating image..." onCancel={handleCancelGeneration} />}
                    {project.generatedImage && !project.isLoading && (
                        <div className="flex gap-2 mt-4 justify-center">
                            <button onClick={() => {
                                const a = document.createElement('a');
                                a.href = `data:${project.generatedImage!.mimeType};base64,${project.generatedImage!.base64}`;
                                a.download = `creation-${Date.now()}.${project.generatedImage!.mimeType.split('/')[1] || 'png'}`;
                                a.click();
                            }} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
                                <Download className="w-3 h-3" /> Download
                            </button>
                            {project.history.length >= 2 && (
                                <button onClick={() => setProject(s => ({ ...s, showComparison: !s.showComparison }))} className={`px-4 py-2 border rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${project.showComparison ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/30 text-[var(--color-accent)]' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                                    <Maximize2 className="w-3 h-3" /> Compare
                                </button>
                            )}
                        </div>
                    )}
                    {project.showComparison && project.history.length >= 2 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {project.history.slice(-2).map((h, i) => (
                                <div key={i} className="rounded-xl overflow-hidden bg-white/5 border border-white/5">
                                    <img src={`data:${h.image.mimeType};base64,${h.image.base64}`} alt="" className="w-full aspect-square object-cover" />
                                    <p className="text-[7px] font-black text-white/30 uppercase tracking-widest text-center py-1">{i === 0 ? 'Previous' : 'Current'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {project.generatedImage && !project.isLoading && (
                        <div className="mt-4 flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                            <ImageIcon className="w-4 h-4 text-white/20" />
                            <div className="flex-1 text-[9px] font-mono text-white/40 space-y-0.5">
                                <p>Type: {project.generatedImage.mimeType}</p>
                                <p>Size: {Math.round(project.generatedImage.base64.length * 0.75 / 1024)} KB</p>
                            </div>
                        </div>
                    )}
                 </div>
                <HistoryPanel history={project.history} onSelect={(img) => updateActiveProjectState(p => { p.generatedImage = img; })} />
            </div>
        </main>
        {showTemplatePicker && (
            <TemplatePicker
                studioType="creator_studio"
                onSelect={(template) => {
                    setShowTemplatePicker(false);
                    updateActiveProjectState(p => { Object.assign(p, template.defaultData); });
                }}
                onDismiss={() => setShowTemplatePicker(false)}
            />
        )}
    </div>
  );
};

export default CreatorStudio;
