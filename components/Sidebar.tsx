import React, { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Image, Layout, Camera, Edit3, PenTool, Volume2, BarChart3,
  ShoppingCart, Film, MessageSquare, Music, Briefcase, Cpu,
  Archive, ShieldCheck, ChevronLeft, ChevronRight, Search,
  Sun, Moon, Monitor, SquareDashed, Command,
  Clock, Star, Plus, PanelLeftClose, PanelLeft,
  CalendarDays, Grid3x3, ImageDown, AlertTriangle,
  Home,
} from 'lucide-react';
import { AppView } from '../types';
import { cn } from '../lib/utils';
import { LOGO_IMAGE_URL } from '../constants';
import { ErrorService } from '../lib/errorService';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenSearch: () => void;
  onOpenErrorDashboard: () => void;
  theme: string;
  onThemeChange: (t: string) => void;
  isAdmin: boolean;
}

interface StudioEntry {
  id: AppView;
  label: string;
  icon: React.FC<any>;
  category: 'studio' | 'suite' | 'system';
}

const STUDIOS: StudioEntry[] = [
  { id: 'creator_studio', label: 'Creative', icon: Sparkles, category: 'studio' },
  { id: 'storyboard_studio', label: 'Storyboard', icon: Layout, category: 'studio' },
  { id: 'branding_studio', label: 'Brand', icon: PenTool, category: 'studio' },
  { id: 'photoshoot_director', label: 'Photo', icon: Camera, category: 'studio' },
  { id: 'marketing_studio', label: 'Marketing', icon: BarChart3, category: 'studio' },
  { id: 'campaign_studio', label: 'Campaign', icon: ShoppingCart, category: 'studio' },
  { id: 'edit_studio', label: 'Edit', icon: Edit3, category: 'studio' },
  { id: 'plan_studio', label: 'Plan', icon: Layout, category: 'studio' },
  { id: 'controller_studio', label: 'Controller', icon: Cpu, category: 'studio' },
  { id: 'batch_image_studio', label: 'Batch', icon: Grid3x3, category: 'studio' },
  { id: 'bg_remover_studio', label: 'BG Remover', icon: ImageDown, category: 'studio' },
  { id: 'voice_over_studio', label: 'Voice', icon: Volume2, category: 'studio' },
  { id: 'prompt_studio', label: 'Prompt', icon: MessageSquare, category: 'studio' },
  { id: 'prepilot_agency_suite', label: 'PrePilot', icon: Briefcase, category: 'suite' },
  { id: 'command_center', label: 'Command', icon: ShieldCheck, category: 'system' },
  { id: 'asset_library', label: 'Vault', icon: Archive, category: 'system' },
  { id: 'archives', label: 'Archives', icon: Clock, category: 'system' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, category: 'system' },
];

const THEMES = [
  { id: 'dark', icon: Moon },
];

const FAVORITES: AppView[] = ['creator_studio', 'branding_studio', 'marketing_studio', 'prepilot_agency_suite'];

const RECENT: AppView[] = ['creator_studio', 'prepilot_agency_suite', 'command_center'];

const Sidebar: React.FC<SidebarProps> = React.memo((({ collapsed, onToggleCollapse, activeView, onNavigate, onOpenSearch, onOpenErrorDashboard, theme, onThemeChange, isAdmin }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const errorCount = useSyncExternalStore(
    cb => ErrorService.subscribe(cb),
    () => ErrorService.getMetrics().unresolvedCount,
  );

  const renderStudioItem = (studio: StudioEntry) => {
    const isActive = activeView === studio.id;
    const Icon = studio.icon;
    return (
      <button
        key={studio.id}
        onClick={() => { onNavigate(studio.id); setMobileOpen(false); }}
        className={cn(
          'relative flex items-center gap-3 w-full rounded-xl transition-all group',
          collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
          isActive
            ? 'text-white bg-[var(--color-accent)]/10'
            : 'text-white/40 hover:text-white/80 hover:bg-white/5',
        )}
        title={collapsed ? studio.label : undefined}
      >
        <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-[var(--color-accent)]')} />
        {!collapsed && (
          <span className="text-[10px] font-black uppercase tracking-widest">{studio.label}</span>
        )}
        {isActive && !collapsed && (
          <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--color-accent)] rounded-full" />
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center border-b border-white/5', collapsed ? 'justify-center p-3' : 'px-4 py-4 gap-3')}>
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src={LOGO_IMAGE_URL}
            alt="Mada Agency"
            className="w-7 h-7 object-contain"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight uppercase leading-none">Mada</span>
            <span className="text-[8px] font-bold text-[var(--color-accent)] uppercase tracking-[0.3em] opacity-60 leading-tight mt-0.5">Agency</span>
          </div>
        )}
      </div>

      {/* Search trigger */}
      <div className={cn('px-2 pt-3', collapsed && 'px-1')}>
        <button
          onClick={onOpenSearch}
          className={cn(
            'flex items-center gap-2 w-full bg-white/5 border border-white/10 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.07] transition-all',
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
          )}
        >
          <Search className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="text-[10px] font-medium flex-1 text-left">Search...</span>
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-mono text-white/20">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto suggestions-scrollbar px-2 py-3 space-y-4">
        {/* Home */}
        <div>
          <button
            onClick={() => { onNavigate('home'); setMobileOpen(false); }}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl transition-all group',
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
              activeView === 'home'
                ? 'text-white bg-[var(--color-accent)]/10'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5',
            )}
            title={collapsed ? 'Home' : undefined}
          >
            <Home className={cn('w-4 h-4 shrink-0', activeView === 'home' && 'text-[var(--color-accent)]')} />
            {!collapsed && (
              <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
            )}
            {activeView === 'home' && !collapsed && (
              <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--color-accent)] rounded-full" />
            )}
          </button>
        </div>
        <hr className="border-white/[0.03]" />

        {/* Favorites */}
        {!collapsed && (
          <div>
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 px-3 mb-2">Favorites</div>
            <div className="space-y-0.5">
              {STUDIOS.filter(s => FAVORITES.includes(s.id)).map(renderStudioItem)}
            </div>
          </div>
        )}

        {/* Studios */}
        <div>
          {!collapsed && <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 px-3 mb-2">Studios</div>}
          <div className="space-y-0.5">
            {STUDIOS.filter(s => s.category === 'studio').map(renderStudioItem)}
          </div>
        </div>

        {/* Suite & System */}
        <div className="space-y-0.5">
          {!collapsed && <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 px-3 mb-2">Tools</div>}
          {STUDIOS.filter(s => s.category !== 'studio').map(renderStudioItem)}
        </div>

        {/* Recent projects (collapsed only shows icon) */}
        {!collapsed && (
          <div>
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 px-3 mb-2">Recent</div>
            <div className="space-y-0.5">
              {RECENT.map(view => {
                const studio = STUDIOS.find(s => s.id === view);
                if (!studio) return null;
                const Icon = studio.icon;
                return (
                  <button
                    key={view}
                    onClick={() => { onNavigate(view); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10px] font-medium">{studio.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t border-white/5 p-2 space-y-1">
        {/* Error Dashboard */}
        <button
          onClick={onOpenErrorDashboard}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative',
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
            errorCount > 0
              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
              : 'text-white/30 hover:text-white/60 hover:bg-white/5',
          )}
          title={collapsed ? `Errors (${errorCount})` : undefined}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Errors</span>
              {errorCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[8px] font-bold min-w-[18px] text-center">
                  {errorCount > 99 ? '99+' : errorCount}
                </span>
              )}
            </>
          )}
          {collapsed && errorCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[7px] font-bold text-white flex items-center justify-center">
              {errorCount > 9 ? '!' : errorCount}
            </span>
          )}
        </button>

        {/* Theme */}
        <div className={cn('flex', collapsed ? 'flex-col items-center gap-1' : 'items-center justify-between px-2 py-1')}>
          {!collapsed && <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Theme</span>}
          <div className="flex gap-1">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={cn(
                  'w-5 h-5 rounded-full border transition-all',
                  theme === t.id
                    ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] scale-110'
                    : 'border-white/10 opacity-40 hover:opacity-80',
                  t.id === 'dark' ? 'bg-zinc-800' : t.id === 'light' ? 'bg-white' : t.id === 'industrial' ? 'bg-amber-500' : 'bg-cyan-400',
                )}
                title={t.id}
              />
            ))}
          </div>
        </div>

        {/* Admin */}
        {isAdmin && !collapsed && (
          <button
            onClick={() => { onNavigate('admin_studio'); setMobileOpen(false); }}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              activeView === 'admin_studio' ? 'text-white bg-amber-500/10' : 'text-white/30 hover:text-white/60 hover:bg-white/5',
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'flex items-center justify-center w-full rounded-xl text-white/20 hover:text-white/60 hover:bg-white/5 transition-all',
            collapsed ? 'p-2' : 'p-2',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md"
      >
        <PanelLeft className="w-4 h-4 text-white/60" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-[9999]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[280px] h-full bg-[rgba(var(--color-background-base-rgb),0.98)] border-r border-white/10 overflow-hidden"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 bg-[rgba(var(--color-background-base-rgb),0.95)] backdrop-blur-xl border-r border-white/5 transition-all duration-300',
          collapsed ? 'w-[60px]' : 'w-[220px]',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}));

export default Sidebar;