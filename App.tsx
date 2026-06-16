
import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
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
  PrePilotAgencySuiteProject
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
const AdminStudio = lazy(() => import('./components/AdminStudio'));
const GlobalHistoryPanel = lazy(() => import('./components/GlobalHistoryPanel'));
const NexusVault = lazy(() => import('./components/NexusVault'));
const NexusControlCenter = lazy(() => import('./components/NexusControlCenter'));
import { CalendarStudio } from './components/CalendarStudio';
import { CalendarEvent } from './components/CalendarStudio';

import TabBar from './components/TabBar';
import { LIGHTING_STYLES, CAMERA_PERSPECTIVES, VOICES, LOGO_IMAGE_URL } from './constants';
import GlobalSettings from './components/GlobalSettings';
import OmniSearch from './components/OmniSearch';
import PresenceSystem from './components/PresenceSystem';
import { ErrorBoundary } from './lib/ErrorBoundary';
import { ToastProvider } from './lib/useToast';
import { cn } from './lib/utils';
import Sidebar from './components/Sidebar';

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
};

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const Typewriter = () => {
    const words = ["DESIGN", "STORYBOARD", "PHOTOSHOOT", "VOICE OVER"];
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        const handleType = () => {
            const fullWord = words[currentWordIndex % words.length];

            setCurrentText(prev => {
                if (isDeleting) {
                    return fullWord.substring(0, prev.length - 1);
                } else {
                    return fullWord.substring(0, prev.length + 1);
                }
            });

            if (isDeleting) {
                setTypingSpeed(75);
            } else {
                setTypingSpeed(150);
            }

            if (!isDeleting && currentText === fullWord) {
                setTypingSpeed(2000);
                setIsDeleting(true);
            } else if (isDeleting && currentText === "") {
                setIsDeleting(false);
                setCurrentWordIndex(prev => prev + 1);
                setTypingSpeed(500);
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [currentText, isDeleting, currentWordIndex, words, typingSpeed]);

    return (
        <span className="text-[var(--color-accent)] inline-flex items-center">
            {currentText}
            <span className="animate-pulse ml-1 text-[var(--color-accent)] font-light">|</span>
        </span>
    );
};

const InteractiveLogo = () => {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
  
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 400;
  
        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          const moveX = -(dx / dist) * 120 * force;
          const moveY = -(dy / dist) * 120 * force;
          setOffset({ x: moveX, y: moveY });
        } else {
          setOffset({ x: 0, y: 0 });
        }
      };
  
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
  
    return (
      <div
        ref={ref}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: 'transform 0.1s ease-out',
        }}
        className="relative z-0"
      >
          <div className="animate-float">
                <img
                src="/logo.png"
                alt="Mada Agency"
                className="w-72 md:w-[32rem] object-contain drop-shadow-2xl opacity-90 hover:opacity-100 transition-opacity"
                />
          </div>
      </div>
    );
  };

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

function App() {
  const [view, setView] = useState<AppView>('creator_studio');
  const [isBannerManagerOpen, setIsBannerManagerOpen] = useState(false);
  const [isOmniSearchOpen, setIsOmniSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [theme, setTheme] = useState('dark');
  const contentRef = useRef<HTMLDivElement>(null);

  const [creatorProjects, setCreatorProjects] = useState<CreatorStudioProject[]>([]);
  const [activeCreatorIndex, setActiveCreatorIndex] = useState(0);

  const [photoshootProjects, setPhotoshootProjects] = useState<PhotoshootDirectorProject[]>([]);
  const [activePhotoshootIndex, setActivePhotoshootIndex] = useState(0);

  const [promptStudioProjects, setPromptStudioProjects] = useState<PromptStudioProject[]>([]);
  const [activePromptStudioIndex, setActivePromptStudioIndex] = useState(0);

  const [voiceOverProjects, setVoiceOverProjects] = useState<VoiceOverStudioProject[]>([]);
  const [activeVoiceOverIndex, setActiveVoiceOverIndex] = useState(0);

  const [brandingProjects, setBrandingProjects] = useState<BrandingStudioProject[]>([]);
  const [activeBrandingIndex, setActiveBrandingIndex] = useState(0);

  const [campaignProjects, setCampaignProjects] = useState<CampaignStudioProject[]>([]);
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);

  const [planProjects, setPlanProjects] = useState<PlanStudioProject[]>([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);

  const [storyboardProjects, setStoryboardProjects] = useState<StoryboardStudioProject[]>([]);
  const [activeStoryboardIndex, setActiveStoryboardIndex] = useState(0);

  const [marketingProjects, setMarketingProjects] = useState<MarketingStudioProject[]>([]);
  const [activeMarketingIndex, setActiveMarketingIndex] = useState(0);

  const [controllerProjects, setControllerProjects] = useState<ControllerStudioProject[]>([]);
  const [activeControllerIndex, setActiveControllerIndex] = useState(0);

  const [editProjects, setEditProjects] = useState<EditStudioProject[]>([]);
  const [activeEditIndex, setActiveEditIndex] = useState(0);

  const [prePilotProjects, setPrePilotProjects] = useState<PrePilotAgencySuiteProject[]>([]);
  const [activePrePilotIndex, setActivePrePilotIndex] = useState(0);

  const [systemConfig, setSystemConfig] = useState<{
    activeStudios: string[];
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
  }>({
    activeStudios: [],
    maintenanceMode: false,
    allowNewRegistrations: true
  });

  const [branding, setBranding] = useState<{
    logo: string;
    tagline: string;
  }>({
    logo: "/logo.png",
    tagline: 'Transform your imagination into the perfect design with the power of AI.'
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('mada_calendar_events');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem('mada_calendar_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  const handleAddCalendarEvent = (event: CalendarEvent) => {
    setCalendarEvents(prev => [...prev, event]);
  };

  const handleUpdateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDeleteCalendarEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  const isAdminUser = true;

  useEffect(() => {
    const handleRemoteNav = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        const studioId = e.detail as AppView;
        // Verify if the studio context is valid
        if (STUDIO_METADATA[studioId]) {
          setView(studioId);
          // Scroll to top for a clean transition
          contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('nav-studio', handleRemoteNav);
    return () => window.removeEventListener('nav-studio', handleRemoteNav);
  }, []);

  // Initialize first project for each studio on mount
  useEffect(() => {
    const uid = 'local';
    setCreatorProjects(prev => prev.length === 0 ? [createNewCreatorProject(0, uid)] : prev);
    setPhotoshootProjects(prev => prev.length === 0 ? [createNewPhotoshootProject(0, uid)] : prev);
    setPromptStudioProjects(prev => prev.length === 0 ? [createNewPromptStudioProject(0, uid)] : prev);
    setVoiceOverProjects(prev => prev.length === 0 ? [createNewVoiceOverStudioProject(0, uid)] : prev);
    setBrandingProjects(prev => prev.length === 0 ? [createNewBrandingStudioProject(0, uid)] : prev);
    setCampaignProjects(prev => prev.length === 0 ? [createNewCampaignProject(0, uid)] : prev);
    setPlanProjects(prev => prev.length === 0 ? [createNewPlanProject(0, uid)] : prev);
    setStoryboardProjects(prev => prev.length === 0 ? [createNewStoryboardProject(0, uid)] : prev);
    setMarketingProjects(prev => prev.length === 0 ? [createNewMarketingProject(0, uid)] : prev);
    setControllerProjects(prev => prev.length === 0 ? [createNewControllerProject(0, uid)] : prev);
    setEditProjects(prev => prev.length === 0 ? [createNewEditProject(0, uid)] : prev);
    setPrePilotProjects(prev => prev.length === 0 ? [createNewPrePilotProject(0, uid)] : prev);
  }, []);

  const handleEngageProject = (project: any) => {
      // Switches the view and sets the active project index
      setView(project.studioType);
      
      const updateIndex = (projects: any[], setProjects: any, setActiveIndex: any) => {
          const index = projects.findIndex(p => p.id === project.id);
          if (index !== -1) {
              setActiveIndex(index);
          } else {
              setProjects((prev: any[]) => [...prev, project]);
              setActiveIndex(projects.length);
          }
      };

      switch (project.studioType) {
          case 'creator_studio': updateIndex(creatorProjects, setCreatorProjects, setActiveCreatorIndex); break;
          case 'photoshoot_director': updateIndex(photoshootProjects, setPhotoshootProjects, setActivePhotoshootIndex); break;
          case 'prompt_studio': updateIndex(promptStudioProjects, setPromptStudioProjects, setActivePromptStudioIndex); break;
          case 'voice_over_studio': updateIndex(voiceOverProjects, setVoiceOverProjects, setActiveVoiceOverIndex); break;
          case 'branding_studio': updateIndex(brandingProjects, setBrandingProjects, setActiveBrandingIndex); break;
          case 'campaign_studio': updateIndex(campaignProjects, setCampaignProjects, setActiveCampaignIndex); break;
          case 'plan_studio': updateIndex(planProjects, setPlanProjects, setActivePlanIndex); break;
          case 'storyboard_studio': updateIndex(storyboardProjects, setStoryboardProjects, setActiveStoryboardIndex); break;
          case 'marketing_studio': updateIndex(marketingProjects, setMarketingProjects, setActiveMarketingIndex); break;
          case 'edit_studio': updateIndex(editProjects, setEditProjects, setActiveEditIndex); break;
          case 'controller_studio': updateIndex(controllerProjects, setControllerProjects, setActiveControllerIndex); break;
          case 'prepilot_agency_suite': updateIndex(prePilotProjects, setPrePilotProjects, setActivePrePilotIndex); break;
          case 'calendar': break;
      }
      scrollToContent();
  };

  const updateSystemConfig = async (updates: any): Promise<void> => {
    setSystemConfig(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const scrollToContent = () => {
    if (contentRef.current) {
      const y = contentRef.current.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };
  
  const addTab = <T,>(
    projects: T[],
    setProjects: React.Dispatch<React.SetStateAction<T[]>>,
    setActiveIndex: React.Dispatch<React.SetStateAction<number>>,
    createFn: (count: number) => T
  ) => {
    setProjects(prev => {
        const newProjects = [...prev, createFn(prev.length)];
        setActiveIndex(newProjects.length - 1);
        return newProjects;
    });
  };

  const closeTab = <T,>(
    index: number,
    projects: T[],
    setProjects: React.Dispatch<React.SetStateAction<T[]>>,
    activeIndex: number,
    setActiveIndex: React.Dispatch<React.SetStateAction<number>>,
    createFn: (count: number) => T
  ) => {
     setProjects(prev => {
         const newProjects = prev.filter((_, i) => i !== index);
         if (newProjects.length === 0) {
             setActiveIndex(0);
             return [createFn(0)];
         }
         
         if (index === activeIndex) {
             setActiveIndex(curr => Math.max(0, curr - 1));
         } else if (index < activeIndex) {
             setActiveIndex(curr => Math.max(0, curr - 1));
         }
         return newProjects;
     });
  };

  const updateCreatorProject = useCallback((action: React.SetStateAction<CreatorStudioProject>) => {
    setCreatorProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activeCreatorIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activeCreatorIndex] = updated;
        return newProjects;
    });
  }, [activeCreatorIndex]);

  const updatePhotoshootProject = useCallback((action: React.SetStateAction<PhotoshootDirectorProject>) => {
    setPhotoshootProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activePhotoshootIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activePhotoshootIndex] = updated;
        return newProjects;
    });
  }, [activePhotoshootIndex]);

  const updatePromptStudioProject = useCallback((action: React.SetStateAction<PromptStudioProject>) => {
    setPromptStudioProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activePromptStudioIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activePromptStudioIndex] = updated;
        return newProjects;
    });
  }, [activePromptStudioIndex]);

  const updateVoiceOverProject = useCallback((action: React.SetStateAction<VoiceOverStudioProject>) => {
    setVoiceOverProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activeVoiceOverIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activeVoiceOverIndex] = updated;
        return newProjects;
    });
  }, [activeVoiceOverIndex]);

  const updateBrandingProject = useCallback((action: React.SetStateAction<BrandingStudioProject>) => {
    setBrandingProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activeBrandingIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activeBrandingIndex] = updated;
        return newProjects;
    });
  }, [activeBrandingIndex]);

  const updateCampaignProject = useCallback((action: React.SetStateAction<CampaignStudioProject>) => {
    setCampaignProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activeCampaignIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activeCampaignIndex] = updated;
        return newProjects;
    });
  }, [activeCampaignIndex]);

  const updatePlanProject = useCallback((action: React.SetStateAction<PlanStudioProject>) => {
    setPlanProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activePlanIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activePlanIndex] = updated;
        return newProjects;
    });
  }, [activePlanIndex]);

  const updateStoryboardProject = useCallback((action: React.SetStateAction<StoryboardStudioProject>) => {
    setStoryboardProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activeStoryboardIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activeStoryboardIndex] = updated;
        return newProjects;
    });
  }, [activeStoryboardIndex]);

  const updateMarketingProject = useCallback((action: React.SetStateAction<MarketingStudioProject>) => {
    setMarketingProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activeMarketingIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activeMarketingIndex] = updated;
        return newProjects;
    });
  }, [activeMarketingIndex]);

  const updateEditProject = useCallback((action: React.SetStateAction<EditStudioProject>) => {
    setEditProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activeEditIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activeEditIndex] = updated;
        return newProjects;
    });
  }, [activeEditIndex]);

  const updateControllerProject = useCallback((action: React.SetStateAction<ControllerStudioProject>) => {
    setControllerProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activeControllerIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activeControllerIndex] = updated;
        return newProjects;
    });
  }, [activeControllerIndex]);

  const updatePrePilotProject = useCallback((action: React.SetStateAction<PrePilotAgencySuiteProject>) => {
    setPrePilotProjects(prev => {
        const newProjects = [...prev];
        const current = newProjects[activePrePilotIndex];
        const updated = action instanceof Function ? action(current) : action;
        newProjects[activePrePilotIndex] = updated;
        return newProjects;
    });
  }, [activePrePilotIndex]);

  const handleExportToStudio = useCallback((targetView: AppView, data: any) => {
    setView(targetView);
    // Based on target view, we might want to update the current project or create a new one
    switch (targetView) {
        case 'campaign_studio':
            setCampaignProjects(prev => {
                const next = [...prev];
                next[activeCampaignIndex] = { ...next[activeCampaignIndex], ...data };
                return next;
            });
            break;
        case 'marketing_studio':
            setMarketingProjects(prev => {
                const next = [...prev];
                next[activeMarketingIndex] = { ...next[activeMarketingIndex], ...data };
                return next;
            });
            break;
        case 'photoshoot_director':
            setPhotoshootProjects(prev => {
                const next = [...prev];
                next[activePhotoshootIndex] = { ...next[activePhotoshootIndex], ...data };
                return next;
            });
            break;
        case 'voice_over_studio':
            setVoiceOverProjects(prev => {
                const next = [...prev];
                next[activeVoiceOverIndex] = { ...next[activeVoiceOverIndex], ...data };
                return next;
            });
            break;
        case 'edit_studio':
            setEditProjects(prev => {
                const next = [...prev];
                next[activeEditIndex] = { ...next[activeEditIndex], ...data };
                return next;
            });
            break;
        case 'plan_studio':
            setPlanProjects(prev => {
                const next = [...prev];
                next[activePlanIndex] = { ...next[activePlanIndex], ...data };
                return next;
            });
            break;
        case 'creator_studio':
             setCreatorProjects(prev => {
                const next = [...prev];
                next[activeCreatorIndex] = { ...next[activeCreatorIndex], ...data };
                return next;
            });
            break;
        case 'prompt_studio':
            setPromptStudioProjects(prev => {
                const next = [...prev];
                next[activePromptStudioIndex] = { ...next[activePromptStudioIndex], ...data };
                return next;
            });
            break;
        case 'branding_studio':
            setBrandingProjects(prev => {
                const next = [...prev];
                next[activeBrandingIndex] = { ...next[activeBrandingIndex], ...data };
                return next;
            });
            break;
        case 'storyboard_studio':
            setStoryboardProjects(prev => {
                const next = [...prev];
                next[activeStoryboardIndex] = { ...next[activeStoryboardIndex], ...data };
                return next;
            });
            break;
        case 'controller_studio':
            setControllerProjects(prev => {
                const next = [...prev];
                next[activeControllerIndex] = { ...next[activeControllerIndex], ...data };
                return next;
            });
            break;
        case 'pre_pilot_studio':
            setPrePilotProjects(prev => {
                const next = [...prev];
                next[activePrePilotIndex] = { ...next[activePrePilotIndex], ...data };
                return next;
            });
            break;
        default:
            break;
    }
    scrollToContent();
  }, [activeCampaignIndex, activeMarketingIndex, activePhotoshootIndex, activeVoiceOverIndex, activeEditIndex, activePlanIndex, activeCreatorIndex, activePromptStudioIndex, activeBrandingIndex, activeStoryboardIndex, activeControllerIndex, activePrePilotIndex]);


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
                                            onAddTab={() => addTab(creatorProjects, setCreatorProjects, setActiveCreatorIndex, (count) => createNewCreatorProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, creatorProjects, setCreatorProjects, activeCreatorIndex, setActiveCreatorIndex, (count) => createNewCreatorProject(count, 'local'))}
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
                                            onAddTab={() => addTab(photoshootProjects, setPhotoshootProjects, setActivePhotoshootIndex, (count) => createNewPhotoshootProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, photoshootProjects, setPhotoshootProjects, activePhotoshootIndex, setActivePhotoshootIndex, (count) => createNewPhotoshootProject(count, 'local'))}
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
                                            onAddTab={() => addTab(promptStudioProjects, setPromptStudioProjects, setActivePromptStudioIndex, (count) => createNewPromptStudioProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, promptStudioProjects, setPromptStudioProjects, activePromptStudioIndex, setActivePromptStudioIndex, (count) => createNewPromptStudioProject(count, 'local'))}
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
                                            onAddTab={() => addTab(voiceOverProjects, setVoiceOverProjects, setActiveVoiceOverIndex, (count) => createNewVoiceOverStudioProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, voiceOverProjects, setVoiceOverProjects, activeVoiceOverIndex, setActiveVoiceOverIndex, (count) => createNewVoiceOverStudioProject(count, 'local'))}
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
                                            onAddTab={() => addTab(campaignProjects, setCampaignProjects, setActiveCampaignIndex, (count) => createNewCampaignProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, campaignProjects, setCampaignProjects, activeCampaignIndex, setActiveCampaignIndex, (count) => createNewCampaignProject(count, 'local'))}
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
                                            onAddTab={() => addTab(planProjects, setPlanProjects, setActivePlanIndex, (count) => createNewPlanProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, planProjects, setPlanProjects, activePlanIndex, setActivePlanIndex, (count) => createNewPlanProject(count, 'local'))}
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
                                            onAddTab={() => addTab(storyboardProjects, setStoryboardProjects, setActiveStoryboardIndex, (count) => createNewStoryboardProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, storyboardProjects, setStoryboardProjects, activeStoryboardIndex, setActiveStoryboardIndex, (count) => createNewStoryboardProject(count, 'local'))}
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
                                            onAddTab={() => addTab(marketingProjects, setMarketingProjects, setActiveMarketingIndex, (count) => createNewMarketingProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, marketingProjects, setMarketingProjects, activeMarketingIndex, setActiveMarketingIndex, (count) => createNewMarketingProject(count, 'local'))}
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
                                            onAddTab={() => addTab(brandingProjects, setBrandingProjects, setActiveBrandingIndex, (count) => createNewBrandingStudioProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, brandingProjects, setBrandingProjects, activeBrandingIndex, setActiveBrandingIndex, (count) => createNewBrandingStudioProject(count, 'local'))}
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
                                            onAddTab={() => addTab(controllerProjects, setControllerProjects, setActiveControllerIndex, (count) => createNewControllerProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, controllerProjects, setControllerProjects, activeControllerIndex, setActiveControllerIndex, (count) => createNewControllerProject(count, 'local'))}
                                        />
                                        <ControllerStudio
                                            project={controllerProjects[activeControllerIndex]}
                                            setProject={updateControllerProject}
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
                                            onAddTab={() => addTab(editProjects, setEditProjects, setActiveEditIndex, (count) => createNewEditProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, editProjects, setEditProjects, activeEditIndex, setActiveEditIndex, (count) => createNewEditProject(count, 'local'))}
                                        />
                                        <EditStudio
                                            project={editProjects[activeEditIndex]}
                                            setProject={updateEditProject}
                                        />
                                    </div>
                                );
                            case 'video_studio':
                                return (
                                    <VideoStudio />
                                );
                            case 'prepilot_agency_suite':
                                return (
                                    <div className="flex flex-col w-full gap-4">
                                        <TabBar
                                            projects={prePilotProjects}
                                            activeProjectIndex={activePrePilotIndex}
                                            onSelectTab={setActivePrePilotIndex}
                                            onAddTab={() => addTab(prePilotProjects, setPrePilotProjects, setActivePrePilotIndex, (count) => createNewPrePilotProject(count, 'local'))}
                                            onCloseTab={(idx) => closeTab(idx, prePilotProjects, setPrePilotProjects, activePrePilotIndex, setActivePrePilotIndex, (count) => createNewPrePilotProject(count, 'local'))}
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
        setIsOmniSearchOpen(prev => !prev);
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ToastProvider>
    <div className="min-h-screen w-full flex flex-col items-center relative font-tajawal bg-[var(--color-background-base)]">
      <OmniSearch 
          isOpen={isOmniSearchOpen} 
          onClose={() => setIsOmniSearchOpen(false)} 
          onNavigate={(v) => {
            setView(v);
            scrollToContent();
          }} 
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
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        activeView={view}
        onNavigate={(v) => { setView(v); scrollToContent(); }}
        onOpenSearch={() => setIsOmniSearchOpen(true)}
        theme={theme}
        onThemeChange={(t) => setTheme(t as any)}
        isAdmin={isAdminUser}
      />

      <section className="w-full max-w-7xl mx-auto px-4 pt-4 md:pt-8 pb-12 flex flex-col justify-center min-h-[50vh] relative">
           <div className="max-w-4xl relative z-10">
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.9] text-[var(--color-text-base)]">
                 EASY & FAST<br/>
                 WAY TO<br/>
                 <Typewriter />
              </h1>
              <div className="mt-8 pl-4 border-l-4 border-[var(--color-accent)]">
                  <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
                    {branding.tagline}
                  </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                 <button 
                    onClick={scrollToContent}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center shadow-lg shadow-[var(--color-accent)]/20"
                 >
                    START CREATING <ArrowRightIcon />
                 </button>
              </div>
           </div>
            <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 pr-12 xl:pr-24 pointer-events-none">
                <div className="pointer-events-auto">
                    <InteractiveLogo />
                </div>
           </div>
      </section>
      
      <div ref={contentRef} className={cn(
        'flex-grow pt-8 pb-20 px-2 sm:px-4 z-10 min-w-0 overflow-x-hidden transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-[60px]' : 'lg:ml-[220px]'
      )}>
        {renderContent()}
      </div>

      <GlobalSettings 
        isOpen={isBannerManagerOpen}
        onClose={() => setIsBannerManagerOpen(false)}
        isAdmin={isAdminUser}
        systemConfig={systemConfig}
        onUpdateSystemConfig={updateSystemConfig}
      />

      {/* Toast notifications rendered by ToastProvider */}

      <NexusAssistant 
        currentView={view} 
        activeProject={(() => {
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
                default: return null;
            }
        })()}
      />
    </div>
    </ToastProvider>
  );
}

export default App;
