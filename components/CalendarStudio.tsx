import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, Plus, X, Sparkles,
  Circle, CheckCircle2, AlertCircle, Target
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'campaign' | 'deadline' | 'publish' | 'meeting' | 'review';
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed';
  studioType: string;
  description?: string;
}

const EVENT_STYLES: Record<string, { color: string; bg: string; icon: any }> = {
  campaign: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Target },
  deadline: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertCircle },
  publish: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Calendar },
  meeting: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: Clock },
  review: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Circle },
};

const STUDIO_OPTIONS = [
  'marketing_studio', 'campaign_studio', 'plan_studio', 'branding_studio',
  'creator_studio', 'prepilot_agency_suite',
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface CalendarStudioProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

export const CalendarStudio: React.FC<CalendarStudioProps> = ({ events, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({ title: '', type: 'campaign' as const, studioType: 'marketing_studio', description: '' });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const filteredEvents = useMemo(() => {
    if (!filterType) return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  const todayStr = new Date().toISOString().split('T')[0];

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim() || !selectedDate) return;
    onAddEvent({
      id: Date.now().toString(),
      title: newEvent.title.trim(),
      date: selectedDate,
      type: newEvent.type as any,
      status: 'scheduled',
      studioType: newEvent.studioType,
      description: newEvent.description.trim() || undefined,
    });
    setNewEvent({ title: '', type: 'campaign', studioType: 'marketing_studio', description: '' });
    setShowAddModal(false);
  };

  const selectedDateEvents = selectedDate ? filteredEvents.filter(e => e.date === selectedDate) : [];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
            <Calendar className="w-6 h-6 text-[var(--color-accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Content Calendar</h1>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
              {MONTHS[currentMonth]} {currentYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter pills */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {Object.entries(EVENT_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setFilterType(filterType === key ? null : key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                  filterType === key ? `${style.bg} ${style.color}` : 'text-white/30 hover:text-white/60'
                )}
              >
                {key}
              </button>
            ))}
          </div>
          <nav className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => { setCurrentMonth(new Date().getMonth()); setCurrentYear(new Date().getFullYear()); }} className="px-3 py-1.5 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Calendar Grid */}
        <div className="glass-card rounded-3xl border border-white/5 p-6">
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[9px] font-black text-white/20 uppercase tracking-widest py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-1" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    "aspect-square p-1 rounded-xl transition-all relative group",
                    isSelected ? 'bg-[var(--color-accent)]/20 ring-1 ring-[var(--color-accent)]' : 'hover:bg-white/5',
                    isToday && !isSelected && 'ring-1 ring-white/20'
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center h-full w-full rounded-lg text-xs font-bold",
                    isToday ? 'text-[var(--color-accent)]' : 'text-white/60',
                    isSelected ? 'text-white' : ''
                  )}>
                    {day}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((e, i) => {
                        const style = EVENT_STYLES[e.type] || EVENT_STYLES.campaign;
                        return <div key={i} className={`w-1.5 h-1.5 rounded-full ${style.color.replace('text-', 'bg-')}`} />;
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[6px] font-black text-white/30">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Selected Date Events */}
        <div className="glass-card rounded-3xl border border-white/5 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">
              {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
            </h3>
            {selectedDate && (
              <button
                onClick={() => setShowAddModal(true)}
                className="p-2 bg-[var(--color-accent)] rounded-xl text-white hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto suggestions-scrollbar">
            {selectedDateEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-10 h-10 text-white/10 mb-3" />
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">No events</p>
                {selectedDate && (
                  <button onClick={() => setShowAddModal(true)} className="mt-3 text-[9px] font-black text-[var(--color-accent)] uppercase tracking-widest hover:underline">
                    Add Event
                  </button>
                )}
              </div>
            ) : (
              selectedDateEvents.map(e => {
                const style = EVENT_STYLES[e.type] || EVENT_STYLES.campaign;
                const Icon = style.icon;
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border ${style.bg} group`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 ${style.color} shrink-0`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{e.title}</p>
                          <p className="text-[8px] font-medium text-white/30 uppercase tracking-wider mt-0.5">{e.studioType.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                        {e.status !== 'completed' && (
                          <button onClick={() => onUpdateEvent(e.id, { status: 'completed' })} className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => onDeleteEvent(e.id)} className="p-1 rounded-lg text-red-400 hover:bg-red-500/20 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {e.description && (
                      <p className="text-[10px] font-medium text-white/40 mt-2 leading-relaxed pl-7">{e.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 pl-7">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-wider",
                        e.status === 'completed' ? 'text-emerald-400' :
                        e.status === 'in_progress' ? 'text-blue-400' :
                        e.status === 'missed' ? 'text-red-400' : 'text-white/30'
                      )}>
                        {e.status.replace('_', ' ')}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                New Event
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Title</label>
                  <input
                    value={newEvent.title}
                    onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                    placeholder="Campaign launch, deadline..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[var(--color-accent)] transition-all"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleAddEvent(); }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Type</label>
                    <select
                      value={newEvent.type}
                      onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none"
                    >
                      {Object.keys(EVENT_STYLES).map(k => (
                        <option key={k} value={k} className="bg-zinc-900">{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Studio</label>
                    <select
                      value={newEvent.studioType}
                      onChange={e => setNewEvent(p => ({ ...p, studioType: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none"
                    >
                      {STUDIO_OPTIONS.map(s => (
                        <option key={s} value={s} className="bg-zinc-900">{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Description (optional)</label>
                  <textarea
                    value={newEvent.description}
                    onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-white/60 transition-all rounded-2xl bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEvent}
                    disabled={!newEvent.title.trim()}
                    className="flex-1 py-3 bg-[var(--color-accent)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 transition-all"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
