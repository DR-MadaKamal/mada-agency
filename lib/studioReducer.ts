import { SetStateAction } from 'react';
import type {
  CreatorStudioProject,
  PhotoshootDirectorProject,
  PromptStudioProject,
  VoiceOverStudioProject,
  BrandingStudioProject,
  CampaignStudioProject,
  PlanStudioProject,
  StoryboardStudioProject,
  MarketingStudioProject,
  EditStudioProject,
  ControllerStudioProject,
  PrePilotAgencySuiteProject,
  BatchImageStudioProject,
  BGStudioProject,
  AdminStudioProject,
  AppView,
} from '../types';
import type { CalendarEvent } from '../components/CalendarStudio';

export type StudioType =
  | 'creator_studio' | 'photoshoot_director' | 'prompt_studio' | 'voice_over_studio'
  | 'branding_studio' | 'campaign_studio' | 'plan_studio' | 'storyboard_studio'
  | 'marketing_studio' | 'edit_studio' | 'controller_studio' | 'batch_image_studio'
  | 'bg_remover_studio' | 'prepilot_agency_suite' | 'admin_studio';

export interface AppState {
  view: AppView;
  isBannerManagerOpen: boolean;
  isOmniSearchOpen: boolean;
  isErrorDashboardOpen: boolean;
  sidebarCollapsed: boolean;
  theme: string;
  creatorProjects: CreatorStudioProject[];
  activeCreatorIndex: number;
  photoshootProjects: PhotoshootDirectorProject[];
  activePhotoshootIndex: number;
  promptStudioProjects: PromptStudioProject[];
  activePromptStudioIndex: number;
  voiceOverProjects: VoiceOverStudioProject[];
  activeVoiceOverIndex: number;
  brandingProjects: BrandingStudioProject[];
  activeBrandingIndex: number;
  campaignProjects: CampaignStudioProject[];
  activeCampaignIndex: number;
  planProjects: PlanStudioProject[];
  activePlanIndex: number;
  storyboardProjects: StoryboardStudioProject[];
  activeStoryboardIndex: number;
  marketingProjects: MarketingStudioProject[];
  activeMarketingIndex: number;
  editProjects: EditStudioProject[];
  activeEditIndex: number;
  controllerProjects: ControllerStudioProject[];
  activeControllerIndex: number;
  batchImageProjects: BatchImageStudioProject[];
  activeBatchImageIndex: number;
  bgProjects: BGStudioProject[];
  activeBGIndex: number;
  prePilotProjects: PrePilotAgencySuiteProject[];
  activePrePilotIndex: number;
  adminProjects: AdminStudioProject[];
  activeAdminIndex: number;
  systemConfig: { activeStudios: string[]; maintenanceMode: boolean; allowNewRegistrations: boolean };
  branding: { logo: string; tagline: string };
  calendarEvents: CalendarEvent[];
}

export const studioProjectKeys: Record<StudioType, { projectKey: keyof AppState; indexKey: keyof AppState }> = {
  creator_studio: { projectKey: 'creatorProjects', indexKey: 'activeCreatorIndex' },
  photoshoot_director: { projectKey: 'photoshootProjects', indexKey: 'activePhotoshootIndex' },
  prompt_studio: { projectKey: 'promptStudioProjects', indexKey: 'activePromptStudioIndex' },
  voice_over_studio: { projectKey: 'voiceOverProjects', indexKey: 'activeVoiceOverIndex' },
  branding_studio: { projectKey: 'brandingProjects', indexKey: 'activeBrandingIndex' },
  campaign_studio: { projectKey: 'campaignProjects', indexKey: 'activeCampaignIndex' },
  plan_studio: { projectKey: 'planProjects', indexKey: 'activePlanIndex' },
  storyboard_studio: { projectKey: 'storyboardProjects', indexKey: 'activeStoryboardIndex' },
  marketing_studio: { projectKey: 'marketingProjects', indexKey: 'activeMarketingIndex' },
  edit_studio: { projectKey: 'editProjects', indexKey: 'activeEditIndex' },
  controller_studio: { projectKey: 'controllerProjects', indexKey: 'activeControllerIndex' },
  batch_image_studio: { projectKey: 'batchImageProjects', indexKey: 'activeBatchImageIndex' },
  bg_remover_studio: { projectKey: 'bgProjects', indexKey: 'activeBGIndex' },
  prepilot_agency_suite: { projectKey: 'prePilotProjects', indexKey: 'activePrePilotIndex' },
  admin_studio: { projectKey: 'adminProjects', indexKey: 'activeAdminIndex' },
};

export type StudioAction =
  | { type: 'UPDATE_PROJECT'; studioType: StudioType; payload: SetStateAction<any> }
  | { type: 'SET_ACTIVE_INDEX'; studioType: StudioType; index: number }
  | { type: 'ADD_PROJECT'; studioType: StudioType; factory: (count: number) => any }
  | { type: 'REMOVE_PROJECT'; studioType: StudioType; index: number; activeIndex: number; factory: (count: number) => any }
  | { type: 'EXPORT_TO_STUDIO'; studioType: StudioType; data: any }
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'SET_THEME'; theme: string }
  | { type: 'TOGGLE_BANNER_MANAGER' }
  | { type: 'SET_BANNER_MANAGER'; open: boolean }
  | { type: 'SET_OMNI_SEARCH'; open: boolean }
  | { type: 'SET_ERROR_DASHBOARD'; open: boolean }
  | { type: 'TOGGLE_ERROR_DASHBOARD' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; collapsed: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'UPDATE_SYSTEM_CONFIG'; payload: any }
  | { type: 'SET_CALENDAR_EVENTS'; events: CalendarEvent[] }
  | { type: 'ADD_CALENDAR_EVENT'; event: CalendarEvent }
  | { type: 'UPDATE_CALENDAR_EVENT'; id: string; updates: Partial<CalendarEvent> }
  | { type: 'DELETE_CALENDAR_EVENT'; id: string }
  | { type: 'INIT_PROJECTS'; factories: Record<StudioType, (count: number) => any> }
  | { type: 'ENGAGE_PROJECT'; studioType: StudioType; project: any };

function updateProjectInArray<T>(projects: T[], index: number, action: SetStateAction<T>): T[] {
  const next = [...projects];
  const current = next[index];
  next[index] = action instanceof Function ? action(current) : action;
  return next;
}

export function appReducer(state: AppState, action: StudioAction): AppState {
  switch (action.type) {
    case 'UPDATE_PROJECT': {
      const { studioType, payload } = action;
      const { projectKey, indexKey } = studioProjectKeys[studioType];
      const projects = state[projectKey] as any[];
      const idx = state[indexKey] as number;
      return { ...state, [projectKey]: updateProjectInArray(projects, idx, payload) };
    }
    case 'SET_ACTIVE_INDEX': {
      const { studioType, index } = action;
      return { ...state, [studioProjectKeys[studioType].indexKey]: index };
    }
    case 'ADD_PROJECT': {
      const { studioType, factory } = action;
      const { projectKey, indexKey } = studioProjectKeys[studioType];
      const projects = state[projectKey] as any[];
      const newProjects = [...projects, factory(projects.length)];
      return { ...state, [projectKey]: newProjects, [indexKey]: newProjects.length - 1 };
    }
    case 'REMOVE_PROJECT': {
      const { studioType, index, activeIndex, factory } = action;
      const { projectKey, indexKey } = studioProjectKeys[studioType];
      const projects = [...(state[projectKey] as any[])];
      projects.splice(index, 1);
      if (projects.length === 0) {
        return { ...state, [projectKey]: [factory(0)], [indexKey]: 0 };
      }
      let newActiveIndex = activeIndex;
      if (index === activeIndex) {
        newActiveIndex = Math.max(0, activeIndex - 1);
      } else if (index < activeIndex) {
        newActiveIndex = Math.max(0, activeIndex - 1);
      }
      return { ...state, [projectKey]: projects, [indexKey]: newActiveIndex };
    }
    case 'EXPORT_TO_STUDIO': {
      const { studioType, data } = action;
      const { projectKey, indexKey } = studioProjectKeys[studioType];
      const projects = state[projectKey] as any[];
      const idx = state[indexKey] as number;
      const next = [...projects];
      next[idx] = { ...next[idx], ...data };
      return { ...state, [projectKey]: next };
    }
    case 'SET_VIEW': return { ...state, view: action.view };
    case 'SET_THEME': return { ...state, theme: action.theme };
    case 'TOGGLE_BANNER_MANAGER': return { ...state, isBannerManagerOpen: !state.isBannerManagerOpen };
    case 'SET_BANNER_MANAGER': return { ...state, isBannerManagerOpen: action.open };
    case 'SET_OMNI_SEARCH': return { ...state, isOmniSearchOpen: action.open };
    case 'SET_ERROR_DASHBOARD': return { ...state, isErrorDashboardOpen: action.open };
    case 'TOGGLE_ERROR_DASHBOARD': return { ...state, isErrorDashboardOpen: !state.isErrorDashboardOpen };
    case 'SET_SIDEBAR_COLLAPSED': return { ...state, sidebarCollapsed: action.collapsed };
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'UPDATE_SYSTEM_CONFIG': return { ...state, systemConfig: { ...state.systemConfig, ...action.payload } };
    case 'SET_CALENDAR_EVENTS': return { ...state, calendarEvents: action.events };
    case 'ADD_CALENDAR_EVENT': return { ...state, calendarEvents: [...state.calendarEvents, action.event] };
    case 'UPDATE_CALENDAR_EVENT':
      return { ...state, calendarEvents: state.calendarEvents.map(e => e.id === action.id ? { ...e, ...action.updates } : e) };
    case 'DELETE_CALENDAR_EVENT':
      return { ...state, calendarEvents: state.calendarEvents.filter(e => e.id !== action.id) };
    case 'INIT_PROJECTS': {
      const { factories } = action;
      let s = { ...state };
      for (const [type, factory] of Object.entries(factories)) {
        const { projectKey } = studioProjectKeys[type as StudioType];
        const projects = s[projectKey] as any[];
        if (projects.length === 0) {
          s = { ...s, [projectKey]: [factory(0)] };
        }
      }
      return s;
    }
    case 'ENGAGE_PROJECT': {
      const { studioType, project } = action;
      const { projectKey, indexKey } = studioProjectKeys[studioType];
      const projects = state[projectKey] as any[];
      const existing = projects.findIndex(p => p.id === project.id);
      if (existing !== -1) {
        return { ...state, [indexKey]: existing };
      }
      return { ...state, [projectKey]: [...projects, project], [indexKey]: projects.length };
    }
    default: return state;
  }
}

export function createInitialState(): AppState {
  return {
    view: 'home',
    isBannerManagerOpen: false,
    isOmniSearchOpen: false,
    isErrorDashboardOpen: false,
    sidebarCollapsed: false,
    theme: 'dark',
    creatorProjects: [],
    activeCreatorIndex: 0,
    photoshootProjects: [],
    activePhotoshootIndex: 0,
    promptStudioProjects: [],
    activePromptStudioIndex: 0,
    voiceOverProjects: [],
    activeVoiceOverIndex: 0,
    brandingProjects: [],
    activeBrandingIndex: 0,
    campaignProjects: [],
    activeCampaignIndex: 0,
    planProjects: [],
    activePlanIndex: 0,
    storyboardProjects: [],
    activeStoryboardIndex: 0,
    marketingProjects: [],
    activeMarketingIndex: 0,
    editProjects: [],
    activeEditIndex: 0,
    controllerProjects: [],
    activeControllerIndex: 0,
    batchImageProjects: [],
    activeBatchImageIndex: 0,
    bgProjects: [],
    activeBGIndex: 0,
    prePilotProjects: [],
    activePrePilotIndex: 0,
    adminProjects: [],
    activeAdminIndex: 0,
    systemConfig: { activeStudios: [], maintenanceMode: false, allowNewRegistrations: true },
    branding: { logo: '/logo.png', tagline: 'Transform your imagination into the perfect design with the power of AI.' },
    calendarEvents: [],
  };
}
