
import React, { useCallback, useRef, useMemo, useReducer, useState, useEffect, Suspense, lazy } from 'react';
import {
  AppView, 
  CreatorStudioProject, 
  PhotoshootDirectorProject, 
  PromptStudioProject,
  VoiceOverStudioProject,
  BrandingStudioProject,
  CampaignStudioProject,
  PlanStudioProject,
  EditStudioProject,
  StoryboardStudioProject,
  MarketingStudioProject,
  ControllerStudioProject,
  AdminStudioProject,
  PrePilotAgencySuiteProject,
  BatchImageStudioProject,
  BGStudioProject
} from './types';

import NexusAssistant from './components/NexusAssistant';
import { AlertTriangle, Rocket, Briefcase, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CreatorStudio = lazy(() => import('./components/CreatorStudio'));
const PhotoshootDirector = lazy(() => import('./components/PhotoshootDirector'));
const PromptStudio = lazy(() => import('./components/PromptStudio'));
const VoiceOverStudio = lazy(() => import('./components/VoiceOverStudio'));
const BrandingStudio = lazy(() => import('./components/BrandingStudio'));
const CampaignStudio = lazy(() => import('./components/CampaignStudio'));
const VideoStudio = lazy(() => import('./components/VideoStudio'));
const PlanStudio = lazy(() => import('./components/PlanStudio'));
const EditStudio = lazy(() => import('./components/EditStudio'));
const StoryboardStudio = lazy(() => import('./components/StoryboardStudio'));
const MarketingStudio = lazy(() => import('./components/MarketingStudio'));
const ControllerStudio = lazy(() => import('./components/ControllerStudio'));
const PrePilotAgencySuite = lazy(() => import('./components/PrePilotAgencySuite'));
const BatchImageStudio = lazy(() => import('./components/BatchImageStudio'));
const BGStudio = lazy(() => import('./components/BGStudio'));
const AdminStudio = lazy(() => import('./components/AdminStudio'));
const GlobalHistoryPanel = lazy(() => import('./components/GlobalHistoryPanel'));
const NexusVault = lazy(() => import('./components/NexusVault'));
const NexusControlCenter = lazy(() => import('./components/NexusControlCenter'));
import { CalendarStudio, CalendarEvent } from './components/CalendarStudio';

import TabBar from './components/TabBar';
import { LIGHTING_STYLES, CAMERA_PERSPECTIVES, VOICES, LOGO_IMAGE_URL } from './constants';
import GlobalSettings from './components/GlobalSettings';
import OmniSearch from './components/OmniSearch';
import PresenceSystem from './components/PresenceSystem';
import { ErrorBoundary } from './lib/ErrorBoundary';
import { ErrorService } from './lib/errorService';
import ErrorDashboard from './components/ErrorDashboard';
import StudioGrid from './components/StudioGrid';
import { ToastProvider, useToast } from './lib/useToast';
import { cn } from './lib/utils';
import Sidebar from './components/Sidebar';

function ErrorGlobalListener() {
  const { toast } = useToast();
  useEffect(() => {
    const handler = (e: Event) => {
      const { message, severity, source } = (e as CustomEvent).detail;
      toast({
        type: severity === 'critical' ? 'error' : 'warning',
        title: `${severity.toUpperCase()}${source ? ` [${source}]` : ''}`,
        message: message?.substring(0, 120),
        action: { label: 'View', onClick: () => window.dispatchEvent(new CustomEvent('studio-open-errors')) },
      });
    };
    window.addEventListener('error-global', handler);
    return () => window.removeEventListener('error-global', handler);
  }, [toast]);
  return null;
}
import { appReducer, createInitialState, StudioType, studioProjectKeys } from './lib/studioReducer';

const STUDIO_METADATA: Record<string, { label: string; icon: any }> = {
  creator_studio: { label: 'Creative', icon: null },
  photoshoot_director: { label: 'Photo', icon: null },
  prompt_studio: { label: 'Prompt', icon: null },
  voice_over_studio: { label: 'Voice', icon: null },
  campaign_studio: { label: 'Campaign', icon: null },
  video_studio: { label: 'Video', icon: null },
  plan_studio: { label: 'Plan', icon: null },
  edit_studio: { label: 'Edit', icon: null },
  storyboard_studio: { label: 'Storyboard', icon: null },
  marketing_studio: { label: 'Marketing', icon: null },
  controller_studio: { label: 'Controller', icon: null },
  branding_studio: { label: 'Brand', icon: null },
  prepilot_agency_suite: { label: 'PrePilot', icon: Rocket },
  admin_studio: { label: 'Admin', icon: null },
  archives: { label: 'Archives', icon: null },
  asset_library: { label: 'Vault', icon: null },
  command_center: { label: 'Command', icon: null },
  batch_image_studio: { label: 'Batch Images', icon: null },
  bg_remover_studio: { label: 'BG Remover', icon: null },
};

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const createNewCreatorProject = (projectCount: number, ownerId: string): CreatorStudioProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `Project ${projectCount + 1}`,
  ownerId,
  studioType: 'creator_studio',
  status: 'active',
  progress: 0,
  priority: 'medium',
  productImages: [],
  styleImages: [], 
  generatedImage: null,
  history: [],
  options: {
    lightingStyle: LIGHTING_STYLES[0].value,
    cameraPerspective: CAMERA_PERSPECTIVES[0].value,
  },
  prompt: '',
  isPromptAutoGenerated: false,
  styleDescription: null,
  isAnalyzingStyle: false,
  isLoading: false,
  isExpanding: false,
  error: null,
  uploadingTarget: null,
  translatedPrompt: null,
  isTranslating: false,
  editPrompt: '',
  isEditing: false,
  creativeMode: 'classic',
  aspectRatio: '1:1',
  batchCount: 1,
  negativePrompt: '',
  savedPrompts: [],
  styleStrength: 50,
  lastGenerationTime: null,
  showComparison: false,
  aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash-image' },
});

const createNewPhotoshootProject = (projectCount: number, ownerId: string): PhotoshootDirectorProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `Project ${projectCount + 1}`,
  ownerId,
  studioType: 'photoshoot_director',
  status: 'active',
  progress: 0,
  priority: 'medium',
  productImages: [],
  selectedShotTypes: [],
  results: [],
  isGenerating: false,
  error: null,
  isUploading: false,
  customStylePrompt: '',
  aspectRatio: '1:1',
  bgColor: '#ffffff',
  outputQuality: 'standard',
  autoEnhance: false,
  shotNotes: '',
  showContactSheet: false,
  showCompare: false,
  quickPreset: '',
  generationTimestamps: [],
  aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash-image' },
});

const createNewPromptStudioProject = (projectCount: number, ownerId: string): PromptStudioProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `Project ${projectCount + 1}`,
  ownerId,
  studioType: 'prompt_studio',
  status: 'active',
  progress: 0,
  priority: 'medium',
  images: [],
  instructions: '',
  generatedPrompt: null,
  history: [],
  isLoading: false,
  isUploading: false,
  error: null,
  aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash' },
  deconstruction: null,
  selectedParameters: {},
  selectedTone: 'descriptive',
  favoritePrompts: [],
  promptTemplate: '',
  historySearch: '',
});

const createNewVoiceOverStudioProject = (projectCount: number, ownerId: string): VoiceOverStudioProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `Project ${projectCount + 1}`,
  ownerId,
  studioType: 'voice_over_studio',
  status: 'active',
  progress: 0,
  priority: 'medium',
  text: '',
  styleInstructions: '',
  selectedVoice: VOICES[0].value,
  generatedAudio: null,
  isLoading: false,
  error: null,
  history: [],
  isPlaying: false,
  voiceGenderFilter: 'All',
  previewLoadingVoice: null,
  previewPlayingVoice: null,
  speechSpeed: 50,
  speechPitch: 50,
  historySearch: '',
  aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash' },
});

const createNewBrandingStudioProject = (projectCount: number, ownerId: string): BrandingStudioProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `Project ${projectCount + 1}`,
  ownerId,
  studioType: 'branding_studio',
  status: 'active',
  progress: 0,
  priority: 'medium',
  logos: [], 
  isUploading: false,
  error: null,
  results: [],
  colors: [],
  secondaryColors: [],
  brandVoice: '',
  brandPersonality: [],
  targetAudience: '',
  fontPreferences: '',
  missionStatement: null,
  visionStatement: null,
  coreValues: [],
  brandArchetype: null,
  brandNaming: null,
  brandPersona: null,
  brandStory: null,
  competitorAnalysis: null,
  brandManual: null,
  typography: null,
  isAnalyzing: false,
  isGenerating: false,
  isGeneratingNaming: false,
  aspectRatio: '1:1',
  activeTab: 'strategy',
  aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash-image' },
  brandToolsSection: 'strategy',
  brandToolsSubTab: 'overview',
  brandToolsResults: {},
  brandToolsIsGenerating: false,
  brandToolsError: null,
  toneFormal: 60,
  tonePlayful: 40,
  toneWarm: 50,
  toneSimple: 50,
  brandSnapshots: [],
});

const createNewCampaignProject = (projectCount: number, ownerId: string): CampaignStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `Project ${projectCount + 1}`,
    ownerId,
    studioType: 'campaign_studio',
    status: 'active',
    progress: 0,
    priority: 'medium',
    productImages: [],
    isUploading: false,
    isAnalyzing: false,
    isGenerating: false,
    error: null,
    results: [],
    productAnalysis: null,
    selectedMood: 'Original',
    customPrompt: '',
    mode: 'auto',
    // Updated to initialize 6 custom ideas
    customIdeas: ['', '', '', '', '', ''],
    isRefining: false,
    aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash-image' },
    customMoodColor: '#ff6b6b',
    variantSourceIndex: 0,
    variantCount: 4,
    variantResults: [],
    selectedResultIndices: [],
    colorPalettes: {},
    abSets: [],
    timelineEntries: [],
});

const createNewPlanProject = (projectCount: number, ownerId: string): PlanStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `Plan ${projectCount + 1}`,
    ownerId,
    studioType: 'plan_studio',
    status: 'active',
    progress: 0,
    priority: 'medium',
    productImages: [],
    logos: [],
    prompt: '',
    targetMarket: 'Egypt',
    dialect: 'Egyptian Arabic',
    categoryAnalysis: null,
    isAnalyzingCategory: false,
    pillars: [],
    personas: [],
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    positioning: { valueProp: '', competitorGaps: [], targetPricing: '' },
    roadmap: [],
    canvas: {
        keyPartners: [],
        keyActivities: [],
        valueProps: [],
        customerRelations: [],
        segments: [],
        channels: [],
        costStructure: [],
        revenueStreams: [],
    },
    battleCards: [],
    pitchDeck: [],
    ideas: [],
    isGeneratingPlan: false,
    isUploading: false,
    error: null,
    activeTab: 'brief',
    aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash' },
    comparisonPlanIds: [],
    comparisonData: {},
    wizardStep: 1,
});

const createNewStoryboardProject = (projectCount: number, ownerId: string): StoryboardStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `Board ${projectCount + 1}`,
    ownerId,
    studioType: 'storyboard_studio',
    status: 'active',
    progress: 0,
    priority: 'medium',
    projectTitle: '',
    script: '',
    visualStyle: 'Cinematic',
    aspectRatio: '16:9',
    scenes: [],
    characterProfiles: null,
    locationGuide: null,
    moodboardImages: [],
    moodboardConcepts: [],
    isGeneratingPlan: false,
    isGeneratingScenes: false,
    isUploading: false,
    isPlaying: false,
    currentPlayIndex: 0,
    error: null,
    activeTab: 'script',
    aiConfig: { provider: 'google', modelId: 'gemini-3-flash-preview' },
});

const createNewMarketingProject = (projectCount: number, ownerId: string): MarketingStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `Strategy ${projectCount + 1}`,
    ownerId,
    studioType: 'marketing_studio',
    status: 'active',
    progress: 0,
    priority: 'medium',
    brandType: 'new',
    brandName: '',
    specialty: '',
    brief: '',
    websiteLink: '',
    language: 'ar',
    platforms: ['Instagram', 'Facebook'],
    campaignTone: 'Professional',
    campaignGoal: 'Awareness',
    competitors: '',
    result: null,
    adCopies: null,
    emailSequence: null,
    influencerStrategy: null,
    contentCalendar: null,
    socialBios: null,
    hashtags: null,
    customerJourney: null,
    marketResearch: null,
    competitiveStudy: null,
    marketingPlan: null,
    swotAnalysis: null,
    digitalStrategy: null,
    traditionalStrategy: null,
    isGenerating: false,
    aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash' },
    error: null,
    customerPainPoints: '',
    economicImpact: '',
    contentSection: 'content',
    contentSubTab: 'overview',
    contentResults: {},
    contentIsGenerating: false,
    contentError: null,
    roiBudget: 50000,
    roiReach: 500000,
    roiConversionRate: 2.5,
    roiAov: 75,
    kanbanItems: [],
    abTestVariantA: '',
    abTestVariantB: '',
    abTestResult: null,
    heatMapCompetitors: [],
    heatMapScores: {},
    personas: [],
    funnelStages: [
        { name: 'Awareness', pct: 100, color: '#3b82f6' },
        { name: 'Interest', pct: 45, color: '#10b981' },
        { name: 'Consideration', pct: 25, color: '#f59e0b' },
        { name: 'Intent', pct: 15, color: '#f97316' },
        { name: 'Purchase', pct: 8, color: '#ef4444' },
        { name: 'Loyalty', pct: 5, color: '#8b5cf6' },
    ],
    scheduledPosts: [],
    dashboardMetrics: [
        { label: 'Impressions', value: '0', change: '0%', trend: 'flat' },
        { label: 'CTR', value: '0%', change: '0%', trend: 'flat' },
        { label: 'CPC', value: '$0.00', change: '0%', trend: 'flat' },
        { label: 'Conversion Rate', value: '0%', change: '0%', trend: 'flat' },
        { label: 'ROAS', value: '0x', change: '0%', trend: 'flat' },
    ],
    budgetAllocations: { Social: 40, Search: 20, Display: 10, Print: 10, Events: 10, Influencer: 10 },
    workflowNodes: [],
    workflowEdges: [],
});

const createNewPrePilotProject = (projectCount: number, ownerId: string): PrePilotAgencySuiteProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `Agency Suite ${projectCount + 1}`,
    ownerId,
    studioType: 'prepilot_agency_suite',
    status: 'active',
    progress: 0,
    priority: 'medium',
    clients: [],
    campaigns: [],
    agents: [
        { 
            id: 'master-agent', 
            name: 'Strategic Orchestrator', 
            role: 'Main Controller', 
            type: 'engine', 
            capabilities: ['orchestration', 'python', 'code_interpreter'], 
            status: 'active',
            metrics: { tasksCompleted: 1240, latency: '240ms', uptime: 99.9 }
        },
        { 
            id: 'data-agent', 
            name: 'Knowledge Miner', 
            role: 'Grounding Expert', 
            type: 'declarative', 
            capabilities: ['rest_api', 'vision'], 
            status: 'standby',
            metrics: { tasksCompleted: 450, latency: '400ms', uptime: 98.5 }
        }
    ],
    workflows: [
        {
            id: 'wf1',
            name: 'Enterprise Sync',
            description: 'Synchronizes agency leads with Salesforce and SAP',
            trigger: 'manual',
            status: 'active',
            steps: [
                { action: 'Fetch Salesforce Leads', status: 'done', connector: 'Salesforce' },
                { action: 'Process with AI Orchestrator', agentId: 'master-agent', status: 'active' },
                { action: 'Update Internal Ledger', status: 'pending', connector: 'SAP' }
            ],
            connectors: ['Salesforce', 'SAP']
        }
    ],
    leads: [
        { id: 'l1', company: 'TechNova', contactName: 'Sarah J.', value: '$45k', stage: 'qualified', lastContact: '2h ago', probability: 80 }
    ],
    team: [
        { id: 't1', name: 'User Admin', role: 'Agency Director', department: 'management', availability: 100 }
    ],
    knowledgeBases: [
        { id: 'kb1', name: 'Corporate SharePoint', type: 'sharepoint', status: 'ready', documentCount: 1420, lastSynced: '2024-05-18' }
    ],
    securityPolicies: [
        { id: 'sec1', name: 'IAM Microsoft Entra', category: 'iam', severity: 'high', status: 'enforced' }
    ],
    billingData: [
        { date: 'May 01', cost: 120 },
        { date: 'May 05', cost: 150 },
        { date: 'May 10', cost: 300 },
        { date: 'May 15', cost: 450 }
    ],
    systemLogs: [
        { timestamp: '2024-05-18 06:50', level: 'info', message: 'Master Orchestrator initiated successfully.' },
        { timestamp: '2024-05-18 06:55', level: 'info', message: 'System scan complete: 0 vulnerabilities found.' }
    ],
    activeTab: 'overview',
    isGenerating: false,
    error: null,
    strategicGoal: '',
    marketAnalysis: null,
    pilotResults: [],
    aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash' },
});

const createNewAdminProject = (ownerId: string): AdminStudioProject => ({
    id: 'admin-dashboard',
    name: 'Admin Panel',
    ownerId,
    studioType: 'admin_studio',
    status: 'active',
    progress: 100,
    priority: 'high',
    integrations: [],
    apiLogs: [],
    history: []
});

const createNewEditProject = (projectCount: number, ownerId: string): EditStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `Studio ${projectCount + 1}`,
    ownerId,
    studioType: 'edit_studio',
    status: 'active',
    progress: 0,
    priority: 'medium',
    baseImages: [], 
    localTexts: {},
    committedTexts: {},
    globalLayers: [],
    drawings: {},
    slices: {},
    paths: {},
    adjustments: {
        sharpness: 100,
        lut: 'Original',
        grain: 0,
        vignette: 0,
        blur: 0,
        contrast: 100,
        saturation: 100
    },
    isUploading: false,
    error: null,
    activeCanvasSize: 'original',
    undoStack: [],
    redoStack: [],
    isProcessingAI: false,
    aiConfig: { provider: 'google', modelId: 'gemini-2.0-flash-exp' },
});

const createNewControllerProject = (projectCount: number, ownerId: string): ControllerStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `Face Control ${projectCount + 1}`,
    ownerId,
    studioType: 'controller_studio',
    status: 'active',
    progress: 0,
    priority: 'medium',
    sourceImages: [],
    generatedImage: null,
    sliders: [
        // Face
        { id: 'smile', label: 'Smile', value: 0, min: -1, max: 1, step: 0.1, category: 'Face' },
        { id: 'frown', label: 'Frown', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
        { id: 'surprised', label: 'Surprised', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
        { id: 'angry', label: 'Angry', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
        { id: 'eyebrow_raise', label: 'Eyebrow Raise', value: 0, min: -1, max: 1, step: 0.1, category: 'Face' },
        { id: 'eye_direction', label: 'Eye Direction', value: 0, min: -1, max: 1, step: 0.1, category: 'Face' },
        { id: 'mouth_open', label: 'Mouth Open', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
        { id: 'squint', label: 'Squint', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
        { id: 'age', label: 'Adjust Age', value: 0, min: -1, max: 1, step: 0.1, category: 'Face' },
        // Head
        { id: 'head_yaw', label: 'Look Side-to-Side', value: 0, min: -1, max: 1, step: 0.1, category: 'Head' },
        { id: 'head_pitch', label: 'Look Up/Down', value: 0, min: -1, max: 1, step: 0.1, category: 'Head' },
        // Body
        { id: 'shoulder_width', label: 'Shoulder Width', value: 0, min: -0.5, max: 0.5, step: 0.1, category: 'Body' },
        { id: 'posture', label: 'Posture', value: 0, min: -0.5, max: 0.5, step: 0.1, category: 'Body' },
        // Retouch
        { id: 'smooth_skin', label: 'Smooth Skin', value: 0, min: 0, max: 1, step: 0.1, category: 'Retouch' },
        { id: 'brightness', label: 'Brightness', value: 0, min: -0.5, max: 0.5, step: 0.1, category: 'Retouch' },
        { id: 'contrast', label: 'Contrast', value: 0, min: -0.5, max: 0.5, step: 0.1, category: 'Retouch' },
    ],
    activeCategory: 'Face',
    isGenerating: false,
    isUploading: false,
    error: null,
    history: [],
    aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash-image' },
});

const createNewBatchImageProject = (projectCount: number, ownerId: string): BatchImageStudioProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `Batch ${projectCount + 1}`,
  ownerId,
  studioType: 'batch_image_studio',
  status: 'active',
  progress: 0,
  priority: 'medium',
  productImages: [],
  productName: '',
  productDescription: '',
  batchConfig: {
    backgrounds: [{ type: 'none', value: '' }],
    cameraAngles: ['front'],
    lightingPresets: ['studio'],
    perspectives: ['eye_level'],
    aspectRatio: '1:1',
    backgroundRemoval: false,
    count: 4,
  },
  results: [],
  isGenerating: false,
  selectedResultIds: [],
  error: null,
  activeTab: 'config',
  aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash-image' },
});

const createNewBGProject = (projectCount: number, ownerId: string): BGStudioProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `BG Remover ${projectCount + 1}`,
  ownerId,
  studioType: 'bg_remover_studio',
  status: 'active',
  progress: 0,
  priority: 'medium',
  sourceImages: [],
  results: [],
  replacementType: 'transparent',
  replacementColor: '#ffffff',
  gradientStart: '#ff6b6b',
  gradientEnd: '#6b6bff',
  gradientAngle: 45,
  replacementImage: null,
  featherRadius: 0,
  edgeThreshold: 50,
  maskMode: 'subject',
  isProcessing: false,
  selectedResultIds: [],
  error: null,
  activeTab: 'upload',
  zoomLevel: 100,
  showOriginal: false,
  aiConfig: { provider: 'google', modelId: 'gemini-2.1-flash-image' },
  aiBackgroundPrompt: '',
  brushStrokes: [],
  isBrushMode: false,
  brushRadius: 10,
  comparePosition: 50,
  upscaleEnabled: false,
  upscaleFactor: 2,
  shadowSettings: { type: 'none', blur: 10, offsetX: 5, offsetY: 5, opacity: 0.4, color: '#000000' },
  edgeGlow: { enabled: false, width: 2, color: '#ffffff', opacity: 0.5 },
  smartCrop: { enabled: false, padding: 10, maintainAspectRatio: true },
  backgroundBlur: 0,
  bokehShape: 'circle',
  colorMatchBg: false,
  undoStack: [],
  redoStack: [],
  editHistory: [],
  compositeLayers: [],
  selectedPresetId: null,
  viewMode: 'grid',
  galleryIndex: 0,
  colorHistory: [],
  queueItems: [],
  renamePattern: '',
  exportFormat: 'png',
  exportQuality: 90,
  imageGroupName: '',
  autoTagging: false,
  showMask: false,
});

function App() {
  const [state, dispatch] = useReducer(appReducer, null, createInitialState);
  const {
    view, isBannerManagerOpen, isOmniSearchOpen, isErrorDashboardOpen, sidebarCollapsed, theme,
    creatorProjects, activeCreatorIndex,
    photoshootProjects, activePhotoshootIndex,
    promptStudioProjects, activePromptStudioIndex,
    voiceOverProjects, activeVoiceOverIndex,
    brandingProjects, activeBrandingIndex,
    campaignProjects, activeCampaignIndex,
    planProjects, activePlanIndex,
    storyboardProjects, activeStoryboardIndex,
    marketingProjects, activeMarketingIndex,
    editProjects, activeEditIndex,
    controllerProjects, activeControllerIndex,
    batchImageProjects, activeBatchImageIndex,
    bgProjects, activeBGIndex,
    prePilotProjects, activePrePilotIndex,
    systemConfig, branding, calendarEvents,
  } = state;

  const contentRef = useRef<HTMLDivElement>(null);
  const isAdminUser = true;

  useEffect(() => {
    localStorage.setItem('mada_calendar_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    const handleRemoteNav = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        const studioId = e.detail as AppView;
        if (STUDIO_METADATA[studioId]) {
          dispatch({ type: 'SET_VIEW', view: studioId });
          contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('nav-studio', handleRemoteNav);
    return () => window.removeEventListener('nav-studio', handleRemoteNav);
  }, []);

  useEffect(() => {
    dispatch({ type: 'INIT_PROJECTS', factories: {
      creator_studio: (count) => createNewCreatorProject(count, 'local'),
      photoshoot_director: (count) => createNewPhotoshootProject(count, 'local'),
      prompt_studio: (count) => createNewPromptStudioProject(count, 'local'),
      voice_over_studio: (count) => createNewVoiceOverStudioProject(count, 'local'),
      branding_studio: (count) => createNewBrandingStudioProject(count, 'local'),
      campaign_studio: (count) => createNewCampaignProject(count, 'local'),
      plan_studio: (count) => createNewPlanProject(count, 'local'),
      storyboard_studio: (count) => createNewStoryboardProject(count, 'local'),
      marketing_studio: (count) => createNewMarketingProject(count, 'local'),
      controller_studio: (count) => createNewControllerProject(count, 'local'),
      batch_image_studio: (count) => createNewBatchImageProject(count, 'local'),
      bg_remover_studio: (count) => createNewBGProject(count, 'local'),
      edit_studio: (count) => createNewEditProject(count, 'local'),
      prepilot_agency_suite: (count) => createNewPrePilotProject(count, 'local'),
      admin_studio: () => createNewAdminProject('local'),
    } });
  }, []);

  const scrollToContent = useCallback(() => {
    if (contentRef.current) {
      const y = contentRef.current.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  const handleEngageProject = useCallback((project: any) => {
      dispatch({ type: 'SET_VIEW', view: project.studioType });
      if (project.studioType === 'calendar') return;
      const pType = project.studioType as StudioType;
      dispatch({ type: 'ENGAGE_PROJECT', studioType: pType, project });
      scrollToContent();
  }, [scrollToContent]);

  const updateSystemConfig = async (updates: any): Promise<void> => {
    dispatch({ type: 'UPDATE_SYSTEM_CONFIG', payload: updates });
  };

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);
  
  const updateCreatorProject = useCallback((action: React.SetStateAction<CreatorStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'creator_studio', payload: action as any });
  }, []);

  const updatePhotoshootProject = useCallback((action: React.SetStateAction<PhotoshootDirectorProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'photoshoot_director', payload: action as any });
  }, []);

  const updatePromptStudioProject = useCallback((action: React.SetStateAction<PromptStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'prompt_studio', payload: action as any });
  }, []);

  const updateVoiceOverProject = useCallback((action: React.SetStateAction<VoiceOverStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'voice_over_studio', payload: action as any });
  }, []);

  const updateBrandingProject = useCallback((action: React.SetStateAction<BrandingStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'branding_studio', payload: action as any });
  }, []);

  const updateCampaignProject = useCallback((action: React.SetStateAction<CampaignStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'campaign_studio', payload: action as any });
  }, []);

  const updatePlanProject = useCallback((action: React.SetStateAction<PlanStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'plan_studio', payload: action as any });
  }, []);

  const updateStoryboardProject = useCallback((action: React.SetStateAction<StoryboardStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'storyboard_studio', payload: action as any });
  }, []);

  const updateMarketingProject = useCallback((action: React.SetStateAction<MarketingStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'marketing_studio', payload: action as any });
  }, []);

  const updateEditProject = useCallback((action: React.SetStateAction<EditStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'edit_studio', payload: action as any });
  }, []);

  const updateControllerProject = useCallback((action: React.SetStateAction<ControllerStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'controller_studio', payload: action as any });
  }, []);

  const updateBatchImageProject = useCallback((action: React.SetStateAction<BatchImageStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'batch_image_studio', payload: action as any });
  }, []);

  const updateBGProject = useCallback((action: React.SetStateAction<BGStudioProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'bg_remover_studio', payload: action as any });
  }, []);

  const updatePrePilotProject = useCallback((action: React.SetStateAction<PrePilotAgencySuiteProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', studioType: 'prepilot_agency_suite', payload: action as any });
  }, []);

  const viewToStudioType: Record<string, StudioType | undefined> = {
    creator_studio: 'creator_studio',
    photoshoot_director: 'photoshoot_director',
    prompt_studio: 'prompt_studio',
    voice_over_studio: 'voice_over_studio',
    branding_studio: 'branding_studio',
    campaign_studio: 'campaign_studio',
    plan_studio: 'plan_studio',
    storyboard_studio: 'storyboard_studio',
    marketing_studio: 'marketing_studio',
    edit_studio: 'edit_studio',
    controller_studio: 'controller_studio',
    batch_image_studio: 'batch_image_studio',
    bg_remover_studio: 'bg_remover_studio',
    pre_pilot_studio: 'prepilot_agency_suite',
    prepilot_agency_suite: 'prepilot_agency_suite',
  };

  const handleExportToStudio = useCallback((targetView: AppView, data: any) => {
    dispatch({ type: 'SET_VIEW', view: targetView });
    const pType = viewToStudioType[targetView];
    if (pType) {
      dispatch({ type: 'EXPORT_TO_STUDIO', studioType: pType, data });
    }
    scrollToContent();
  }, [scrollToContent]);

  const setActiveCreatorIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'creator_studio', index: i }), []);
  const setActivePhotoshootIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'photoshoot_director', index: i }), []);
  const setActivePromptStudioIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'prompt_studio', index: i }), []);
  const setActiveVoiceOverIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'voice_over_studio', index: i }), []);
  const setActiveBrandingIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'branding_studio', index: i }), []);
  const setActiveCampaignIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'campaign_studio', index: i }), []);
  const setActivePlanIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'plan_studio', index: i }), []);
  const setActiveStoryboardIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'storyboard_studio', index: i }), []);
  const setActiveMarketingIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'marketing_studio', index: i }), []);
  const setActiveEditIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'edit_studio', index: i }), []);
  const setActiveControllerIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'controller_studio', index: i }), []);
  const setActiveBatchImageIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'batch_image_studio', index: i }), []);
  const setActiveBGIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'bg_remover_studio', index: i }), []);
  const setActivePrePilotIndex = useCallback((i: number) => dispatch({ type: 'SET_ACTIVE_INDEX', studioType: 'prepilot_agency_suite', index: i }), []);

  const setView = (v: AppView) => dispatch({ type: 'SET_VIEW', view: v });
  const setTheme = (t: string) => dispatch({ type: 'SET_THEME', theme: t });
  const setIsOmniSearchOpen = (open: boolean) => dispatch({ type: 'SET_OMNI_SEARCH', open });
  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' });
  const closeSettings = useCallback(() => dispatch({ type: 'SET_BANNER_MANAGER', open: false }), []);
  const navigateToView = useCallback((v: AppView) => { setView(v); scrollToContent(); }, [scrollToContent]);
  const openSearch = useCallback(() => setIsOmniSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsOmniSearchOpen(false), []);
  const changeTheme = useCallback((t: string) => setTheme(t), []);
  const handleNavigate = useCallback((v: AppView) => { setView(v); scrollToContent(); }, [scrollToContent]);
  const handleAddCalendarEvent = (event: CalendarEvent) => dispatch({ type: 'ADD_CALENDAR_EVENT', event });
  const handleUpdateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => dispatch({ type: 'UPDATE_CALENDAR_EVENT', id, updates });
  const handleDeleteCalendarEvent = (id: string) => dispatch({ type: 'DELETE_CALENDAR_EVENT', id });

  const renderContent = () => {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                <div className="relative mb-6">
                    <Loader2 className="w-10 h-10 text-[var(--color-accent)] animate-spin" />
                    <div className="absolute inset-0 bg-[var(--color-accent)] blur-2xl opacity-20 animate-pulse" />
                </div>
                <div className="flex flex-col items-center gap-3">
                    <div className="h-3 w-48 bg-white/5 rounded-full animate-pulse" />
                    <div className="h-2 w-32 bg-white/[0.02] rounded-full animate-pulse" />
                </div>
                <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md">
                    <div className="h-24 bg-white/5 rounded-2xl animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="h-24 bg-white/5 rounded-2xl animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="h-24 bg-white/5 rounded-2xl animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>
        }>
            <ErrorBoundary>
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="w-full"
                >
                    {(() => {
                        switch (view) {
                            case 'creator_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={creatorProjects}
                                            activeProjectIndex={activeCreatorIndex}
                                            onSelectTab={setActiveCreatorIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'creator_studio', factory: (count: number) => createNewCreatorProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'creator_studio', index: idx, activeIndex: activeCreatorIndex, factory: (count: number) => createNewCreatorProject(count, 'local') })}
                                        />
                                        <CreatorStudio 
                                            project={creatorProjects[activeCreatorIndex]}
                                            setProject={updateCreatorProject}
                                        />
                                    </div>
                                );
                            case 'photoshoot_director':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={photoshootProjects}
                                            activeProjectIndex={activePhotoshootIndex}
                                            onSelectTab={setActivePhotoshootIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'photoshoot_director', factory: (count: number) => createNewPhotoshootProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'photoshoot_director', index: idx, activeIndex: activePhotoshootIndex, factory: (count: number) => createNewPhotoshootProject(count, 'local') })}
                                        />
                                        <PhotoshootDirector 
                                            project={photoshootProjects[activePhotoshootIndex]}
                                            setProject={updatePhotoshootProject}
                                        />
                                    </div>
                                );
                            case 'prompt_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={promptStudioProjects}
                                            activeProjectIndex={activePromptStudioIndex}
                                            onSelectTab={setActivePromptStudioIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'prompt_studio', factory: (count: number) => createNewPromptStudioProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'prompt_studio', index: idx, activeIndex: activePromptStudioIndex, factory: (count: number) => createNewPromptStudioProject(count, 'local') })}
                                        />
                                        <PromptStudio
                                            project={promptStudioProjects[activePromptStudioIndex]}
                                            setProject={updatePromptStudioProject}
                                            onExport={handleExportToStudio}
                                        />
                                    </div>
                                );
                            case 'voice_over_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={voiceOverProjects}
                                            activeProjectIndex={activeVoiceOverIndex}
                                            onSelectTab={setActiveVoiceOverIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'voice_over_studio', factory: (count: number) => createNewVoiceOverStudioProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'voice_over_studio', index: idx, activeIndex: activeVoiceOverIndex, factory: (count: number) => createNewVoiceOverStudioProject(count, 'local') })}
                                        />
                                        <VoiceOverStudio
                                            project={voiceOverProjects[activeVoiceOverIndex]}
                                            setProject={updateVoiceOverProject}
                                        />
                                    </div>
                                );
                            case 'campaign_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={campaignProjects}
                                            activeProjectIndex={activeCampaignIndex}
                                            onSelectTab={setActiveCampaignIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'campaign_studio', factory: (count: number) => createNewCampaignProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'campaign_studio', index: idx, activeIndex: activeCampaignIndex, factory: (count: number) => createNewCampaignProject(count, 'local') })}
                                        />
                                        <CampaignStudio
                                            project={campaignProjects[activeCampaignIndex]}
                                            setProject={updateCampaignProject}
                                        />
                                    </div>
                                );
                            case 'plan_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={planProjects}
                                            activeProjectIndex={activePlanIndex}
                                            onSelectTab={setActivePlanIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'plan_studio', factory: (count: number) => createNewPlanProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'plan_studio', index: idx, activeIndex: activePlanIndex, factory: (count: number) => createNewPlanProject(count, 'local') })}
                                        />
                                        <PlanStudio
                                            project={planProjects[activePlanIndex]}
                                            setProject={updatePlanProject}
                                            allProjects={planProjects}
                                            onSelectProject={setActivePlanIndex}
                                        />
                                    </div>
                                );
                            case 'storyboard_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={storyboardProjects}
                                            activeProjectIndex={activeStoryboardIndex}
                                            onSelectTab={setActiveStoryboardIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'storyboard_studio', factory: (count: number) => createNewStoryboardProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'storyboard_studio', index: idx, activeIndex: activeStoryboardIndex, factory: (count: number) => createNewStoryboardProject(count, 'local') })}
                                        />
                                        <StoryboardStudio
                                            project={storyboardProjects[activeStoryboardIndex]}
                                            setProject={updateStoryboardProject}
                                        />
                                    </div>
                                );
                            case 'marketing_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={marketingProjects}
                                            activeProjectIndex={activeMarketingIndex}
                                            onSelectTab={setActiveMarketingIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'marketing_studio', factory: (count: number) => createNewMarketingProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'marketing_studio', index: idx, activeIndex: activeMarketingIndex, factory: (count: number) => createNewMarketingProject(count, 'local') })}
                                        />
                                        <MarketingStudio
                                            project={marketingProjects[activeMarketingIndex]}
                                            setProject={updateMarketingProject}
                                        />
                                    </div>
                                );
                            case 'branding_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={brandingProjects}
                                            activeProjectIndex={activeBrandingIndex}
                                            onSelectTab={setActiveBrandingIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'branding_studio', factory: (count: number) => createNewBrandingStudioProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'branding_studio', index: idx, activeIndex: activeBrandingIndex, factory: (count: number) => createNewBrandingStudioProject(count, 'local') })}
                                        />
                                        <BrandingStudio
                                            project={brandingProjects[activeBrandingIndex]}
                                            setProject={updateBrandingProject}
                                            onExport={handleExportToStudio}
                                            allProjects={brandingProjects}
                                            onSelectProject={setActiveBrandingIndex}
                                        />
                                    </div>
                                );
                            case 'controller_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={controllerProjects}
                                            activeProjectIndex={activeControllerIndex}
                                            onSelectTab={setActiveControllerIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'controller_studio', factory: (count: number) => createNewControllerProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'controller_studio', index: idx, activeIndex: activeControllerIndex, factory: (count: number) => createNewControllerProject(count, 'local') })}
                                        />
                                        <ControllerStudio
                                            project={controllerProjects[activeControllerIndex]}
                                            setProject={updateControllerProject}
                                        />
                                    </div>
                                );
                            case 'batch_image_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={batchImageProjects}
                                            activeProjectIndex={activeBatchImageIndex}
                                            onSelectTab={setActiveBatchImageIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'batch_image_studio', factory: (count: number) => createNewBatchImageProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'batch_image_studio', index: idx, activeIndex: activeBatchImageIndex, factory: (count: number) => createNewBatchImageProject(count, 'local') })}
                                        />
                                        <BatchImageStudio
                                            project={batchImageProjects[activeBatchImageIndex]}
                                            setProject={updateBatchImageProject}
                                        />
                                    </div>
                                );
                            case 'bg_remover_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={bgProjects}
                                            activeProjectIndex={activeBGIndex}
                                            onSelectTab={setActiveBGIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'bg_remover_studio', factory: (count: number) => createNewBGProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'bg_remover_studio', index: idx, activeIndex: activeBGIndex, factory: (count: number) => createNewBGProject(count, 'local') })}
                                        />
                                        <BGStudio
                                            project={bgProjects[activeBGIndex]}
                                            setProject={updateBGProject}
                                        />
                                    </div>
                                );
                            case 'edit_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={editProjects}
                                            activeProjectIndex={activeEditIndex}
                                            onSelectTab={setActiveEditIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'edit_studio', factory: (count: number) => createNewEditProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'edit_studio', index: idx, activeIndex: activeEditIndex, factory: (count: number) => createNewEditProject(count, 'local') })}
                                        />
                                        <EditStudio
                                            project={editProjects[activeEditIndex]}
                                            setProject={updateEditProject}
                                        />
                                    </div>
                                );
                            case 'video_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <VideoStudio />
                                    </div>
                                );
                            case 'prepilot_agency_suite':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={prePilotProjects}
                                            activeProjectIndex={activePrePilotIndex}
                                            onSelectTab={setActivePrePilotIndex}
                                            onAddTab={() => dispatch({ type: 'ADD_PROJECT', studioType: 'prepilot_agency_suite', factory: (count: number) => createNewPrePilotProject(count, 'local') })}
                                            onCloseTab={(idx: number) => dispatch({ type: 'REMOVE_PROJECT', studioType: 'prepilot_agency_suite', index: idx, activeIndex: activePrePilotIndex, factory: (count: number) => createNewPrePilotProject(count, 'local') })}
                                        />
                                        <PrePilotAgencySuite 
                                            project={prePilotProjects[activePrePilotIndex]}
                                            setProject={updatePrePilotProject}
                                        />
                                    </div>
                                );
                            case 'admin_studio':
                                return (
                                    <div className="flex flex-col w-full gap-4 min-h-[600px]">
                                        <AdminStudio onEngageProject={handleEngageProject} />
                                    </div>
                                );
                            case 'archives':
                                return <GlobalHistoryPanel />;
                            case 'asset_library':
                                return <NexusVault />;
                            case 'calendar':
                                return (
                                    <CalendarStudio
                                        events={calendarEvents}
                                        onAddEvent={handleAddCalendarEvent}
                                        onUpdateEvent={handleUpdateCalendarEvent}
                                        onDeleteEvent={handleDeleteCalendarEvent}
                                    />
                                );
                            case 'command_center':
                                return <NexusControlCenter />;
                            default:
                                return null;
                        }
                    })()}
                </motion.div>
            </AnimatePresence>
            </ErrorBoundary>
        </Suspense>
    );
  }

  if (systemConfig.maintenanceMode && !isAdminUser) {
      return (
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black p-6 font-tajawal">
              <div className="p-8 glass-card border border-white/10 max-w-md w-full text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                      <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                  </div>
                  <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">System Maintenance</h1>
                  <p className="text-sm text-white/40 uppercase tracking-widest font-bold mb-6">We're updating our AI Neural Networks</p>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-6">
                      <div className="h-full bg-[var(--color-accent)] w-1/3 animate-[shimmer_2s_infinite]" />
                  </div>
                  <p className="text-xs text-white/30 leading-relaxed">
                      Mada Agency is undergoing scheduled maintenance to bring you new capabilities. Please check back shortly.
                  </p>
              </div>
          </div>
      );
  }

  useEffect(() => {
    const STUDIO_KEYS: Record<string, AppView> = {
      '1': 'creator_studio', '2': 'storyboard_studio', '3': 'branding_studio',
      '4': 'marketing_studio', '5': 'photoshoot_director', '6': 'edit_studio',
      '7': 'plan_studio', '8': 'command_center', '9': 'asset_library', '0': 'calendar',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'k') {
        e.preventDefault();
        setIsOmniSearchOpen(!state.isOmniSearchOpen);
        return;
      }
      if (mod && ((e.key >= '1' && e.key <= '9') || e.key === '0')) {
        e.preventDefault();
        const target = STUDIO_KEYS[e.key];
        if (target) { setView(target); scrollToContent(); }
        return;
      }
      if (mod && e.key === 't') {
        e.preventDefault();
        const studio = STUDIO_KEYS['1'];
        if (studio) {
          setView(studio);
          scrollToContent();
        }
        return;
      }
      if (mod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('studio-undo'));
        return;
      }
      if (mod && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('studio-redo'));
        return;
      }
      if (mod && e.shiftKey && e.key === 'e') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_ERROR_DASHBOARD' });
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      ErrorService.log(event.error || event.message, 'high', { source: 'window.onerror' });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      ErrorService.log(event.reason, 'medium', { source: 'unhandledrejection' });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    const onOpenErrors = () => dispatch({ type: 'SET_ERROR_DASHBOARD', open: true });
    window.addEventListener('studio-open-errors', onOpenErrors);
    ErrorService.init();
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('studio-open-errors', onOpenErrors);
    };
  }, []);



  const activeProject = useMemo(() => {
    switch(view) {
      case 'creator_studio': return creatorProjects[activeCreatorIndex];
      case 'photoshoot_director': return photoshootProjects[activePhotoshootIndex];
      case 'prompt_studio': return promptStudioProjects[activePromptStudioIndex];
      case 'voice_over_studio': return voiceOverProjects[activeVoiceOverIndex];
      case 'branding_studio': return brandingProjects[activeBrandingIndex];
      case 'campaign_studio': return campaignProjects[activeCampaignIndex];
      case 'plan_studio': return planProjects[activePlanIndex];
      case 'storyboard_studio': return storyboardProjects[activeStoryboardIndex];
      case 'marketing_studio': return marketingProjects[activeMarketingIndex];
      case 'edit_studio': return editProjects[activeEditIndex];
      case 'controller_studio': return controllerProjects[activeControllerIndex];
      case 'bg_remover_studio': return bgProjects[activeBGIndex];
      default: return null;
    }
  }, [view, creatorProjects, activeCreatorIndex, photoshootProjects, activePhotoshootIndex, promptStudioProjects, activePromptStudioIndex, voiceOverProjects, activeVoiceOverIndex, brandingProjects, activeBrandingIndex, campaignProjects, activeCampaignIndex, planProjects, activePlanIndex, storyboardProjects, activeStoryboardIndex, marketingProjects, activeMarketingIndex, editProjects, activeEditIndex, controllerProjects, activeControllerIndex, bgProjects, activeBGIndex]);

  return (
    <ToastProvider>
    <ErrorGlobalListener />
    <div className="min-h-screen w-full flex flex-col items-center relative font-tajawal bg-[var(--color-background-base)]">
      <OmniSearch 
          isOpen={isOmniSearchOpen} 
          onClose={closeSearch}
          onNavigate={handleNavigate}
      />
      <ErrorDashboard
          isOpen={isErrorDashboardOpen}
          onClose={() => dispatch({ type: 'SET_ERROR_DASHBOARD', open: false })}
      />
      {systemConfig.maintenanceMode && isAdminUser && (
          <div className="w-full bg-amber-500 py-2 px-4 flex items-center justify-center gap-3 font-black text-[10px] text-black uppercase tracking-[0.4em] z-[100] animate-pulse sticky top-0 italic">
              <AlertTriangle className="w-4 h-4" />
              NEXUS_MAINTENANCE_PROTOCOL_ACTIVE // CORE_ACCESS_RESTRICTED
          </div>
      )}
      <div className="film-grain" />
      


      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        activeView={view}
        onNavigate={navigateToView}
        onOpenSearch={openSearch}
        onOpenErrorDashboard={() => dispatch({ type: 'SET_ERROR_DASHBOARD', open: true })}
        theme={theme}
        onThemeChange={changeTheme}
        isAdmin={isAdminUser}
      />

      <div className="w-full max-w-7xl mx-auto px-4 pt-6 md:pt-10 pb-4">
        <button onClick={() => setView('home')} className="flex items-center gap-4 mb-8 hover:opacity-80 transition-opacity text-left">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo.png" alt="Mada Agency" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">Mada Agency</h1>
            <p className="text-[10px] text-[var(--color-accent)] font-bold uppercase tracking-[0.3em] opacity-60">{branding.tagline}</p>
          </div>
        </button>
        <StudioGrid onNavigate={navigateToView} />
      </div>
      
      <div ref={contentRef} className={cn(
        'flex-grow pt-8 pb-20 px-2 sm:px-4 z-10 min-w-0 overflow-x-hidden transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-[60px]' : 'lg:ml-[220px]'
      )}>
        {renderContent()}
      </div>

      <GlobalSettings 
        isOpen={isBannerManagerOpen}
        onClose={closeSettings}
        isAdmin={isAdminUser}
        systemConfig={systemConfig}
        onUpdateSystemConfig={updateSystemConfig}
      />

      <NexusAssistant 
        currentView={view} 
        activeProject={activeProject}
      />
    </div>
    </ToastProvider>
  );
}

export default App;
