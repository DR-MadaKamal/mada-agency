import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../lib/useToast';
import { useProjectHistory } from '../lib/useProjectHistory';
import { MiniAISelector } from './MiniAISelector';
import {
  Upload, Loader2, Download, X, Trash2, Check, Copy, ArrowLeftRight, Sparkles,
  ZoomIn, ZoomOut, Maximize, Minimize, Undo2, Redo2, History, Crop,
  Sun, Moon, Palette, Paintbrush, Image, Layers, Grid, Columns, SlidersHorizontal,
  Wand2, Tags, Package, Share2, Archive, Settings2, Lock, Eye, EyeOff,
  Lightbulb, Scissors, Brush, Circle, Hexagon, Star, Group, GripVertical
} from 'lucide-react';
import type {
  BGStudioProject, BGReplacementType, ImageFile, ExternalServiceConfig, AIProvider,
  BGBrushStroke, BGShadowSettings, BGEdgeGlow, BGSmartCrop, BGCompositeLayer,
  BGBackgroundPreset, BGQueueItem, BGResultItem, BGViewMode, BGProcessingStatus
} from '../types';
import { BG_PRESET_BACKGROUNDS } from '../types';
import { resizeImage } from '../utils';

const imgSrc = (img: ImageFile) => `data:${img.mimeType};base64,${img.base64}`;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const defaultShadow: BGShadowSettings = { type: 'drop', blur: 10, offsetX: 5, offsetY: 5, opacity: 0.4, color: '#000000' };
const defaultEdgeGlow: BGEdgeGlow = { enabled: false, width: 2, color: '#ffffff', opacity: 0.5 };
const defaultSmartCrop: BGSmartCrop = { enabled: false, padding: 10, maintainAspectRatio: true };

const BGStudio: React.FC<{
  project: BGStudioProject;
  setProject: React.Dispatch<React.SetStateAction<BGStudioProject>>;
}> = ({ project, setProject }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const update = (patch: Partial<BGStudioProject>) => setProject(s => ({ ...s, ...patch }));

  const history = useProjectHistory(project, setProject, { maxSnapshots: 50, storageKey: `bgstudio_${project.id}` });
  const { pushSnapshot: pushUndo, undo, redo, pushSnapshot } = history;

  const fileToImageFile = (file: File): Promise<ImageFile> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve({ base64: base64String.split(',')[1], mimeType: file.type, name: file.name });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    pushUndo();
    setProject(s => ({ ...s, error: null }));
    const validImages: ImageFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const resized = await resizeImage(file, 2048, 2048);
        const imgFile = await fileToImageFile(resized);
        validImages.push(imgFile);
      } catch { }
    }
    if (validImages.length === 0) {
      setProject(s => ({ ...s, error: 'No valid image files found.' })); return;
    }
    setProject(s => ({
      ...s, sourceImages: [...s.sourceImages, ...validImages],
      queueItems: [...s.queueItems, ...validImages.map((_, i) => ({ index: s.sourceImages.length + i, status: 'queued' as BGProcessingStatus }))]
    }));
    pushSnapshot(`Uploaded ${validImages.length} image(s)`);
  };

  const removeSource = (index: number) => {
    pushUndo();
    setProject(s => ({ ...s, sourceImages: s.sourceImages.filter((_, i) => i !== index) }));
  };

  const reorderSource = (from: number, to: number) => {
    pushUndo();
    setProject(s => {
      const arr = [...s.sourceImages];
      const [removed] = arr.splice(from, 1);
      arr.splice(to, 0, removed);
      return { ...s, sourceImages: arr };
    });
  };

  const buildBgDescription = (replacementType: string, project: BGStudioProject): string => {
    switch (replacementType) {
      case 'transparent': return 'a clean transparent background (alpha channel)';
      case 'color': return `a solid ${project.replacementColor} background`;
      case 'gradient': return `a ${project.gradientStart} to ${project.gradientEnd} gradient background at ${project.gradientAngle} degrees`;
      case 'image':
        return project.replacementImage
          ? `the uploaded background image seamlessly composited behind the subject with realistic lighting/color matching`
          : 'a transparent background';
      case 'ai-prompt':
        return project.aiBackgroundPrompt || 'a clean professional background';
      default: return 'a transparent background';
    }
  };

  const buildProcessPrompt = (image: ImageFile, bgDesc: string, project: BGStudioProject): string => {
    const edgeQuality = project.edgeThreshold >= 70 ? 'razor-sharp clean edges with zero artifacts'
      : project.edgeThreshold >= 40 ? 'clean edges with minimal artifacts'
      : 'soft natural edges with subtle feathering';
    const feather = project.featherRadius > 0 ? `Apply ${project.featherRadius}px feather to the edge mask for natural blending.` : '';

    const shadowInstr = project.shadowSettings.type !== 'none'
      ? `After compositing, add a ${project.shadowSettings.type} shadow (${project.shadowSettings.color}, blur=${project.shadowSettings.blur}px, offset=${project.shadowSettings.offsetX}x${project.shadowSettings.offsetY}, opacity=${project.shadowSettings.opacity}).`
      : '';

    const glowInstr = project.edgeGlow.enabled
      ? `Add a ${project.edgeGlow.width}px ${project.edgeGlow.color} glow around the subject edge at ${project.edgeGlow.opacity} opacity.`
      : '';

    const cropInstr = project.smartCrop.enabled
      ? `Crop tightly to the subject bounding box with ${project.smartCrop.padding}px padding.`
      : '';

    const upscaleInstr = project.upscaleEnabled
      ? `Upscale the result by ${project.upscaleFactor}x while preserving detail.`
      : '';

    const bgBlurInstr = project.backgroundBlur > 0
      ? `Apply ${project.backgroundBlur}px gaussian blur to the background layer only.`
      : '';

    const colorMatchInstr = project.colorMatchBg
      ? `Color-match the background lighting/tone to harmonize with the subject's dominant colors.`
      : '';

    return `Professional product photo background removal. Remove ALL background from this image completely. Preserve every hair, edge detail, and fine transparency (smoke, glass reflections, hair strands). Output the subject with ${bgDesc}. Use ${edgeQuality}. ${feather} ${shadowInstr} ${glowInstr} ${cropInstr} ${upscaleInstr} ${bgBlurInstr} ${colorMatchInstr} The result must look like a premium studio-quality composite with zero visible cutting artifacts, no color fringing, and realistic lighting interaction between subject and new background.`;
  };

  const processSingle = async (image: ImageFile, index: number) => {
    setProcessingIndex(index);
    setProject(s => ({
      ...s, queueItems: s.queueItems.map(q => q.index === index ? { ...q, status: 'processing' as BGProcessingStatus, startedAt: Date.now() } : q)
    }));
    const { generateImage } = await import('../services/geminiService');
    try {
      const bgDesc = buildBgDescription(project.replacementType, project);
      const prompt = buildProcessPrompt(image, bgDesc, project);
      const result = await generateImage([image], prompt, null, 'original', project.aiConfig);

      pushUndo();
      setProject(s => ({
        ...s,
        results: [...s.results, {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          image, resultImage: result, processedAt: Date.now(),
          maskImage: null, tags: project.autoTagging ? ['processing'] : undefined
        }],
        queueItems: s.queueItems.map(q => q.index === index ? { ...q, status: 'done' as BGProcessingStatus, completedAt: Date.now() } : q)
      }));

      if (project.autoTagging) {
        try {
          const tagPrompt = `Describe this product in 3 single-word tags separated by commas. Output only the 3 words.`;
          const tagResult = await generateImage([image], tagPrompt, null, 'original', project.aiConfig);
          if (tagResult && tagResult.base64) {
            const tagText = atob(tagResult.base64.split(',')[1] || '').trim();
            const tags = tagText.split(',').map(t => t.trim().toLowerCase()).slice(0, 3).filter(Boolean);
            if (tags.length > 0) {
              setProject(s => ({ ...s, results: s.results.map((r, i) => i === s.results.length - 1 ? { ...r, tags } : r) }));
            }
          }
        } catch { }
      }

      pushSnapshot(`Processed image ${index + 1}`);
    } catch (err: any) {
      setProject(s => ({
        ...s, queueItems: s.queueItems.map(q => q.index === index ? { ...q, status: 'failed' as BGProcessingStatus, error: err?.message || 'Processing failed' } : q)
      }));
      toast({ title: 'Processing failed', message: err?.message || 'Unknown error', type: 'error' });
    } finally {
      setProcessingIndex(null);
    }
  };

  const processAll = async () => {
    if (project.sourceImages.length === 0) {
      toast({ title: 'No images', message: 'Upload at least one image first.', type: 'warning' }); return;
    }
    pushUndo();
    setProject(s => ({ ...s, isProcessing: true, error: null }));
    for (let i = 0; i < project.sourceImages.length; i++) {
      await processSingle(project.sourceImages[i], i);
    }
    setProject(s => ({ ...s, isProcessing: false }));
    pushSnapshot(`Batch processed ${project.sourceImages.length} images`);
  };

  const processSingleSelected = (index: number) => {
    if (project.sourceImages[index]) processSingle(project.sourceImages[index], index);
  };

  const downloadResult = (result: BGResultItem, format = 'png') => {
    if (!result.resultImage) return;
    const a = document.createElement('a');
    a.href = `data:${result.resultImage.mimeType};base64,${result.resultImage.base64}`;
    const pattern = project.renamePattern || 'bg-removed-{index}';
    const name = pattern.replace('{index}', result.id.slice(0, 8)).replace('{timestamp}', Date.now().toString());
    a.download = `${name}.${format}`;
    a.click();
  };

  const downloadAll = () => {
    if (project.results.length === 0) return;
    project.results.forEach((r, i) => setTimeout(() => downloadResult(r, project.exportFormat), i * 300));
  };

  const copyToClipboard = async (result: BGResultItem) => {
    try {
      const resp = await fetch(`data:${result.resultImage.mimeType};base64,${result.resultImage.base64}`);
      const blob = await resp.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast({ title: 'Copied', message: 'Image copied to clipboard', type: 'success' });
    } catch {
      toast({ title: 'Copy failed', message: 'Unable to copy image', type: 'error' });
    }
  };

  const applyPreset = (preset: BGBackgroundPreset) => {
    pushUndo();
    if (preset.type === 'color') {
      update({ replacementType: 'color', replacementColor: preset.value, selectedPresetId: preset.id });
    } else if (preset.type === 'gradient') {
      const colors = preset.value.match(/#[a-f0-9]{6}/gi);
      if (colors && colors.length >= 2) {
        update({ replacementType: 'gradient', gradientStart: colors[0], gradientEnd: colors[1], gradientAngle: 135, selectedPresetId: preset.id });
      }
    }
    pushSnapshot(`Applied preset: ${preset.name}`);
  };

  const clearResults = () => { pushUndo(); setProject(s => ({ ...s, results: [], queueItems: [] })); pushSnapshot('Cleared all results'); };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!project.isBrushMode || !canvasRef.current) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const stroke: BGBrushStroke = { x, y, radius: project.brushRadius / 100, mode: 'add' };
    setProject(s => ({ ...s, brushStrokes: [...s.brushStrokes, stroke] }));
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const stroke: BGBrushStroke = { x, y, radius: project.brushRadius / 100, mode: 'add' };
    setProject(s => ({ ...s, brushStrokes: [...s.brushStrokes, stroke] }));
  };

  const handleCanvasMouseUp = () => setIsDrawing(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const queuedCount = project.queueItems.filter(q => q.status === 'queued').length;
  const processingCount = project.queueItems.filter(q => q.status === 'processing').length;
  const doneCount = project.queueItems.filter(q => q.status === 'done').length;
  const failedCount = project.queueItems.filter(q => q.status === 'failed').length;

  const currentResult = project.viewMode === 'gallery' && project.galleryIndex >= 0 && project.galleryIndex < project.results.length
    ? project.results[project.galleryIndex] : null;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">BG Remover</h1>
            <p className="text-xs text-white/40 mt-1">Professional background removal & compositing</p>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <button onClick={undo} disabled={!history.canUndo}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 disabled:opacity-20 transition-all">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={redo} disabled={!history.canRedo}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 disabled:opacity-20 transition-all">
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <MiniAISelector
          config={project.aiConfig || { provider: 'google', modelId: 'gemini-2.5-flash' }}
          onChange={(cfg) => update({ aiConfig: cfg })}
        />
      </div>

      {/* Processing Queue Status Bar */}
      {(queuedCount > 0 || processingCount > 0 || doneCount > 0 || failedCount > 0) && (
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
          <Package className="w-3.5 h-3.5 text-white/30" />
          <div className="flex gap-3 text-[9px] font-bold uppercase tracking-wider">
            <span className="text-white/40">Queue: {queuedCount + processingCount + doneCount + failedCount}</span>
            {queuedCount > 0 && <span className="text-yellow-400">{queuedCount} queued</span>}
            {processingCount > 0 && <span className="text-blue-400">{processingCount} processing</span>}
            {doneCount > 0 && <span className="text-green-400">{doneCount} done</span>}
            {failedCount > 0 && <span className="text-red-400">{failedCount} failed</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========== LEFT PANEL ========== */}
        <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto suggestions-scrollbar pr-1">

          {/* --- Source Images --- */}
          <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40">Source Images</h2>
              {project.autoTagging && <Tags className="w-3 h-3 text-[var(--color-accent)]/60" />}
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-white/20 transition-all hover:bg-white/[0.02]"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-white/30" />
              <p className="text-[10px] font-medium text-white/40">Click to upload images</p>
              <p className="text-[8px] text-white/20 mt-1">PNG, JPG up to 2048px</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
            </div>

            {project.sourceImages.length > 0 && (
              <div className="mt-3 space-y-1 max-h-[200px] overflow-y-auto suggestions-scrollbar">
                {project.sourceImages.map((img, i) => (
                  <div
                    key={img.name + i}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', String(i))}
                    onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.opacity = '0.5'; }}
                    onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                    onDrop={e => {
                      e.preventDefault(); (e.currentTarget as HTMLDivElement).style.opacity = '1';
                      const from = parseInt(e.dataTransfer.getData('text/plain'));
                      if (!isNaN(from) && from !== i) reorderSource(from, i);
                    }}
                    className="flex items-center gap-2 bg-white/5 rounded-xl p-2 group cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-3 h-3 text-white/10 shrink-0" />
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      <img src={imgSrc(img)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="flex-1 text-[10px] text-white/60 truncate">{img.name || `Image ${i + 1}`}</span>
                    <div className="flex gap-1">
                      <button onClick={() => processSingleSelected(i)} disabled={project.isProcessing}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/20 hover:text-[var(--color-accent)] transition-all opacity-0 group-hover:opacity-100">
                        <Wand2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeSource(i)}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {project.sourceImages.length > 0 && (
              <button
                onClick={processAll}
                disabled={project.isProcessing}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
              >
                {project.isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {project.isProcessing ? 'Processing...' : `Remove BG (${project.sourceImages.length})`}
              </button>
            )}
          </div>

          {/* --- Background Type --- */}
          <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Background</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1">
                {(['transparent', 'color', 'gradient', 'image', 'ai-prompt'] as BGReplacementType[]).map(type => (
                  <button key={type}
                    onClick={() => { pushUndo(); update({ replacementType: type }); }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${
                      project.replacementType === type ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border ${project.replacementType === type ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/20' : 'border-white/10'} flex items-center justify-center`}>
                      {project.replacementType === type && <Check className="w-2.5 h-2.5 text-[var(--color-accent)]" />}
                    </div>
                    {type === 'transparent' ? 'Transparent' : type === 'color' ? 'Solid' : type === 'gradient' ? 'Gradient' : type === 'image' ? 'Image' : 'AI Prompt'}
                  </button>
                ))}
              </div>

              {project.replacementType === 'color' && (
                <div className="flex items-center gap-3 pl-2">
                  <input type="color" value={project.replacementColor}
                    onChange={e => update({ replacementColor: e.target.value })}
                    className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer bg-transparent" />
                  <span className="text-[10px] text-white/40 font-mono">{project.replacementColor}</span>
                  <button onClick={() => { if (!project.colorHistory.includes(project.replacementColor)) setProject(s => ({ ...s, colorHistory: [...s.colorHistory, project.replacementColor].slice(-10) })); }}
                    className="ml-auto text-[9px] text-white/20 hover:text-white/40 transition-all">Save</button>
                </div>
              )}
              {project.colorHistory.length > 0 && project.replacementType === 'color' && (
                <div className="flex gap-1.5 pl-2 flex-wrap">
                  {project.colorHistory.map((c, i) => (
                    <button key={i} onClick={() => update({ replacementColor: c })}
                      className="w-5 h-5 rounded-full border border-white/10 hover:scale-110 transition-transform"
                      style={{ background: c }} />
                  ))}
                </div>
              )}

              {project.replacementType === 'gradient' && (
                <div className="pl-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="color" value={project.gradientStart}
                      onChange={e => update({ gradientStart: e.target.value })}
                      className="w-7 h-7 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                    <input type="color" value={project.gradientEnd}
                      onChange={e => update({ gradientEnd: e.target.value })}
                      className="w-7 h-7 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                    <span className="text-[8px] text-white/30 font-mono">{project.gradientAngle}°</span>
                    <input type="range" min="0" max="360" value={project.gradientAngle}
                      onChange={e => update({ gradientAngle: Number(e.target.value) })}
                      className="flex-1 h-1 accent-[var(--color-accent)]" />
                  </div>
                </div>
              )}

              {project.replacementType === 'image' && (
                <div className="pl-2">
                  <div onClick={() => bgImageInputRef.current?.click()}
                    className="border border-dashed border-white/10 rounded-xl p-3 text-center cursor-pointer hover:border-white/20 transition-all"
                  >
                    {project.replacementImage ? (
                      <div className="flex items-center gap-2">
                        <img src={imgSrc(project.replacementImage)} alt="" className="w-8 h-8 rounded object-cover" />
                        <span className="text-[9px] text-white/40 truncate flex-1">{project.replacementImage.name}</span>
                        <button onClick={e => { e.stopPropagation(); update({ replacementImage: null }); }} className="text-white/20 hover:text-red-400"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <><Upload className="w-4 h-4 mx-auto mb-1 text-white/30" /><p className="text-[9px] text-white/40">Upload replacement BG</p></>
                    )}
                    <input ref={bgImageInputRef} type="file" accept="image/*" className="hidden"
                      onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { const resized = await resizeImage(file, 2048, 2048); update({ replacementImage: await fileToImageFile(resized) }); } catch { } }} />
                  </div>
                </div>
              )}

              {project.replacementType === 'ai-prompt' && (
                <div className="pl-2">
                  <textarea
                    value={project.aiBackgroundPrompt}
                    onChange={e => update({ aiBackgroundPrompt: e.target.value })}
                    placeholder="e.g. 'a sunny beach at sunset with soft waves'"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white outline-none focus:border-[var(--color-accent)]/50 transition-all resize-none h-20 placeholder:text-white/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* --- Preset Backgrounds --- */}
          <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Presets</h2>
            <div className="grid grid-cols-5 gap-2">
              {BG_PRESET_BACKGROUNDS.map(preset => (
                <button key={preset.id} onClick={() => applyPreset(preset)}
                  className={`aspect-square rounded-xl border-2 transition-all overflow-hidden ${
                    project.selectedPresetId === preset.id ? 'border-[var(--color-accent)]' : 'border-white/5 hover:border-white/20'
                  }`}
                  title={preset.name}
                >
                  <div className="w-full h-full flex items-center justify-center"
                    style={preset.type === 'color' ? { background: preset.value } :
                      preset.type === 'gradient' ? { background: preset.value } : {}}
                  >
                    <span className="text-[6px] font-black text-white/80 drop-shadow-lg">{preset.name.slice(0, 6)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* --- Edge Refinement --- */}
          <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Edge Refinement</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[8px] text-white/30 mb-1"><span>Feather</span><span>{project.featherRadius}px</span></div>
                <input type="range" min="0" max="20" value={project.featherRadius}
                  onChange={e => update({ featherRadius: Number(e.target.value) })}
                  className="w-full h-1 accent-[var(--color-accent)]" />
              </div>
              <div>
                <div className="flex justify-between text-[8px] text-white/30 mb-1"><span>Threshold</span><span>{project.edgeThreshold}%</span></div>
                <input type="range" min="0" max="100" value={project.edgeThreshold}
                  onChange={e => update({ edgeThreshold: Number(e.target.value) })}
                  className="w-full h-1 accent-[var(--color-accent)]" />
              </div>
              {project.showMask && project.results.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <h3 className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">Mask Preview</h3>
                  <canvas
                    ref={canvasRef}
                    className="w-full aspect-video rounded-xl border border-white/5 bg-black/40"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                  {project.isBrushMode && (
                    <div className="flex items-center gap-2 mt-2">
                      <input type="range" min="1" max="50" value={project.brushRadius}
                        onChange={e => update({ brushRadius: Number(e.target.value) })}
                        className="flex-1 h-1 accent-[var(--color-accent)]" />
                      <span className="text-[8px] text-white/30 w-8 text-right">{project.brushRadius}px</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* --- Pro Effects --- */}
          <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Pro Effects</h2>
            <div className="space-y-4">

              {/* Shadow */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Shadow</span>
                  <select value={project.shadowSettings.type}
                    onChange={e => update({ shadowSettings: { ...project.shadowSettings, type: e.target.value as any } })}
                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white outline-none">
                    <option value="none">None</option><option value="drop">Drop</option><option value="ground">Ground</option><option value="glow">Glow</option>
                  </select>
                </div>
                {project.shadowSettings.type !== 'none' && (
                  <div className="pl-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="color" value={project.shadowSettings.color}
                        onChange={e => update({ shadowSettings: { ...project.shadowSettings, color: e.target.value } })}
                        className="w-5 h-5 rounded border border-white/10 cursor-pointer bg-transparent" />
                      <div className="flex-1 grid grid-cols-2 gap-2 text-[8px]">
                        <div><span className="text-white/30">Blur</span><input type="range" min="0" max="50" value={project.shadowSettings.blur}
                          onChange={e => update({ shadowSettings: { ...project.shadowSettings, blur: Number(e.target.value) } })}
                          className="w-full h-0.5 accent-[var(--color-accent)]" /></div>
                        <div><span className="text-white/30">Opacity</span><input type="range" min="0" max="100" value={project.shadowSettings.opacity * 100}
                          onChange={e => update({ shadowSettings: { ...project.shadowSettings, opacity: Number(e.target.value) / 100 } })}
                          className="w-full h-0.5 accent-[var(--color-accent)]" /></div>
                      </div>
                    </div>
                    {project.shadowSettings.type === 'drop' && (
                      <div className="grid grid-cols-2 gap-2 text-[8px]">
                        <div><span className="text-white/30">Offset X</span><input type="range" min="-50" max="50" value={project.shadowSettings.offsetX}
                          onChange={e => update({ shadowSettings: { ...project.shadowSettings, offsetX: Number(e.target.value) } })}
                          className="w-full h-0.5 accent-[var(--color-accent)]" /></div>
                        <div><span className="text-white/30">Offset Y</span><input type="range" min="-50" max="50" value={project.shadowSettings.offsetY}
                          onChange={e => update({ shadowSettings: { ...project.shadowSettings, offsetY: Number(e.target.value) } })}
                          className="w-full h-0.5 accent-[var(--color-accent)]" /></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Edge Glow */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Edge Glow</span>
                  <button onClick={() => update({ edgeGlow: { ...project.edgeGlow, enabled: !project.edgeGlow.enabled } })}
                    className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                      project.edgeGlow.enabled ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-white/5 text-white/30'
                    }`}>{project.edgeGlow.enabled ? 'On' : 'Off'}</button>
                </div>
                {project.edgeGlow.enabled && (
                  <div className="flex items-center gap-2 pl-2 text-[8px]">
                    <input type="color" value={project.edgeGlow.color}
                      onChange={e => update({ edgeGlow: { ...project.edgeGlow, color: e.target.value } })}
                      className="w-5 h-5 rounded border border-white/10 cursor-pointer bg-transparent" />
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-white/30">W</span>
                      <input type="range" min="1" max="20" value={project.edgeGlow.width}
                        onChange={e => update({ edgeGlow: { ...project.edgeGlow, width: Number(e.target.value) } })}
                        className="flex-1 h-0.5 accent-[var(--color-accent)]" />
                      <span className="text-white/30">Op</span>
                      <input type="range" min="0" max="100" value={project.edgeGlow.opacity * 100}
                        onChange={e => update({ edgeGlow: { ...project.edgeGlow, opacity: Number(e.target.value) / 100 } })}
                        className="flex-1 h-0.5 accent-[var(--color-accent)]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Smart Crop */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Smart Crop</span>
                  <button onClick={() => update({ smartCrop: { ...project.smartCrop, enabled: !project.smartCrop.enabled } })}
                    className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                      project.smartCrop.enabled ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-white/5 text-white/30'
                    }`}>{project.smartCrop.enabled ? 'On' : 'Off'}</button>
                </div>
                {project.smartCrop.enabled && (
                  <div className="flex items-center gap-2 pl-2 text-[8px]">
                    <span className="text-white/30">Pad</span>
                    <input type="range" min="0" max="50" value={project.smartCrop.padding}
                      onChange={e => update({ smartCrop: { ...project.smartCrop, padding: Number(e.target.value) } })}
                      className="flex-1 h-0.5 accent-[var(--color-accent)]" />
                    <span>{project.smartCrop.padding}px</span>
                    <button onClick={() => update({ smartCrop: { ...project.smartCrop, maintainAspectRatio: !project.smartCrop.maintainAspectRatio } })}
                      className={`px-1.5 py-0.5 rounded text-[7px] font-black ${project.smartCrop.maintainAspectRatio ? 'text-[var(--color-accent)]' : 'text-white/30'}`}>
                      {project.smartCrop.maintainAspectRatio ? 'AR' : 'Free'}
                    </button>
                  </div>
                )}
              </div>

              {/* BG Blur + Bokeh */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">BG Blur</span>
                  <select value={project.bokehShape}
                    onChange={e => update({ bokehShape: e.target.value as any })}
                    className="bg-black/40 border border-white/10 rounded-lg px-1.5 py-0.5 text-[8px] text-white outline-none">
                    <option value="circle">Circle</option><option value="hexagon">Hex</option><option value="star">Star</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pl-2 text-[8px]">
                  <input type="range" min="0" max="50" value={project.backgroundBlur}
                    onChange={e => update({ backgroundBlur: Number(e.target.value) })}
                    className="flex-1 h-0.5 accent-[var(--color-accent)]" />
                  <span className="w-8 text-right text-white/40">{project.backgroundBlur}px</span>
                </div>
              </div>

              {/* Upscale */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Upscale</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => update({ upscaleEnabled: !project.upscaleEnabled })}
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                        project.upscaleEnabled ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-white/5 text-white/30'
                      }`}>{project.upscaleEnabled ? 'On' : 'Off'}</button>
                    {project.upscaleEnabled && (
                      <select value={project.upscaleFactor}
                        onChange={e => update({ upscaleFactor: Number(e.target.value) })}
                        className="bg-black/40 border border-white/10 rounded-lg px-1.5 py-0.5 text-[8px] text-white outline-none">
                        <option value={2}>2×</option><option value={4}>4×</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Color Match */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Color Match BG</span>
                <button onClick={() => update({ colorMatchBg: !project.colorMatchBg })}
                  className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                    project.colorMatchBg ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-white/5 text-white/30'
                  }`}>{project.colorMatchBg ? 'On' : 'Off'}</button>
              </div>
            </div>
          </div>

          {/* --- Export Settings --- */}
          <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Export</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/50 w-16">Format</span>
                <select value={project.exportFormat}
                  onChange={e => update({ exportFormat: e.target.value as any })}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none">
                  <option value="png">PNG</option><option value="webp">WebP</option><option value="jpeg">JPEG</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/50 w-16">Quality</span>
                <input type="range" min="10" max="100" value={project.exportQuality}
                  onChange={e => update({ exportQuality: Number(e.target.value) })}
                  className="flex-1 h-1 accent-[var(--color-accent)]" />
                <span className="text-[9px] text-white/40 w-8">{project.exportQuality}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/50 w-16">Filename</span>
                <input type="text" value={project.renamePattern}
                  onChange={e => update({ renamePattern: e.target.value })}
                  placeholder="bg-removed-{index}"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none placeholder:text-white/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/50 w-16">Group</span>
                <input type="text" value={project.imageGroupName}
                  onChange={e => update({ imageGroupName: e.target.value })}
                  placeholder="product-name"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none placeholder:text-white/20"
                />
              </div>
            </div>
          </div>

          {/* --- Toggles --- */}
          <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Auto-tagging</span>
                <button onClick={() => update({ autoTagging: !project.autoTagging })}
                  className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                    project.autoTagging ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-white/5 text-white/30'
                  }`}>{project.autoTagging ? 'On' : 'Off'}</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Brush Mode</span>
                <button onClick={() => update({ isBrushMode: !project.isBrushMode })}
                  className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                    project.isBrushMode ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-white/5 text-white/30'
                  }`}>{project.isBrushMode ? 'On' : 'Off'}</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Show Mask</span>
                <button onClick={() => update({ showMask: !project.showMask })}
                  className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                    project.showMask ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-white/5 text-white/30'
                  }`}>{project.showMask ? 'On' : 'Off'}</button>
              </div>
            </div>
          </div>
        </div>

        {/* ========== RIGHT PANEL - RESULTS ========== */}
        <div className="lg:col-span-2">
          <div className="border border-white/10 rounded-2xl bg-white/[0.02] h-full">
            {/* Results Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Results {project.results.length > 0 && <span className="text-white/60">({project.results.length})</span>}
                </h2>
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                  <button onClick={() => update({ viewMode: 'grid' })}
                    className={`p-1 rounded-md transition-all ${project.viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}>
                    <Grid className="w-3 h-3" />
                  </button>
                  <button onClick={() => update({ viewMode: 'gallery', galleryIndex: 0 })}
                    className={`p-1 rounded-md transition-all ${project.viewMode === 'gallery' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}>
                    <Maximize className="w-3 h-3" />
                  </button>
                  <button onClick={() => update({ viewMode: 'compare' })}
                    className={`p-1 rounded-md transition-all ${project.viewMode === 'compare' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}>
                    <Columns className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {project.results.length > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={downloadAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/10 transition-all">
                    <Archive className="w-3 h-3" /> Export
                  </button>
                  <button onClick={clearResults}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-red-400 hover:bg-white/10 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-4">
              {/* Empty State */}
              {project.results.length === 0 && !project.isProcessing && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Sparkles className="w-10 h-10 text-white/10 mb-4" />
                  <p className="text-xs text-white/30 font-medium">No results yet</p>
                  <p className="text-[9px] text-white/20 mt-1">Upload images and click "Remove BG" to process</p>
                </div>
              )}

              {/* Processing Loading */}
              {project.isProcessing && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin mb-4" />
                  <p className="text-xs text-white/40">Processing images...</p>
                  <p className="text-[9px] text-white/20 mt-1">This may take a moment</p>
                  {project.queueItems.filter(q => q.status === 'done' || q.status === 'failed').length > 0 && (
                    <p className="text-[9px] text-white/30 mt-2">
                      {doneCount} done, {failedCount} failed, {processingCount} remaining
                    </p>
                  )}
                </div>
              )}

              {/* Gallery View */}
              {project.viewMode === 'gallery' && currentResult && (
                <div className="space-y-4">
                  <div className="relative w-full aspect-video bg-black/40 rounded-2xl overflow-hidden">
                    <img src={imgSrc(currentResult.resultImage)} alt="Result"
                      className="w-full h-full object-contain cursor-zoom-in"
                      style={{ transform: `scale(${project.zoomLevel})` }}
                      onClick={() => update({ zoomLevel: project.zoomLevel >= 3 ? 1 : project.zoomLevel + 0.5 })} />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <button onClick={() => update({ zoomLevel: clamp(project.zoomLevel - 0.5, 0.5, 5) })}
                        className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-all"><ZoomOut className="w-3.5 h-3.5 text-white" /></button>
                      <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[9px] text-white/80">{(project.zoomLevel * 100).toFixed(0)}%</span>
                      <button onClick={() => update({ zoomLevel: clamp(project.zoomLevel + 0.5, 0.5, 5) })}
                        className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-all"><ZoomIn className="w-3.5 h-3.5 text-white" /></button>
                    </div>
                  </div>
                  {currentResult.tags && currentResult.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tags className="w-3 h-3 text-white/30" />
                      {currentResult.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-white/5 rounded-full text-[8px] text-white/40">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button onClick={() => downloadResult(currentResult, project.exportFormat)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/10 transition-all">
                      <Download className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => copyToClipboard(currentResult)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/10 transition-all">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <button onClick={() => update({ showOriginal: !project.showOriginal })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/10 transition-all">
                      <ArrowLeftRight className="w-3 h-3" /> {project.showOriginal ? 'Result' : 'Original'}
                    </button>
                    <div className="flex gap-1 ml-auto">
                      <button onClick={() => update({ galleryIndex: clamp(project.galleryIndex - 1, 0, project.results.length - 1) })}
                        disabled={project.galleryIndex <= 0}
                        className="p-1.5 bg-white/5 rounded-lg text-white/40 hover:text-white/60 disabled:opacity-20 transition-all">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-[9px] text-white/40 self-center">{project.galleryIndex + 1}/{project.results.length}</span>
                      <button onClick={() => update({ galleryIndex: clamp(project.galleryIndex + 1, 0, project.results.length - 1) })}
                        disabled={project.galleryIndex >= project.results.length - 1}
                        className="p-1.5 bg-white/5 rounded-lg text-white/40 hover:text-white/60 disabled:opacity-20 transition-all">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Compare View */}
              {project.viewMode === 'compare' && project.results.length > 0 && (
                <div className="space-y-4">
                  <div className="relative w-full aspect-video bg-black/40 rounded-2xl overflow-hidden select-none">
                    <img src={imgSrc(project.results[0].image)} alt="Original" className="absolute inset-0 w-full h-full object-contain" />
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${project.comparePosition}%` }}>
                      <img src={imgSrc(project.results[0].resultImage)} alt="Result" className="w-full h-full object-contain" />
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/80 cursor-col-resize"
                      style={{ left: `${project.comparePosition}%` }}
                      onMouseDown={e => {
                        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                        const onMove = (ev: MouseEvent) => {
                          const pos = ((ev.clientX - rect.left) / rect.width) * 100;
                          update({ comparePosition: clamp(pos, 5, 95) });
                        };
                        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                      }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                        <ArrowLeftRight className="w-4 h-4 text-black" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <input type="range" min="5" max="95" value={project.comparePosition}
                      onChange={e => update({ comparePosition: Number(e.target.value) })}
                      className="w-full h-1 accent-[var(--color-accent)]" />
                    <div className="flex justify-between text-[8px] text-white/30 mt-1">
                      <span>Original</span><span>Result</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid View (default) */}
              {project.viewMode === 'grid' && project.results.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.results.map((result, i) => (
                    <motion.div key={result.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="border border-white/10 rounded-xl overflow-hidden bg-white/5 group"
                    >
                      <div className="relative aspect-square bg-[length:20px_20px] bg-[position:0_0,10px_10px] bg-[image:linear-gradient(45deg,white_25%,transparent_25%),linear-gradient(-45deg,white_25%,transparent_25%)]"
                        style={{ backgroundColor: '#e5e5e5' }}>
                        {project.showOriginal ? (
                          <img src={imgSrc(result.image)} alt="Original" className="w-full h-full object-contain" />
                        ) : (
                          <img src={imgSrc(result.resultImage)} alt="Result" className="w-full h-full object-contain" />
                        )}
                        <button onClick={() => setProject(s => ({ ...s, showOriginal: !s.showOriginal }))}
                          className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[8px] font-black uppercase tracking-widest text-white/80 hover:bg-black/80 transition-all">
                          <ArrowLeftRight className="w-3 h-3 inline mr-1" />
                          {project.showOriginal ? 'Result' : 'Original'}
                        </button>
                        {result.tags && result.tags.length > 0 && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            {result.tags.map(t => (
                              <span key={t} className="px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[7px] text-white/60 font-medium">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 p-2">
                        <button onClick={() => downloadResult(result, project.exportFormat)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/10 transition-all">
                          <Download className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => copyToClipboard(result)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/10 transition-all">
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        <button onClick={() => update({ viewMode: 'gallery', galleryIndex: i })}
                          className="flex items-center justify-center px-2 py-1.5 bg-white/5 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/10 transition-all">
                          <Maximize className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {history.pastCount > 1 && (
        <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-3.5 h-3.5 text-white/30" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40">History</h2>
            <span className="text-[8px] text-white/20">({history.pastCount} entries)</span>
          </div>
          <div className="flex gap-2 overflow-x-auto suggestions-scrollbar pb-1">
            {history.getHistory().slice(-10).reverse().map(entry => (
              <div key={entry.id}
                className="shrink-0 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/5 text-[8px] text-white/40 whitespace-nowrap">
                {entry.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {project.error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-[10px] font-medium text-red-400">{project.error}</p>
        </div>
      )}
    </div>
  );
};

export default BGStudio;
