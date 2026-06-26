import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Layout, PenTool, Camera, BarChart3, ShoppingCart, Edit3,
  Layout as PlanIcon, Cpu, Grid3x3, ImageDown, Volume2, MessageSquare,
  Briefcase, ShieldCheck, Archive, Clock, CalendarDays, Film,
  LucideIcon,
} from 'lucide-react';
import { AppView } from '../types';
import { cn } from '../lib/utils';

interface StudioInfo {
  id: AppView;
  label: string;
  icon: LucideIcon;
  brief: string;
  features: string[];
  color: string;
}

const STUDIOS: StudioInfo[] = [
  { id: 'creator_studio', label: 'Creative', icon: Sparkles, color: '#a78bfa',
    brief: 'AI-powered image generation studio — turn ideas into stunning visuals instantly.',
    features: ['Text-to-image generation', 'Style presets & customization', 'Batch creation', 'Export in multiple formats'] },
  { id: 'storyboard_studio', label: 'Storyboard', icon: Layout, color: '#60a5fa',
    brief: 'Visual storytelling made simple. Plan scenes, arrange shots, and build narratives.',
    features: ['Scene-by-scene planning', 'Shot composition tools', 'Timeline management', 'Export to video flow'] },
  { id: 'branding_studio', label: 'Brand', icon: PenTool, color: '#f59e0b',
    brief: 'Full brand identity suite — from logos to comprehensive brand guidelines.',
    features: ['Logo generation', 'Color palette management', 'Brand guideline docs', 'Multi-variant export'] },
  { id: 'photoshoot_director', label: 'Photo', icon: Camera, color: '#34d399',
    brief: 'Professional photoshoot planning with AI-driven camera and lighting presets.',
    features: ['Camera perspective presets', 'Lighting style library', 'AI scene suggestions', 'Shoot mood boarding'] },
  { id: 'marketing_studio', label: 'Marketing', icon: BarChart3, color: '#f472b6',
    brief: 'Create compelling marketing content — ad copy, social posts, and campaign assets.',
    features: ['Ad copy generation', 'Social media asset creation', 'A/B variant testing', 'Performance analytics'] },
  { id: 'campaign_studio', label: 'Campaign', icon: ShoppingCart, color: '#fb923c',
    brief: 'Multi-channel campaign orchestration with unified tracking and results.',
    features: ['Multi-channel management', 'Campaign timeline', 'Results dashboard', 'Cross-platform export'] },
  { id: 'edit_studio', label: 'Edit', icon: Edit3, color: '#818cf8',
    brief: 'Post-production editing suite for images and video content.',
    features: ['Image editing tools', 'Video timeline editing', 'Filter & effect library', 'Batch processing'] },
  { id: 'plan_studio', label: 'Plan', icon: PlanIcon, color: '#2dd4bf',
    brief: 'Project planning and resource management for production workflows.',
    features: ['Project timeline planning', 'Resource allocation', 'Milestone tracking', 'Team collaboration'] },
  { id: 'controller_studio', label: 'Controller', icon: Cpu, color: '#a78bfa',
    brief: 'Central command center to manage and synchronize across all studios.',
    features: ['Cross-studio orchestration', 'Unified dashboard', 'Workflow automation', 'Real-time sync'] },
  { id: 'batch_image_studio', label: 'Batch', icon: Grid3x3, color: '#6ee7b7',
    brief: 'Bulk AI image generation with consistent styling across all outputs.',
    features: ['Multi-image generation', 'Consistent style across batch', 'Grid preview', 'Bulk export'] },
  { id: 'bg_remover_studio', label: 'BG Remover', icon: ImageDown, color: '#fcd34d',
    brief: 'Intelligent background removal and replacement for any image.',
    features: ['AI background removal', 'Background replacement', 'Batch processing', 'Fine-edge detection'] },
  { id: 'voice_over_studio', label: 'Voice', icon: Volume2, color: '#a78bfa',
    brief: 'Professional voice-over generation with multiple AI voices and languages.',
    features: ['Multi-voice library', 'Language & accent support', 'SSML fine-tuning', 'Waveform preview'] },
  { id: 'prompt_studio', label: 'Prompt', icon: MessageSquare, color: '#38bdf8',
    brief: 'Prompt engineering sandbox for testing and refining AI instructions.',
    features: ['Prompt testing console', 'Version history', 'Template library', 'Output comparison'] },
  { id: 'prepilot_agency_suite', label: 'PrePilot', icon: Briefcase, color: '#e879f9',
    brief: 'Full-agency pre-production suite — plan, pitch, and prepare with AI.',
    features: ['Pre-production planning', 'Client pitch generation', 'Resource estimation', 'Agency workflow tools'] },
  { id: 'video_studio', label: 'Video', icon: Film, color: '#f87171',
    brief: 'AI-assisted video creation and editing pipeline.',
    features: ['Video generation', 'Scene composition', 'Transition library', 'Multi-track editing'] },
  { id: 'command_center', label: 'Command', icon: ShieldCheck, color: '#4ade80',
    brief: 'System operations dashboard for monitoring and managing the platform.',
    features: ['System health monitoring', 'Usage analytics', 'Service management', 'Alert configuration'] },
  { id: 'asset_library', label: 'Vault', icon: Archive, color: '#fbbf24',
    brief: 'Central media asset library with intelligent search and organization.',
    features: ['Asset organization', 'Smart search & filters', 'Version control', 'Team sharing'] },
  { id: 'archives', label: 'Archives', icon: Clock, color: '#9ca3af',
    brief: 'Historical project storage with full search and restore capabilities.',
    features: ['Project history', 'Full-text search', 'Restore from archive', 'Export archive'] },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, color: '#fb7185',
    brief: 'Studio calendar for scheduling, deadlines, and content planning.',
    features: ['Event scheduling', 'Deadline tracking', 'Content calendar', 'Team sync'] },
  { id: 'admin_studio', label: 'Admin', icon: ShieldCheck, color: '#f59e0b',
    brief: 'System administration panel for user management and platform config.',
    features: ['User management', 'System configuration', 'Maintenance mode', 'Audit logs'] },
];

interface StudioGridProps {
  onNavigate: (view: AppView) => void;
}

export default function StudioGrid({ onNavigate }: StudioGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {STUDIOS.map(studio => {
          const Icon = studio.icon;
          const isHovered = hoveredId === studio.id;
          return (
            <motion.button
              key={studio.id}
              onClick={() => onNavigate(studio.id)}
              onMouseEnter={() => setHoveredId(studio.id)}
              onMouseLeave={() => setHoveredId(null)}
              layout
              className={cn(
                'relative rounded-2xl border overflow-hidden text-left transition-all',
                'bg-white/[0.03] hover:bg-white/[0.06]',
                isHovered ? 'border-white/20 shadow-xl shadow-black/20' : 'border-white/5',
              )}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${studio.color}15, transparent 40%)`,
                  opacity: isHovered ? 1 : 0,
                }}
              />
              <div className="relative p-4 md:p-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300"
                  style={{
                    backgroundColor: `${studio.color}15`,
                    color: studio.color,
                    boxShadow: isHovered ? `0 0 20px ${studio.color}20` : 'none',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{studio.label}</h3>
                <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">{studio.brief}</p>
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-white/5 pt-3">
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">Capabilities</p>
                      <ul className="space-y-1">
                        {studio.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-[9px] text-white/50">
                            <span
                              className="w-1 h-1 rounded-full shrink-0"
                              style={{ backgroundColor: studio.color }}
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
