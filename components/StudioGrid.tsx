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

const CATEGORY_META: Record<StudioCategory, { label: string; description: string }> = {
  design: { label: 'Design', description: 'Brand identity, visuals, and creative direction' },
  production: { label: 'Production', description: 'Content creation, editing, and media production' },
  marketing: { label: 'Marketing', description: 'Campaigns, strategy, and market intelligence' },
  management: { label: 'Management', description: 'Orchestration, storage, and system control' },
};

const CATEGORIES: { key: StudioCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'design', label: 'Design' },
  { key: 'production', label: 'Production' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'management', label: 'Management' },
];

const STUDIOS: StudioInfo[] = [
  { id: 'creator_studio', label: 'Creative', icon: Sparkles, color: '#a78bfa', category: 'design',
    brief: 'AI-powered image generation studio — turn ideas into stunning visuals.',
    features: ['Text-to-image generation', 'Style presets & customization', 'Batch creation', 'Export in multiple formats'] },
  { id: 'storyboard_studio', label: 'Storyboard', icon: Layout, color: '#60a5fa', category: 'production',
    brief: 'Visual storytelling — plan scenes, arrange shots, build narratives.',
    features: ['Scene-by-scene planning', 'Shot composition tools', 'Timeline management', 'Export to video flow'] },
  { id: 'branding_studio', label: 'Brand', icon: PenTool, color: '#f59e0b', category: 'design',
    brief: 'Full brand identity suite — logos, guidelines, and multi-variant export.',
    features: ['Logo generation', 'Color palette management', 'Brand guideline docs', 'Multi-variant export'] },
  { id: 'photoshoot_director', label: 'Photo', icon: Camera, color: '#34d399', category: 'production',
    brief: 'Professional photoshoot planning with AI presets.',
    features: ['Camera perspective presets', 'Lighting style library', 'AI scene suggestions', 'Shoot mood boarding'] },
  { id: 'marketing_studio', label: 'Marketing', icon: BarChart3, color: '#f472b6', category: 'marketing',
    brief: 'Marketing content — ad copy, social posts, and campaign assets.',
    features: ['Ad copy generation', 'Social media asset creation', 'A/B variant testing', 'Performance analytics'] },
  { id: 'campaign_studio', label: 'Campaign', icon: ShoppingCart, color: '#fb923c', category: 'marketing',
    brief: 'Multi-channel campaign orchestration with unified tracking.',
    features: ['Multi-channel management', 'Campaign timeline', 'Results dashboard', 'Cross-platform export'] },
  { id: 'edit_studio', label: 'Edit', icon: Edit3, color: '#818cf8', category: 'production',
    brief: 'Post-production editing suite for images and video.',
    features: ['Image editing tools', 'Video timeline editing', 'Filter & effect library', 'Batch processing'] },
  { id: 'plan_studio', label: 'Plan', icon: PlanIcon, color: '#2dd4bf', category: 'marketing',
    brief: 'Project planning and resource management for production workflows.',
    features: ['Project timeline planning', 'Resource allocation', 'Milestone tracking', 'Team collaboration'] },
  { id: 'controller_studio', label: 'Controller', icon: Cpu, color: '#a78bfa', category: 'management',
    brief: 'Central command center to manage all studios.',
    features: ['Cross-studio orchestration', 'Unified dashboard', 'Workflow automation', 'Real-time sync'] },
  { id: 'batch_image_studio', label: 'Batch', icon: Grid3x3, color: '#6ee7b7', category: 'production',
    brief: 'Bulk AI image generation with consistent styling.',
    features: ['Multi-image generation', 'Consistent style across batch', 'Grid preview', 'Bulk export'] },
  { id: 'bg_remover_studio', label: 'BG Remover', icon: ImageDown, color: '#fcd34d', category: 'production',
    brief: 'Intelligent background removal and replacement.',
    features: ['AI background removal', 'Background replacement', 'Batch processing', 'Fine-edge detection'] },
  { id: 'voice_over_studio', label: 'Voice', icon: Volume2, color: '#a78bfa', category: 'production',
    brief: 'Professional voice-over generation with multiple AI voices.',
    features: ['Multi-voice library', 'Language & accent support', 'SSML fine-tuning', 'Waveform preview'] },
  { id: 'prompt_studio', label: 'Prompt', icon: MessageSquare, color: '#38bdf8', category: 'design',
    brief: 'Prompt engineering sandbox for testing AI instructions.',
    features: ['Prompt testing console', 'Version history', 'Template library', 'Output comparison'] },
  { id: 'prepilot_agency_suite', label: 'PrePilot', icon: Briefcase, color: '#e879f9', category: 'management',
    brief: 'Full-agency pre-production suite — plan, pitch, and prepare.',
    features: ['Pre-production planning', 'Client pitch generation', 'Resource estimation', 'Agency workflow tools'] },
  { id: 'video_studio', label: 'Video', icon: Film, color: '#f87171', category: 'production',
    brief: 'AI-assisted video creation and editing pipeline.',
    features: ['Video generation', 'Scene composition', 'Transition library', 'Multi-track editing'] },
  { id: 'command_center', label: 'Command', icon: ShieldCheck, color: '#4ade80', category: 'management',
    brief: 'System operations dashboard for monitoring the platform.',
    features: ['System health monitoring', 'Usage analytics', 'Service management', 'Alert configuration'] },
  { id: 'asset_library', label: 'Vault', icon: Archive, color: '#fbbf24', category: 'management',
    brief: 'Central media asset library with intelligent search.',
    features: ['Asset organization', 'Smart search & filters', 'Version control', 'Team sharing'] },
  { id: 'archives', label: 'Archives', icon: Clock, color: '#9ca3af', category: 'management',
    brief: 'Historical project storage with full search and restore.',
    features: ['Project history', 'Full-text search', 'Restore from archive', 'Export archive'] },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, color: '#fb7185', category: 'management',
    brief: 'Studio calendar for scheduling and deadline tracking.',
    features: ['Event scheduling', 'Deadline tracking', 'Content calendar', 'Team sync'] },
  { id: 'admin_studio', label: 'Admin', icon: ShieldCheck, color: '#f59e0b', category: 'management',
    brief: 'System administration panel for user management.',
    features: ['User management', 'System configuration', 'Maintenance mode', 'Audit logs'] },
];

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

interface StudioCardProps {
  studio: StudioInfo;
  index: number;
  onNavigate: (view: AppView) => void;
}

function StudioCard({ studio, index, onNavigate }: StudioCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = studio.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.02, ease: [0.2, 0.45, 0.15, 1] }}
      onClick={() => onNavigate(studio.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={cn(
        'studio-card relative rounded-2xl border overflow-hidden text-left cursor-pointer group',
        'bg-white/[0.03]',
        isHovered ? 'border-white/15' : 'border-white/5',
      )}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(500px circle at 50% -10%, ${studio.color}08, transparent 60%)`,
        }}
      />
      <div className="relative p-4 md:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{
              backgroundColor: `${studio.color}12`,
              color: studio.color,
            }}
          >
            <Icon className="w-5 h-5" style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white/90">{studio.label}</h3>
            <p className="text-[11px] text-white/35 leading-relaxed truncate">{studio.brief}</p>
          </div>
        </div>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/[0.04] pt-3 mt-3">
                <ul className="space-y-2">
                  {studio.features.map((f, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className="flex items-center gap-2 text-[11px] text-white/40"
                    >
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: studio.color }} />
                      {f}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

function SectionHeader({ category }: { category: StudioCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h2 className="text-xs font-semibold text-white/25 uppercase tracking-[0.25em]">{meta.label}</h2>
      <span className="text-[10px] text-white/12 font-mono tracking-normal">/ {meta.description}</span>
    </div>
  );
}

export default function StudioGrid({ onNavigate }: { onNavigate: (view: AppView) => void }) {
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

  const grouped = useMemo(() => {
    if (category !== 'all' || query) return null;
    const groups: Record<StudioCategory, StudioInfo[]> = { design: [], production: [], marketing: [], management: [] };
    for (const s of STUDIOS) {
      groups[s.category].push(s);
    }
    return groups;
  }, [category, query]);

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
      className="w-full space-y-10"
    >
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/15 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => startTransition(() => setQuery(e.target.value))}
            placeholder="Search studios…"
            className="w-full h-9 pl-8 pr-8 rounded-lg border border-white/5 bg-white/[0.02] text-white/60 text-xs outline-none focus:border-white/10 focus:bg-white/[0.04] transition-all duration-200 placeholder:text-white/12"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200',
                category === cat.key
                  ? 'bg-white/8 text-white/80 border border-white/10'
                  : 'text-white/25 border border-transparent hover:text-white/45 hover:bg-white/[0.02]',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {recentStudios.length > 0 && !query && category === 'all' && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <RecentIcon className="w-3 h-3 text-white/20" />
            <h2 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Recent</h2>
            <span className="text-[10px] text-white/15 font-mono">/ quickly resume</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {recentStudios.map((studio, i) => (
              <StudioCard key={studio.id} studio={studio} index={i} onNavigate={trackAndNavigate} />
            ))}
          </div>
          <hr className="mt-8 border-white/[0.03]" />
        </section>
      )}

      {grouped ? (
        (Object.entries(grouped) as [StudioCategory, StudioInfo[]][]).map(([cat, studios], gi, arr) => (
          <section key={cat}>
            <SectionHeader category={cat} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
              {studios.map((studio, i) => (
                <StudioCard key={studio.id} studio={studio} index={i} onNavigate={trackAndNavigate} />
              ))}
            </div>
            {gi < arr.length - 1 && <div className="section-divider mt-10" />}
          </section>
        ))
      ) : (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">
              {query ? `Results (${filtered.length})` : CATEGORY_META[category as StudioCategory]?.label ?? 'Studios'}
            </h2>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/15">
              <Search className="w-6 h-6 mb-2" />
              <p className="text-sm text-white/25">No studios match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
              {filtered.map((studio, i) => (
                <StudioCard key={studio.id} studio={studio} index={i} onNavigate={trackAndNavigate} />
              ))}
            </div>
          )}
        </section>
      )}
    </motion.div>
  );
}
