
import React, { useCallback } from 'react';
import { ImageFile, ShotType, PhotoshootDirectorProject } from '../types';
import { resizeImage } from '../utils';
import { generateImage, editImage } from '../services/geminiService';
import { logHistory } from '../lib/admin';
import ImageWorkspace from './ImageWorkspace';
import ShotTypeSelector from './ShotTypeSelector';
import ResultsGrid from './ResultsGrid';
import AISelector from './AISelector';
import { Download, Image as ImageIcon, Layout, Palette, RefreshCw, Maximize2, Grid, Sliders, Clock, Bookmark } from 'lucide-react';

interface PhotoshootDirectorProps {
  project: PhotoshootDirectorProject;
  setProject: React.Dispatch<React.SetStateAction<PhotoshootDirectorProject>>;
}

const PhotoshootDirector: React.FC<PhotoshootDirectorProps> = ({ project, setProject }) => {

    const onGenerate = useCallback(async () => {
    if (!project || project.productImages.length === 0 || project.selectedShotTypes.length === 0) {
      setProject(s => ({ ...s, error: 'Please upload a product image and select at least one shot type.' }));
      return;
    }

    setProject(s => ({
      ...s,
      isGenerating: true,
      error: null,
      results: s.selectedShotTypes.map(shotType => ({
        shotType,
        image: null,
        isLoading: true,
        error: null,
        editPrompt: '',
        isEditing: false,
      })),
    }));

    const generationPromises = project.selectedShotTypes.map(shotType => {
      const textProtection = "STRICTLY PRESERVE all original text, labels, and branding on the product. DO NOT erase original writing. NO EXTRA generated text in the scene.";
      let prompt = `A high-resolution, professional photograph of the subject from the provided image. The desired shot is: '${shotType}'. The background should be clean, non-distracting, and complementary to the subject. ${textProtection}`;
      if (project.customStylePrompt) {
        prompt += ` Additional style requirements: ${project.customStylePrompt}`;
      }
      return generateImage(project.productImages, prompt, null, "1:1", project.aiConfig)
        .then(image => ({ status: 'fulfilled' as const, value: { shotType, image } }))
        .catch(error => ({ status: 'rejected' as const, reason: { shotType, error } }));
    });

    const settledResults = await Promise.all(generationPromises);

    settledResults.forEach(result => {
      if (result.status === 'fulfilled') {
        const { shotType, image } = result.value;
        setProject(s => ({
          ...s,
          results: s.results.map(r => r.shotType === shotType ? { ...r, image, isLoading: false } : r),
        }));
        logHistory({
            type: 'image',
            studio: 'photoshoot_director',
            content: `data:${image.mimeType};base64,${image.base64}`,
            prompt: `Photoshoot Shot: ${shotType}`
        });
      } else {
        const { shotType, error } = result.reason;
        console.error(`Failed to generate image for ${shotType}:`, error);
        setProject(s => ({
          ...s,
          results: s.results.map(r => r.shotType === shotType ? { ...r, error: error.message || 'Generation failed', isLoading: false } : r),
        }));
      }
    });
    
    setProject(s => ({ ...s, isGenerating: false, generationTimestamps: [...s.generationTimestamps, new Date().toLocaleTimeString()] }));
  }, [project, setProject]);

  const handleEditResult = async (index: number, prompt: string) => {
      const result = project.results[index];
      if (!result || !result.image) return;

      setProject(s => {
          const newResults = [...s.results];
          newResults[index] = { ...newResults[index], isEditing: true, error: null };
          return { ...s, results: newResults };
      });

      try {
          const updated = await editImage(result.image, prompt, project.aiConfig);
          setProject(s => {
              const newResults = [...s.results];
              newResults[index] = { ...newResults[index], image: updated, isEditing: false };
              return { ...s, results: newResults };
          });
          logHistory({
              type: 'image',
              studio: 'photoshoot_director',
              content: `data:${updated.mimeType};base64,${updated.base64}`,
              prompt: `Photoshoot Edit: ${prompt}`,
              metadata: { edit: true, originalShot: result.shotType }
          });
      } catch (err) {
          setProject(s => {
              const newResults = [...s.results];
              newResults[index] = { ...newResults[index], isEditing: false, error: err instanceof Error ? err.message : 'Edit failed' };
              return { ...s, results: newResults };
          });
      }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setProject(s => ({ ...s, isUploading: true, error: null }));
    let currentError: string | null = null;
    
    const filePromises = files.map(file => {
      return new Promise<ImageFile | null>(async (resolve) => {
        if (!file.type.startsWith('image/')) {
          if (!currentError) currentError = `File '${file.name}' is not a supported image type.`;
          resolve(null);
          return;
        }
        try {
          const resizedFile = await resizeImage(file, 2048, 2048);
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve({
              base64: base64String.split(',')[1],
              mimeType: resizedFile.type,
              name: resizedFile.name
            });
          };
          reader.onerror = () => {
            if (!currentError) currentError = `Error reading file '${resizedFile.name}'.`;
            resolve(null);
          };
          reader.readAsDataURL(resizedFile);
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
          if (!currentError) currentError = `Could not process file '${file.name}'.`;
          resolve(null);
        }
      });
    });

    const results = await Promise.all(filePromises);
    const validImages = results.filter((img): img is ImageFile => img !== null);

    if (validImages.length > 0) {
        for (const img of validImages) {
            logHistory({
                type: 'image',
                studio: 'photoshoot_director',
                content: `data:${img.mimeType};base64,${img.base64}`,
                prompt: `Uploaded Asset: ${img.name}`,
                metadata: { asset: true, originalName: img.name }
            });
        }
    }

    setProject(s => ({
      ...s,
      productImages: [...s.productImages, ...validImages],
      error: currentError,
      isUploading: false,
    }));
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProject(s => ({
      ...s,
      productImages: s.productImages.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleImageUpdate = (index: number, newImage: ImageFile) => {
      setProject(s => {
          const newImages = [...s.productImages];
          if (index >= 0 && index < newImages.length) {
              newImages[index] = newImage;
          }
          return { ...s, productImages: newImages };
      });
  };

  if (!project) {
    return (
        <main className="w-full max-w-7xl flex items-center justify-center gap-8 pt-8 pb-12 flex-grow">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent)]"></div>
            <p className="text-[var(--color-text-secondary)]">Loading Photoshoot Director...</p>
        </main>
    );
  }

  return (
    <main className="w-full flex flex-col gap-4 pt-4 pb-8">
      <AISelector 
          config={project.aiConfig || { provider: 'google', modelId: 'gemini-2.1-flash' }} 
          onChange={(cfg) => setProject(s => ({ ...s, aiConfig: cfg }))}
          studioId="photoshoot_director"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-lg font-bold text-[var(--color-text-base)] mb-4">1. Upload Image(s)</h3>
            <ImageWorkspace
              id="photoshoot-product-uploader"
              images={project.productImages}
              onImagesUpload={handleFileUpload}
              onImageRemove={handleRemoveImage}
              isUploading={project.isUploading}
              onImageUpdate={handleImageUpdate}
            />
          </div>
          <ShotTypeSelector
            selected={project.selectedShotTypes}
            onChange={(selected) => setProject(s => ({ ...s, selectedShotTypes: selected }))}
            customStylePrompt={project.customStylePrompt}
            onCustomStylePromptChange={(prompt) => setProject(s => ({...s, customStylePrompt: prompt }))}
          />
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Shot Config</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[7px] font-black text-white/30 uppercase tracking-widest block mb-1">Aspect</label>
                <select value={project.aspectRatio} onChange={e => setProject(s => ({ ...s, aspectRatio: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none">
                  {['1:1','16:9','9:16','4:3','3:4'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[7px] font-black text-white/30 uppercase tracking-widest block mb-1">Quality</label>
                <select value={project.outputQuality} onChange={e => setProject(s => ({ ...s, outputQuality: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none">
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[7px] font-black text-white/30 uppercase tracking-widest">BG</label>
                <input type="color" value={project.bgColor} onChange={e => setProject(s => ({ ...s, bgColor: e.target.value }))} className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[7px] font-black text-white/30 uppercase tracking-widest">Enhance</label>
                <button onClick={() => setProject(s => ({ ...s, autoEnhance: !s.autoEnhance }))} className={`px-3 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all ${project.autoEnhance ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/30 text-[var(--color-accent)]' : 'bg-white/5 border-white/10 text-white/40'}`}>
                  {project.autoEnhance ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div>
              <input value={project.shotNotes} onChange={e => setProject(s => ({ ...s, shotNotes: e.target.value }))} placeholder="Shot notes / instructions..." className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[9px] text-white/60 outline-none placeholder:text-white/20" />
            </div>
            <div className="flex gap-2">
              {['Studio','Natural','Dramatic','Soft'].map(p => (
                <button key={p} onClick={() => setProject(s => ({ ...s, quickPreset: s.quickPreset === p ? '' : p }))} className={`px-3 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all ${project.quickPreset === p ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/30 text-[var(--color-accent)]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full px-4 py-2">
            <button
                onClick={onGenerate}
                disabled={project.isGenerating || project.isUploading || project.productImages.length === 0 || project.selectedShotTypes.length === 0}
                className="w-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] hover:from-[var(--color-accent-dark)] hover:to-[var(--color-accent-darker)] text-[var(--color-text-base)] font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:shadow-[var(--color-accent)]/20 disabled:shadow-none transform hover:-translate-y-1 disabled:transform-none"
            >
                {project.isGenerating ? 'Generating...' : `Generate ${project.selectedShotTypes.length} Shot${project.selectedShotTypes.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col flex-grow glass-card rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[var(--color-text-base)]">3. Generated Results</h3>
                  <div className="flex gap-2">
                    {project.results.some(r => r.image) && (
                      <button onClick={() => {
                        project.results.forEach((r, i) => {
                          if (!r.image) return;
                          const a = document.createElement('a');
                          a.href = `data:${r.image.mimeType};base64,${r.image.base64}`;
                          a.download = `shot-${i+1}-${r.shotType.replace(/\s+/g, '-')}.${r.image.mimeType.split('/')[1] || 'png'}`;
                          a.click();
                        });
                      }} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
                        <Download className="w-3 h-3" /> Download All
                      </button>
                    )}
                    <button onClick={() => setProject(s => ({ ...s, showContactSheet: !s.showContactSheet }))} className={`px-3 py-1.5 rounded-lg text-[8px] font-bold border transition-all flex items-center gap-1 ${project.showContactSheet ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/30 text-[var(--color-accent)]' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                      <Grid className="w-3 h-3" /> Sheet
                    </button>
                    {project.results.some(r => r.image) && <button onClick={() => setProject(s => ({ ...s, showCompare: !s.showCompare }))} className={`px-3 py-1.5 rounded-lg text-[8px] font-bold border transition-all flex items-center gap-1 ${project.showCompare ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/30 text-[var(--color-accent)]' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                      <Maximize2 className="w-3 h-3" /> Compare
                    </button>}
                  </div>
              </div>
               {project.error && <div className="mb-4 bg-[rgba(var(--color-accent-rgb),0.2)] border border-[rgba(var(--color-accent-rgb),0.5)] text-[var(--color-accent-light)] px-4 py-3 rounded-lg" role="alert">{project.error}</div>}
              {project.showContactSheet ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {project.results.filter(r => r.image).map((r, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/5">
                      <img src={`data:${r.image!.mimeType};base64,${r.image!.base64}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <ResultsGrid results={project.results} onEditResult={handleEditResult} />
              )}
              {project.showCompare && project.productImages.length > 0 && project.results.some(r => r.image) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl overflow-hidden bg-white/5 border border-white/5">
                    <p className="text-[7px] font-black text-white/30 uppercase tracking-widest text-center py-1">Original</p>
                    <img src={`data:${project.productImages[0].mimeType};base64,${project.productImages[0].base64}`} alt="" className="w-full aspect-square object-cover" />
                  </div>
                  <div className="rounded-xl overflow-hidden bg-white/5 border border-white/5">
                    <p className="text-[7px] font-black text-white/30 uppercase tracking-widest text-center py-1">Generated</p>
                    <img src={`data:${project.results.find(r => r.image)!.image!.mimeType};base64,${project.results.find(r => r.image)!.image!.base64}`} alt="" className="w-full aspect-square object-cover" />
                  </div>
                </div>
              )}
              {project.generationTimestamps.length > 0 && (
                <div className="mt-4 flex items-center gap-3 text-[8px] text-white/30">
                  <Clock className="w-3 h-3" />
                  <span>Last: {project.generationTimestamps[project.generationTimestamps.length - 1]}</span>
                  <span className="text-white/10">|</span>
                  <span>{project.results.filter(r => r.image).length} / {project.results.length} generated</span>
                </div>
              )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default PhotoshootDirector;
