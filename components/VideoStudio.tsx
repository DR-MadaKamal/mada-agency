import React, { useState, useRef, useCallback } from 'react';
import { Video, Plus, Trash2, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { callAI } from '../services/geminiService';
import { AILoadingOverlay } from '../lib/AILoadingOverlay';

interface Shot {
  id: string;
  sceneNumber: number;
  description: string;
  shotType: string;
  cameraMovement: string;
  duration: number;
  notes: string;
  thumbnail?: string;
}

const SHOT_TYPES = ['Wide', 'Mid', 'Close-up', 'Detail'];
const CAMERA_MOVEMENTS = ['Static', 'Pan', 'Tilt', 'Truck', 'Dolly'];
const DEFAULT_AI_CONFIG = { provider: 'google' as const, modelId: 'gemini-2.0-flash' };

const VideoStudio: React.FC = () => {
  const [shots, setShots] = useState<Shot[]>([]);
  const [brief, setBrief] = useState('');
  const [template, setTemplate] = useState('professional');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(1);

  const addShot = useCallback(() => {
    const newShot: Shot = {
      id: String(nextId.current++),
      sceneNumber: shots.length + 1,
      description: '',
      shotType: 'Mid',
      cameraMovement: 'Static',
      duration: 3,
      notes: '',
    };
    setShots(prev => [...prev, newShot]);
  }, [shots.length]);

  const deleteShot = useCallback((id: string) => {
    setShots(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    });
  }, []);

  const updateShot = useCallback((id: string, field: keyof Shot, value: any) => {
    setShots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const generateShotList = useCallback(async () => {
    if (!brief.trim()) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);

    try {
      const prompt = `You are a professional video production director. Based on this video concept: "${brief}"

Generate a shot list for a video production with a "${template}" style tone.

Return a JSON array of objects. Each object must have these exact fields:
- description: string (what happens in the shot)
- shotType: string (one of: Wide, Mid, Close-up, Detail)
- cameraMovement: string (one of: Static, Pan, Tilt, Truck, Dolly)
- duration: number (duration in seconds, between 2 and 10)
- notes: string (production notes for this shot)

Generate between 6 and 12 shots. Return ONLY the raw JSON array. No markdown, no code fences.`;

      const result = await callAI(prompt, DEFAULT_AI_CONFIG, undefined, undefined, abortRef.current.signal);
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      const parsed: Omit<Shot, 'id' | 'sceneNumber'>[] = JSON.parse(jsonMatch ? jsonMatch[0] : result);

      const newShots: Shot[] = parsed.map((item, i) => ({
        id: String(nextId.current++),
        sceneNumber: i + 1,
        description: item.description || '',
        shotType: SHOT_TYPES.includes(item.shotType) ? item.shotType : 'Mid',
        cameraMovement: CAMERA_MOVEMENTS.includes(item.cameraMovement) ? item.cameraMovement : 'Static',
        duration: Math.max(1, Math.min(30, item.duration || 3)),
        notes: item.notes || '',
      }));

      setShots(newShots);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Shot generation failed:', err);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [brief, template]);

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  return (
    <main className="w-full flex flex-col gap-6 pt-4 pb-12 animate-in fade-in duration-700 min-h-[70vh] relative">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
          <Video className="w-7 h-7 text-[var(--color-accent)]" />
          Video Production
        </h2>
        <p className="text-sm text-white/50 mt-1">Build shot lists and generate AI-powered shot scripts.</p>
      </div>

      {/* Brief Input */}
      <div className="glass-card rounded-[2.5rem] p-6 border border-white/5 bg-white/[0.02]">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Video Concept Brief</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe your video concept... e.g. 'A 30-second brand film showcasing a luxury perfume launch with slow-motion close-ups and dramatic lighting.'"
              className="w-full bg-black/20 rounded-2xl p-4 text-sm text-white/90 border border-white/5 focus:border-[var(--color-accent)]/50 focus:ring-0 resize-none min-h-[80px] suggestions-scrollbar"
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black text-white/60 uppercase tracking-widest focus:ring-0 cursor-pointer"
            >
              <option value="professional" className="bg-gray-900">Professional</option>
              <option value="cinematic" className="bg-gray-900">Cinematic</option>
              <option value="energetic" className="bg-gray-900">Energetic</option>
              <option value="minimalist" className="bg-gray-900">Minimalist</option>
            </select>
            <button
              onClick={generateShotList}
              disabled={isLoading || !brief.trim()}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] disabled:opacity-30 text-white font-black px-6 py-3 rounded-2xl transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-[var(--color-accent)]/20 active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Shot List
            </button>
          </div>
        </div>
      </div>

      {/* Shot List Grid */}
      {shots.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">
            Shot List <span className="text-white/20">({shots.length} shots)</span>
          </h3>
          <button
            onClick={addShot}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all active:scale-95"
          >
            <Plus className="w-3 h-3" />
            Add Shot
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shots.map((shot) => (
          <div
            key={shot.id}
            className="glass-card rounded-[2rem] overflow-hidden border border-white/5 group hover:border-[var(--color-accent)]/30 transition-all shadow-2xl bg-white/[0.02]"
          >
            {/* Thumbnail placeholder */}
            <div className="aspect-video bg-black/40 relative flex items-center justify-center">
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white/80 border border-white/10 flex items-center gap-2">
                <Video className="w-3 h-3 text-[var(--color-accent)]" />
                SCENE {String(shot.sceneNumber).padStart(2, '0')}
              </div>
              <button
                onClick={() => deleteShot(shot.id)}
                className="absolute top-3 right-3 p-2 bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-all text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-60 transition-opacity">
                <ChevronRight className="w-8 h-8 text-white/40" />
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{shot.duration}s</span>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4">
              <textarea
                value={shot.description}
                onChange={(e) => updateShot(shot.id, 'description', e.target.value)}
                placeholder="Shot description..."
                className="w-full bg-black/20 rounded-xl p-3 text-sm text-white/90 border border-white/5 focus:border-[var(--color-accent)]/50 focus:ring-0 resize-none suggestions-scrollbar h-20"
              />

              {/* Shot Type, Camera Movement, Duration pills */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={shot.shotType}
                  onChange={(e) => updateShot(shot.id, 'shotType', e.target.value)}
                  className="bg-black/30 border border-white/5 rounded-full px-3 py-1.5 text-[9px] font-black text-white/60 uppercase tracking-widest focus:ring-0 cursor-pointer"
                >
                  {SHOT_TYPES.map(t => (
                    <option key={t} value={t} className="bg-gray-900">{t}</option>
                  ))}
                </select>
                <select
                  value={shot.cameraMovement}
                  onChange={(e) => updateShot(shot.id, 'cameraMovement', e.target.value)}
                  className="bg-black/30 border border-white/5 rounded-full px-3 py-1.5 text-[9px] font-black text-white/60 uppercase tracking-widest focus:ring-0 cursor-pointer"
                >
                  {CAMERA_MOVEMENTS.map(m => (
                    <option key={m} value={m} className="bg-gray-900">{m}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 bg-black/30 border border-white/5 rounded-full px-3 py-1.5">
                  <button
                    onClick={() => updateShot(shot.id, 'duration', Math.max(1, shot.duration - 0.5))}
                    className="text-[9px] font-black text-white/40 hover:text-white w-4 text-center"
                  >-</button>
                  <span className="text-[9px] font-black text-white/80 min-w-[32px] text-center">{shot.duration.toFixed(1)}s</span>
                  <button
                    onClick={() => updateShot(shot.id, 'duration', Math.min(30, shot.duration + 0.5))}
                    className="text-[9px] font-black text-white/40 hover:text-white w-4 text-center"
                  >+</button>
                </div>
              </div>

              {/* Notes */}
              <textarea
                value={shot.notes}
                onChange={(e) => updateShot(shot.id, 'notes', e.target.value)}
                placeholder="Production notes..."
                className="w-full bg-black/10 rounded-xl px-3 py-2 text-[10px] text-white/50 border border-dashed border-white/10 focus:border-white/30 focus:ring-0 resize-none suggestions-scrollbar h-14"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {shots.length === 0 && !isLoading && (
        <div className="glass-card rounded-[2.5rem] border border-dashed border-white/10 p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
            <Video className="w-7 h-7 text-white/20" />
          </div>
          <p className="text-sm text-white/30 font-medium max-w-md">
            Describe your video concept above and generate an AI-powered shot list, or add shots manually.
          </p>
          <button
            onClick={addShot}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all active:scale-95 mt-2"
          >
            <Plus className="w-4 h-4" />
            Add First Shot
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <AILoadingOverlay
          message="Generating shot list..."
          onCancel={cancelGeneration}
        />
      )}
    </main>
  );
};

export default VideoStudio;
