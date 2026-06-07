export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  studioType: string;
  icon: string;
  defaultData: Record<string, any>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'product-launch',
    name: 'Standard Product Launch',
    description: 'Pre-filled strategy with target market analysis, campaign pillars, and rollout schedule',
    studioType: 'marketing_studio',
    icon: 'Rocket',
    defaultData: {
      campaignGoal: 'Brand Awareness',
      campaignType: 'New Product Launch',
      campaignTone: 'Professional',
      platforms: ['Instagram', 'Facebook', 'LinkedIn'],
      brief: 'Launch a new product to market with a multi-channel approach combining digital ads, influencer partnerships, and PR outreach.',
      campaignDuration: '3 Months',
      successMetrics: 'Reach, Engagement Rate, Conversion Rate, ROI',
    },
  },
  {
    id: 'brand-identity',
    name: 'Full Brand Identity',
    description: 'Complete brand strategy with mission, vision, values, personality, and visual identity brief',
    studioType: 'branding_studio',
    icon: 'Palette',
    defaultData: {
      targetAudience: 'Premium lifestyle consumers aged 25-45',
      brandVoice: 'Sophisticated, confident, and approachable',
      brandPersonality: ['Modern', 'Luxury', 'Minimalist', 'Professional'],
      fontPreferences: 'Clean sans-serif for headings, elegant serif for body',
    },
  },
  {
    id: 'social-campaign',
    name: 'Social Media Sprint',
    description: '2-week social media campaign with content calendar, ad copies, and engagement strategy',
    studioType: 'marketing_studio',
    icon: 'Share2',
    defaultData: {
      campaignGoal: 'Community Engagement',
      campaignType: 'Brand Awareness Push',
      platforms: ['Instagram', 'TikTok', 'Twitter/X'],
      campaignTone: 'Casual',
      brief: 'A rapid 2-week social media sprint to boost engagement and grow follower base through interactive content.',
      campaignDuration: '2 Weeks',
      successMetrics: 'Engagement Rate, Follower Growth, Reach',
    },
  },
  {
    id: 'photoshoot-pack',
    name: 'Product Photoshoot Pack',
    description: 'Pre-configured photoshoot with common shot types, lighting presets, and aspect ratios',
    studioType: 'photoshoot_director',
    icon: 'Camera',
    defaultData: {
      selectedShotTypes: ['Hero Shot', 'Detail Shot', 'Lifestyle Shot', 'Group Shot'],
      customStylePrompt: 'Clean white background with soft studio lighting, professional commercial photography style',
    },
  },
  {
    id: 'video-storyboard',
    name: 'Video Storyboard',
    description: 'Blank storyboard template with scene structure, shot types, and camera movement suggestions',
    studioType: 'storyboard_studio',
    icon: 'Clapperboard',
    defaultData: {
      projectTitle: 'New Project',
      visualStyle: 'Cinematic, moody lighting with warm color grading',
      aspectRatio: '16:9',
    },
  },
];

export function getTemplatesForStudio(studioType: string): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter(t => t.studioType === studioType);
}

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(t => t.id === id);
}
