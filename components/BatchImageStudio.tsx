import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { useToast } from '../lib/useToast';
import { MiniAISelector } from './MiniAISelector';
import { Image as ImageIcon, Upload, Sparkles, Loader2, Download, X, Trash2, Check, Copy, RefreshCw, Layers, Camera, Sun, Grid3X3, Eye, Share2, Send, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import type { BatchImageStudioProject, BatchBackgroundType, BatchCameraAngle, BatchLightingPreset, BatchPerspective, AspectRatio, ImageFile, BatchResultItem, ExternalServiceConfig } from '../types';

const CAMERA_ANGLE_LABELS: Record<BatchCameraAngle, string> = { front: 'Front', side: 'Side', three_quarter: '3/4', top: 'Top', bottom: 'Bottom', back: 'Back', close_up: 'Close Up', macro: 'Macro' };
const LIGHTING_LABELS: Record<BatchLightingPreset, string> = { studio: 'Studio', natural: 'Natural', golden_hour: 'Golden Hour', blue_hour: 'Blue Hour', cinematic: 'Cinematic', dramatic: 'Dramatic', soft: 'Soft', harsh: 'Harsh', neon: 'Neon', silhouette: 'Silhouette' };
const PERSPECTIVE_LABELS: Record<BatchPerspective, string> = { eye_level: 'Eye Level', high_angle: 'High Angle', low_angle: 'Low Angle', birds_eye: 'Bird\'s Eye', worms_eye: 'Worm\'s Eye', dutch_angle: 'Dutch Angle' };
const ASPECT_OPTIONS: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

interface BatchImageStudioProps {
  project: BatchImageStudioProject;
  setProject: (action: React.SetStateAction<BatchImageStudioProject>) => void;
}

const BatchImageStudio: React.FC<BatchImageStudioProps> = ({ project, setProject }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('product');

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleUploadProductImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxNew = 5 - project.productImages.length;
    const toProcess = files.slice(0, maxNew);
    const loaded: ImageFile[] = [];
    for (const file of toProcess) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      loaded.push({ base64, mimeType: file.type, name: file.name });
    }
    setProject(s => ({ ...s, productImages: [...s.productImages, ...loaded] }));
    if (e.target) e.target.value = '';
  }, [project.productImages.length, setProject]);

  const removeProductImage = useCallback((idx: number) => {
    setProject(s => ({ ...s, productImages: s.productImages.filter((_, i) => i !== idx) }));
  }, [setProject]);

  const toggleBackgroundType = useCallback((type: BatchBackgroundType) => {
    setProject(s => {
      const exists = s.batchConfig.backgrounds.find(b => b.type === type);
      const others = s.batchConfig.backgrounds.filter(b => b.type !== type);
      if (exists) {
        if (others.length === 0) return s;
        return { ...s, batchConfig: { ...s.batchConfig, backgrounds: others } };
      }
      return { ...s, batchConfig: { ...s.batchConfig, backgrounds: [...others, { type, value: type === 'solid' ? '#ffffff' : '' }] } };
    });
  }, [setProject]);

  const toggleArrayItem = useCallback(<T,>(arr: T[], item: T, min: number = 1): T[] => {
    if (arr.includes(item)) {
      if (arr.length <= min) return arr;
      return arr.filter(i => i !== item);
    }
    return [...arr, item];
  }, []);

  const generateBatch = useCallback(async () => {
    const { productImages, productName, productDescription, batchConfig } = project;
    if (productImages.length === 0 && !productName) {
      toast({ type: 'error', title: 'No product', message: 'Upload a product image or enter a product name' });
      return;
    }
    if (batchConfig.backgrounds.length === 0) {
      toast({ type: 'error', title: 'No background', message: 'Select at least one background option' });
      return;
    }

    const { generateImage } = await import('../services/geminiService');
    const config = project.aiConfig || { provider: 'google', modelId: 'gemini-2.1-flash-image' };

    const combos: { bg: string; cameraAngle: BatchCameraAngle; lighting: BatchLightingPreset; perspective: BatchPerspective }[] = [];
    for (const bg of batchConfig.backgrounds) {
      for (const ca of batchConfig.cameraAngles) {
        for (const lt of batchConfig.lightingPresets) {
          for (const pv of batchConfig.perspectives) {
            combos.push({ bg: bg.type === 'none' ? '' : bg.value, cameraAngle: ca, lighting: lt, perspective: pv });
          }
        }
      }
    }

    const selectedCombos = combos.slice(0, batchConfig.count);

    setProject(s => ({ ...s, isGenerating: true, progress: 0, results: [], error: null }));

    const results: BatchResultItem[] = [];
    let completed = 0;

    for (const combo of selectedCombos) {
      try {
        const bgDesc = combo.bg ? `with ${combo.bg} background. ` : 'with no background (transparent). ';
        const prompt = `Product photography of ${productName || 'the product'}${productDescription ? ': ' + productDescription : ''}. ${bgDesc}Camera angle: ${CAMERA_ANGLE_LABELS[combo.cameraAngle]}. Lighting: ${LIGHTING_LABELS[combo.lighting]}. Perspective: ${PERSPECTIVE_LABELS[combo.perspective]}. Professional product photography, high-end commercial quality, sharp focus, soft shadows, clean composition, 4K, high detail.`;

        const image = await generateImage(productImages, prompt, null, batchConfig.aspectRatio, config);

        results.push({
          id: `${combo.cameraAngle}-${combo.lighting}-${combo.perspective}-${Date.now()}`,
          prompt,
          image,
          config: {
            background: combo.bg || undefined,
            cameraAngle: combo.cameraAngle,
            lighting: combo.lighting,
            perspective: combo.perspective,
            backgroundRemoved: batchConfig.backgroundRemoval,
          },
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        results.push({
          id: `error-${Date.now()}-${Math.random()}`,
          prompt: '',
          image: null,
          config: {
            cameraAngle: combo.cameraAngle,
            lighting: combo.lighting,
            perspective: combo.perspective,
            backgroundRemoved: batchConfig.backgroundRemoval,
          },
          isLoading: false,
          error: err.message || 'Generation failed',
        });
      }
      completed++;
      setProject(s => ({ ...s, progress: Math.round((completed / selectedCombos.length) * 100) }));
    }

    setProject(s => ({ ...s, results, isGenerating: false, progress: 100, activeTab: 'results' }));
    toast({ type: 'success', title: `Generated ${results.length} images` });
  }, [project, setProject, toast]);

  const downloadResult = useCallback((item: BatchResultItem) => {
    if (!item.image) return;
    const link = document.createElement('a');
    link.href = `data:${item.image.mimeType};base64,${item.image.base64}`;
    link.download = `${project.productName || 'product'}-${item.config.cameraAngle}-${item.config.lighting}.${item.image.mimeType.split('/')[1] || 'png'}`;
    link.click();
  }, [project.productName]);

  const copyResult = useCallback(async (item: BatchResultItem) => {
    if (!item.image) return;
    const blob = new Blob([Uint8Array.from(atob(item.image.base64), c => c.charCodeAt(0))], { type: item.image.mimeType });
    await navigator.clipboard.write([new ClipboardItem({ [item.image.mimeType]: blob })]);
    toast({ type: 'success', title: 'Image copied to clipboard' });
  }, [toast]);

  const SectionToggle = ({ id, label, icon }: { id: string; label: string; icon: any }) => {
    const Icon = icon;
    const isOpen = expandedSection === id;
    return (
      <button onClick={() => toggleSection(id)} className="flex items-center justify-between w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.03] rounded-2xl transition-all text-left">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="text-[11px] font-black text-white/60 uppercase tracking-wider">{label}</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
      </button>
    );
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
            <Layers className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase">Batch Image Studio</h2>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">AI Product Photography</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MiniAISelector
            provider={project.aiConfig?.provider || 'google'}
            modelId={project.aiConfig?.modelId || 'gemini-2.1-flash-image'}
            externalServiceConfig={project.aiConfig?.externalServiceConfig}
            onChange={(p, m, esc) => setProject(s => ({ ...s, aiConfig: { provider: p as any, modelId: m, externalServiceConfig: esc } }))}
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${project.isGenerating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{project.isGenerating ? 'Generating' : 'Ready'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Config Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {/* Product Section */}
          <SectionToggle id="product" label="Product" icon={ImageIcon} />
          {expandedSection === 'product' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 px-1">
              <input
                type="text"
                value={project.productName}
                onChange={e => setProject(s => ({ ...s, productName: e.target.value }))}
                placeholder="Product name"
                className="w-full glass-input px-4 py-2.5 rounded-xl text-[11px] font-bold tracking-tight"
              />
              <textarea
                value={project.productDescription}
                onChange={e => setProject(s => ({ ...s, productDescription: e.target.value }))}
                placeholder="Product description (optional)"
                className="w-full glass-input px-4 py-2.5 rounded-xl text-[11px] resize-none h-16"
              />
              <div className="grid grid-cols-3 gap-2">
                {project.productImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 group">
                    <img src={`data:${img.mimeType};base64,${img.base64}`} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeProductImage(i)} className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {project.productImages.length < 5 && (
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-center transition-all">
                    <Upload className="w-5 h-5 text-white/20" />
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUploadProductImage} className="hidden" />
            </motion.div>
          )}

          {/* Background Section */}
          <SectionToggle id="background" label="Background" icon={Sun} />
          {expandedSection === 'background' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 px-1">
              <div className="flex flex-wrap gap-2">
                {(['none', 'solid', 'ai_generated'] as BatchBackgroundType[]).map(type => {
                  const isActive = project.batchConfig.backgrounds.some(b => b.type === type);
                  const labels: Record<string, string> = { none: 'None', solid: 'Solid Color', ai_generated: 'AI Scene' };
                  return (
                    <button key={type} onClick={() => toggleBackgroundType(type)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        isActive ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent)]' : 'bg-white/[0.02] border-white/10 text-white/30 hover:text-white/50'
                      }`}
                    >
                      {labels[type]}
                    </button>
                  );
                })}
              </div>
              {project.batchConfig.backgrounds.map((bg, i) => (
                <div key={i} className="flex items-center gap-2">
                  {bg.type === 'solid' && (
                    <input type="color" value={bg.value || '#ffffff'} onChange={e => {
                      const newBg = [...project.batchConfig.backgrounds];
                      newBg[i] = { ...newBg[i], value: e.target.value };
                      setProject(s => ({ ...s, batchConfig: { ...s.batchConfig, backgrounds: newBg } }));
                    }} className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-white/10" />
                  )}
                  {bg.type === 'ai_generated' && (
                    <input type="text" value={bg.value} onChange={e => {
                      const newBg = [...project.batchConfig.backgrounds];
                      newBg[i] = { ...newBg[i], value: e.target.value };
                      setProject(s => ({ ...s, batchConfig: { ...s.batchConfig, backgrounds: newBg } }));
                    }} placeholder="Describe background scene..." className="flex-1 glass-input px-3 py-2 rounded-xl text-[10px]" />
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* Camera Angles Section */}
          <SectionToggle id="angles" label="Camera Angles" icon={Camera} />
          {expandedSection === 'angles' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 px-1">
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.entries(CAMERA_ANGLE_LABELS) as [BatchCameraAngle, string][]).map(([key, label]) => {
                  const isActive = project.batchConfig.cameraAngles.includes(key);
                  return (
                    <button key={key} onClick={() => setProject(s => ({ ...s, batchConfig: { ...s.batchConfig, cameraAngles: toggleArrayItem(s.batchConfig.cameraAngles, key) } }))}
                      className={`px-2.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-left ${
                        isActive ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent)]' : 'bg-white/[0.02] border-white/10 text-white/30 hover:text-white/50'
                      }`}
                    >{label}</button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Lighting Section */}
          <SectionToggle id="lighting" label="Lighting" icon={Sun} />
          {expandedSection === 'lighting' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 px-1">
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.entries(LIGHTING_LABELS) as [BatchLightingPreset, string][]).map(([key, label]) => {
                  const isActive = project.batchConfig.lightingPresets.includes(key);
                  return (
                    <button key={key} onClick={() => setProject(s => ({ ...s, batchConfig: { ...s.batchConfig, lightingPresets: toggleArrayItem(s.batchConfig.lightingPresets, key) } }))}
                      className={`px-2.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-left ${
                        isActive ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent)]' : 'bg-white/[0.02] border-white/10 text-white/30 hover:text-white/50'
                      }`}
                    >{label}</button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Perspectives Section */}
          <SectionToggle id="perspectives" label="Perspectives" icon={Eye} />
          {expandedSection === 'perspectives' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 px-1">
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.entries(PERSPECTIVE_LABELS) as [BatchPerspective, string][]).map(([key, label]) => {
                  const isActive = project.batchConfig.perspectives.includes(key);
                  return (
                    <button key={key} onClick={() => setProject(s => ({ ...s, batchConfig: { ...s.batchConfig, perspectives: toggleArrayItem(s.batchConfig.perspectives, key) } }))}
                      className={`px-2.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-left ${
                        isActive ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent)]' : 'bg-white/[0.02] border-white/10 text-white/30 hover:text-white/50'
                      }`}
                    >{label}</button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Output Settings */}
          <div className="px-1 pt-2 space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest shrink-0">Aspect Ratio</label>
              <div className="flex gap-1">
                {ASPECT_OPTIONS.map(ar => (
                  <button key={ar} onClick={() => setProject(s => ({ ...s, batchConfig: { ...s.batchConfig, aspectRatio: ar } }))}
                    className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black tracking-wider border transition-all ${
                      project.batchConfig.aspectRatio === ar ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent)]' : 'bg-white/[0.02] border-white/10 text-white/30'
                    }`}
                  >{ar}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest shrink-0">Generate</label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={64} value={project.batchConfig.count}
                  onChange={e => setProject(s => ({ ...s, batchConfig: { ...s.batchConfig, count: Math.max(1, Math.min(64, parseInt(e.target.value) || 1)) } }))}
                  className="w-14 glass-input px-2 py-1.5 rounded-lg text-[10px] font-mono text-center"
                />
                <span className="text-[8px] text-white/20 font-bold">images</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="bg-removal" checked={project.batchConfig.backgroundRemoval}
                onChange={e => setProject(s => ({ ...s, batchConfig: { ...s.batchConfig, backgroundRemoval: e.target.checked } }))}
                className="w-3.5 h-3.5 rounded border-white/20 bg-transparent accent-[var(--color-accent)]"
              />
              <label htmlFor="bg-removal" className="text-[9px] font-black text-white/30 uppercase tracking-widest cursor-pointer">Remove Background</label>
            </div>
          </div>

          {/* Generate Button */}
          <button onClick={generateBatch} disabled={project.isGenerating}
            className="w-full py-3.5 rounded-2xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] disabled:opacity-30 text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-accent)]/20"
          >
            {project.isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {project.progress}%</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Batch</>
            )}
          </button>
        </div>

        {/* Right: Results Panel */}
        <div className="col-span-12 lg:col-span-8">
          {project.isGenerating && (
            <div className="mb-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Generating... {project.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full bg-[var(--color-accent)]" initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>
          )}

          {project.error && (
            <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <p className="text-[10px] font-bold text-red-400">{project.error}</p>
            </div>
          )}

          {project.results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{project.results.filter(r => r.image).length} / {project.results.length} images</span>
                <button onClick={() => {
                  project.results.filter(r => r.image).forEach(downloadResult);
                }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all">
                  <Download className="w-3 h-3" /> Download All
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {project.results.map((item) => (
                  <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-square">
                    {item.image ? (
                      <>
                        <img src={`data:${item.image.mimeType};base64,${item.image.base64}`} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => downloadResult(item)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"><Download className="w-4 h-4 text-white" /></button>
                          <button onClick={() => copyResult(item)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"><Copy className="w-4 h-4 text-white" /></button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[6px] font-black text-white/60 uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded">{CAMERA_ANGLE_LABELS[item.config.cameraAngle]}</span>
                            <span className="text-[6px] font-black text-white/60 uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded">{LIGHTING_LABELS[item.config.lighting]}</span>
                            <span className="text-[6px] font-black text-white/60 uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded">{PERSPECTIVE_LABELS[item.config.perspective]}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <p className="text-[9px] text-red-400 text-center font-bold">{item.error || 'Failed'}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.results.length === 0 && !project.isGenerating && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02]">
              <div className="p-4 rounded-2xl bg-white/5 mb-4">
                <Layers className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-xs font-black text-white/20 uppercase tracking-widest">Configure & Generate</p>
              <p className="text-[9px] text-white/10 mt-1">Select product, angles, lighting, and perspectives</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchImageStudio;
