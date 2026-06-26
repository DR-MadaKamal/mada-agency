import { useState, useRef, useCallback, useMemo, useEffect, startTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Layout, PenTool, Camera, BarChart3, ShoppingCart, Edit3,
  Layout as PlanIcon, Cpu, Grid3x3, ImageDown, Volume2, MessageSquare,
  Briefcase, ShieldCheck, Archive, Clock, CalendarDays, Film,
  Search, X, Clock as RecentIcon,
  LucideIcon,
} from 'lucide-react';
import { AppView } from '../types';
import { cn } from '../lib/utils';

type StudioCategory = 'design' | 'production' | 'marketing' | 'management';

interface StudioInfo {
  id: AppView;
  label: string;
  icon: LucideIcon;
  brief: string;
  features: string[];
  color: string;
  category: StudioCategory;
}

const CATEGORIES: { key: StudioCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'design', label: 'Design' },
  { key: 'production', label: 'Production' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'management', label: 'Management' },
];

const STUDIOS: StudioInfo[] = [
  { id: 'creator_studio', label: 'Creative', icon: Sparkles, color: '#a78bfa', category: 'design',
    brief: 'AI-powered image generation studio — turn ideas into stunning visuals instantly.',
    features: ['Text-to-image generation', 'Style presets & customization', 'Batch creation', 'Export in multiple formats'] },
  { id: 'storyboard_studio', label: 'Storyboard', icon: Layout, color: '#60a5fa', category: 'production',
    brief: 'Visual storytelling made simple. Plan scenes, arrange shots, and build narratives.',
    features: ['Scene-by-scene planning', 'Shot composition tools', 'Timeline management', 'Export to video flow'] },
  { id: 'branding_studio', label: 'Brand', icon: PenTool, color: '#f59e0b', category: 'design',
    brief: 'Full brand identity suite — from logos to comprehensive brand guidelines.',
    features: ['Logo generation', 'Color palette management', 'Brand guideline docs', 'Multi-variant export'] },
  { id: 'photoshoot_director', label: 'Photo', icon: Camera, color: '#34d399', category: 'production',
    brief: 'Professional photoshoot planning with AI-driven camera and lighting presets.',
    features: ['Camera perspective presets', 'Lighting style library', 'AI scene suggestions', 'Shoot mood boarding'] },
  { id: 'marketing_studio', label: 'Marketing', icon: BarChart3, color: '#f472b6', category: 'marketing',
    brief: 'Create compelling marketing content — ad copy, social posts, and campaign assets.',
    features: ['Ad copy generation', 'Social media asset creation', 'A/B variant testing', 'Performance analytics'] },
  { id: 'campaign_studio', label: 'Campaign', icon: ShoppingCart, color: '#fb923c', category: 'marketing',
    brief: 'Multi-channel campaign orchestration with unified tracking and results.',
    features: ['Multi-channel management', 'Campaign timeline', 'Results dashboard', 'Cross-platform export'] },
  { id: 'edit_studio', label: 'Edit', icon: Edit3, color: '#818cf8', category: 'production',
    brief: 'Post-production editing suite for images and video content.',
    features: ['Image editing tools', 'Video timeline editing', 'Filter & effect library', 'Batch processing'] },
  { id: 'plan_studio', label: 'Plan', icon: PlanIcon, color: '#2dd4bf', category: 'marketing',
    brief: 'Project planning and resource management for production workflows.',
    features: ['Project timeline planning', 'Resource allocation', 'Milestone tracking', 'Team collaboration'] },
  { id: 'controller_studio', label: 'Controller', icon: Cpu, color: '#a78bfa', category: 'management',
    brief: 'Central command center to manage and synchronize across all studios.',
    features: ['Cross-studio orchestration', 'Unified dashboard', 'Workflow automation', 'Real-time sync'] },
  { id: 'batch_image_studio', label: 'Batch', icon: Grid3x3, color: '#6ee7b7', category: 'production',
    brief: 'Bulk AI image generation with consistent styling across all outputs.',
    features: ['Multi-image generation', 'Consistent style across batch', 'Grid preview', 'Bulk export'] },
  { id: 'bg_remover_studio', label: 'BG Remover', icon: ImageDown, color: '#fcd34d', category: 'production',
    brief: 'Intelligent background removal and replacement for any image.',
    features: ['AI background removal', 'Background replacement', 'Batch processing', 'Fine-edge detection'] },
  { id: 'voice_over_studio', label: 'Voice', icon: Volume2, color: '#a78bfa', category: 'production',
    brief: 'Professional voice-over generation with multiple AI voices and languages.',
    features: ['Multi-voice library', 'Language & accent support', 'SSML fine-tuning', 'Waveform preview'] },
  { id: 'prompt_studio', label: 'Prompt', icon: MessageSquare, color: '#38bdf8', category: 'design',
    brief: 'Prompt engineering sandbox for testing and refining AI instructions.',
    features: ['Prompt testing console', 'Version history', 'Template library', 'Output comparison'] },
  { id: 'prepilot_agency_suite', label: 'PrePilot', icon: Briefcase, color: '#e879f9', category: 'management',
    brief: 'Full-agency pre-production suite — plan, pitch, and prepare with AI.',
    features: ['Pre-production planning', 'Client pitch generation', 'Resource estimation', 'Agency workflow tools'] },
  { id: 'video_studio', label: 'Video', icon: Film, color: '#f87171', category: 'production',
    brief: 'AI-assisted video creation and editing pipeline.',
    features: ['Video generation', 'Scene composition', 'Transition library', 'Multi-track editing'] },
  { id: 'command_center', label: 'Command', icon: ShieldCheck, color: '#4ade80', category: 'management',
    brief: 'System operations dashboard for monitoring and managing the platform.',
    features: ['System health monitoring', 'Usage analytics', 'Service management', 'Alert configuration'] },
  { id: 'asset_library', label: 'Vault', icon: Archive, color: '#fbbf24', category: 'management',
    brief: 'Central media asset library with intelligent search and organization.',
    features: ['Asset organization', 'Smart search & filters', 'Version control', 'Team sharing'] },
  { id: 'archives', label: 'Archives', icon: Clock, color: '#9ca3af', category: 'management',
    brief: 'Historical project storage with full search and restore capabilities.',
    features: ['Project history', 'Full-text search', 'Restore from archive', 'Export archive'] },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, color: '#fb7185', category: 'management',
    brief: 'Studio calendar for scheduling, deadlines, and content planning.',
    features: ['Event scheduling', 'Deadline tracking', 'Content calendar', 'Team sync'] },
  { id: 'admin_studio', label: 'Admin', icon: ShieldCheck, color: '#f59e0b', category: 'management',
    brief: 'System administration panel for user management and platform config.',
    features: ['User management', 'System configuration', 'Maintenance mode', 'Audit logs'] },
];

interface StudioGridProps {
  onNavigate: (view: AppView) => void;
}

function getCardCSS(studioColor: string) {
  return {
    '--tilt-x': '0deg',
    '--tilt-y': '0deg',
    '--mouse-x': '50%',
    '--mouse-y': '50%',
    '--card-color': studioColor,
  } as React.CSSProperties;
}

function StudioCard({ studio, index, onNavigate }: { studio: StudioInfo; index: number; onNavigate: (view: AppView) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const animFrame = useRef(0);
  const Icon = studio.icon;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      const tx = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
      const ty = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      el.style.setProperty('--mouse-x', `${px}%`);
      el.style.setProperty('--mouse-y', `${py}%`);
      el.style.setProperty('--tilt-x', `${tx}deg`);
      el.style.setProperty('--tilt-y', `${ty}deg`);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsFocused(false);
    cancelAnimationFrame(animFrame.current);
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', `0deg`);
    el.style.setProperty('--tilt-y', `0deg`);
    el.style.setProperty('--mouse-x', `50%`);
    el.style.setProperty('--mouse-y', `50%`);
  }, []);

  return (
    <motion.button
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.25, 0.4, 0.25, 1] }}
      onClick={() => onNavigate(studio.id)}
      onMouseEnter={() => { setIsHovered(true); setIsFocused(true); }}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={getCardCSS(studio.color)}
      className={cn(
        'studio-tilt relative rounded-2xl border overflow-hidden text-left cursor-pointer',
        'bg-white/[0.03]',
        isFocused ? 'border-white/25' : 'border-white/5',
        'transition-[border-color,background] duration-300',
      )}
    >
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--card-color)12, transparent 60%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--card-color)08, transparent 50%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      <div
        className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--card-color)15, transparent 50%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      <div
        className="relative p-4 md:p-5"
        style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ease-out"
            style={{
              backgroundColor: `${studio.color}18`,
              color: studio.color,
              boxShadow: isHovered ? `0 0 20px ${studio.color}20` : 'none',
            }}
          >
            <Icon className="w-5 h-5 transition-transform duration-300" style={{ transform: isHovered ? 'scale(1.15)' : 'scale(1)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{studio.label}</h3>
            <p className="text-[10px] text-white/30 leading-relaxed line-clamp-1">{studio.brief}</p>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-white/5 pt-3">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">Capabilities</p>
              <ul className="space-y-1">
                {studio.features.map((f, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    className="flex items-center gap-2 text-[9px] text-white/50"
                  >
                    <span
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{ backgroundColor: studio.color }}
                    />
                    {f}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

const RECENT_KEY = 'mada_recent_studios';
const MAX_RECENT = 4;

function getRecentStudios(): AppView[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as AppView[]) : [];
  } catch {
    return [];
  }
}

function trackStudioVisit(id: AppView) {
  try {
    const recent = getRecentStudios().filter((r) => r !== id);
    recent.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch { /* localStorage unavailable */ }
}

export default function StudioGrid({ onNavigate }: StudioGridProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<StudioCategory | 'all'>('all');
  const [recentIds, setRecentIds] = useState<AppView[]>(() => getRecentStudios());
  const inputRef = useRef<HTMLInputElement>(null);

  const trackAndNavigate = useCallback((id: AppView) => {
    trackStudioVisit(id);
    setRecentIds(getRecentStudios());
    onNavigate(id);
  }, [onNavigate]);

  const filtered = useMemo(() => {
    return STUDIOS.filter((s) => {
      if (category !== 'all' && s.category !== category) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        s.label.toLowerCase().includes(q) ||
        s.brief.toLowerCase().includes(q) ||
        s.features.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const recentStudios = useMemo(
    () => recentIds.map((id) => STUDIOS.find((s) => s.id === id)).filter(Boolean) as StudioInfo[],
    [recentIds],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-6"
    >
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => startTransition(() => setQuery(e.target.value))}
            placeholder="Search studios…  (Ctrl+K)"
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-white/5 bg-white/[0.03] text-white/80 text-sm placeholder:text-white/15 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all duration-200"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                category === cat.key
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.03]',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {recentStudios.length > 0 && !query && category === 'all' && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <RecentIcon className="w-4 h-4 text-white/20" />
            <h2 className="text-xs font-bold text-white/25 uppercase tracking-widest">Recent</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {recentStudios.map((studio, i) => (
              <StudioCard key={studio.id} studio={studio} index={i} onNavigate={trackAndNavigate} />
            ))}
          </div>
          <hr className="mt-6 border-white/5" />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-white/25 uppercase tracking-widest">
            {category === 'all' ? (query ? `Results (${filtered.length})` : 'All Studios') : `${CATEGORIES.find((c) => c.key === category)?.label} (${filtered.length})`}
          </h2>
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <Search className="w-8 h-8 mb-3" />
            <p className="text-sm">No studios match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filtered.map((studio, i) => (
              <StudioCard key={studio.id} studio={studio} index={i} onNavigate={trackAndNavigate} />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
