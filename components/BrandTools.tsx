import { useState } from 'react';
import { createAICall } from '../lib/ai';
import { Sparkles, Copy, Check, Loader2, FileText, Download } from 'lucide-react';
import { useToast } from '../lib/useToast';
import { MiniAISelector } from './MiniAISelector';
import type { BrandingStudioProject, ExternalServiceConfig } from '../types';

interface ToolDef {
  id: string;
  label: string;
  prompt: string;
}

interface SectionDef {
  id: string;
  label: string;
  icon: string;
  tools: ToolDef[];
}

const SECTIONS: SectionDef[] = [
  {
    id: 'strategy_positioning', label: 'Strategy & Positioning', icon: '🎯',
    tools: [
      { id: 'uvp_generator', label: 'UVP Generator', prompt: `Define a compelling Unique Value Proposition for {{brandName}} in {{specialty}}. Target audience: {{audience}}. Brand voice: {{voice}}. Language: {{language}}.
Structure: One-sentence UVP, What makes it unique (3 points), Why competitors can't copy it, Customer validation statement. Format as markdown.` },
      { id: 'positioning_statement', label: 'Positioning Statement', prompt: `Write a formal positioning statement for {{brandName}} ({{specialty}}). Audience: {{audience}}. Voice: {{voice}}. Language: {{language}}.
Template: "To [target audience], {{brandName}} is the [category] that [key benefit] because [reason to believe]."
Include: 3 positioning variants targeting different segments, positioning pitfalls to avoid. Format as markdown.` },
      { id: 'brand_essence', label: 'Brand Essence Model', prompt: `Define the brand essence for {{brandName}} ({{specialty}}). Language: {{language}}.
Use the Brand Essence Wheel: Core (heart & soul), Brand attributes (5-7), Value proposition (functional + emotional + self-expressive), Personality traits, Brand-customer relationship archetype.
Output as structured markdown.` },
      { id: 'archetype_refiner', label: 'Archetype Refiner', prompt: `Analyze and refine the brand archetype for {{brandName}} ({{specialty}}). Audience: {{audience}}. Language: {{language}}.
Evaluate all 12 archetypes (Innocent, Explorer, Sage, Hero, Outlaw, Magician, Regular Guy, Lover, Jester, Caregiver, Creator, Ruler). Score each 1-10 for fit. Recommend primary + shadow archetype. Explain how this archetype manifests in messaging, visuals, and customer experience. Format as markdown.` },
      { id: 'brand_architecture', label: 'Brand Architecture', prompt: `Design a brand architecture for {{brandName}} ({{specialty}}). Language: {{language}}.
Models: Branded House (single master brand), House of Brands (individual brands), Endorsed Brand, Hybrid.
Consider: Current/future product lines, Target segments, Market positioning, Scalability needs. Recommend best model with company structure diagram (text-based). Format as markdown.` },
      { id: 'brand_pyramid', label: 'Brand Pyramid', prompt: `Build a brand pyramid for {{brandName}} ({{specialty}}). Language: {{language}}.
Level 1 (Purpose): Why does the brand exist beyond profit? Level 2 (Vision): Future aspiration. Level 3 (Mission): What we do daily. Level 4 (Values): 5 core values with behaviors. Level 5 (Personality): Human characteristics.
Each level: clear statement, supporting explanation, alignment with {{audience}}. Format as markdown.` },
      { id: 'brand_mantra', label: 'Brand Mantra', prompt: `Create a short, powerful brand mantra for {{brandName}} ({{specialty}}). Language: {{language}}.
A brand mantra is 3-5 words capturing the brand's heart. Examples: Nike = "Authentic athletic performance", Disney = "Fun family entertainment".
Generate 5 mantra options, then recommend the top 1 with rationale. Format as markdown.` },
      { id: 'stakeholder_map', label: 'Stakeholder Map', prompt: `Create a brand stakeholder map for {{brandName}} ({{specialty}}). Language: {{language}}.
Groups: Internal (employees, leadership, board), External (customers, partners, investors), Community (local, industry, media), Influencers (thought leaders, advocates).
For each: what they need from the brand, current perception, engagement strategy. Format as markdown table.` },
      { id: 'audit_checklist', label: 'Brand Audit Checklist', prompt: `Create a comprehensive brand audit checklist for {{brandName}} ({{specialty}}). Language: {{language}}.
Categories: Visual identity (logo, colors, typography, imagery), Verbal identity (tone, messaging, tagline), Digital presence (website, social, email, ads), Physical presence (packaging, signage, print), Customer experience (touchpoints, service, community).
Each category: 10 audit questions with pass/fail criteria. Format as markdown.` },
      { id: 'rebranding', label: 'Rebranding Strategy', prompt: `Create a rebranding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Phases: Discovery (research + audit), Strategy (positioning + naming), Design (visual identity), Implementation (rollout plan), Launch (internal + external).
Timeline: 12-week plan with milestones. Risk assessment: 5 risks + mitigation. Success metrics: KPI targets. Format as markdown.` },
      { id: 'brand_extension', label: 'Brand Extension', prompt: `Evaluate brand extension opportunities for {{brandName}} ({{specialty}}). Language: {{language}}.
Analyze: Category adjacency map (5 adjacent categories), Fit score per extension (1-10), Consumer perception risk, Stretch vs reinforce strategy, 3 recommended extensions with rationale.
Use the brand's core strength as starting point. Format as markdown.` },
      { id: 'purpose_impact', label: 'Purpose & Impact', prompt: `Define the social/environmental purpose for {{brandName}} ({{specialty}}). Language: {{language}}.
Structure: Why this purpose matters to the brand, 3-pillar impact strategy (people, planet, prosperity), Measurable goals (5-year targets), Partner organizations to consider, Communication strategy (how to share without greenwashing).
Format as markdown.` },
    ]
  },
  {
    id: 'visual_identity', label: 'Visual Identity Systems', icon: '🎨',
    tools: [
      { id: 'logo_variants', label: 'Logo Variant Generator', prompt: `Design logo variant specifications for {{brandName}} ({{specialty}}). Voice: {{voice}}. Language: {{language}}.
Variants: Primary logo (full color, horizontal), Secondary logo (icon-only mark), Tertiary logo (vertical stack), Favicon (simplified 16×16), Submark (small badge).
For each: description, use case, clear space rule, minimum size, file format recommendations. Format as markdown.` },
      { id: 'submark_designer', label: 'Submark Designer', prompt: `Create a submark/badge design brief for {{brandName}} ({{specialty}}). Language: {{language}}.
Submark is a compact brand mark for social avatars, watermarks, and small applications.
Spec: Shape (circle/badge/crest), Elements (icon/initials/wordmark), Simplified detail level, Monochrome + color versions, 5 application examples.
Format as markdown brief.` },
      { id: 'pattern_generator', label: 'Pattern Generator', prompt: `Design a brand pattern system for {{brandName}} ({{specialty}}). Language: {{language}}.
Create 3 pattern variations: Geometric, Organic/fluid, Branded (incorporating logo marks).
Each: pattern description, color palette usage, scale/orientation, application examples (packaging, web bg, textiles), tiling specification. Format as markdown.` },
      { id: 'icon_system', label: 'Icon System', prompt: `Define an icon style guide for {{brandName}} ({{specialty}}). Language: {{language}}.
Spec: Line weight (thin/medium/bold), Corner radius (rounded/square/mixed), Filled vs outline ratio, Color usage (single/duotone/multicolor), Grid size (24×24 default), Naming convention.
List 20 essential icons to create first. Format as markdown.` },
      { id: 'illustration_style', label: 'Illustration Style', prompt: `Define an illustration style guide for {{brandName}} ({{specialty}}). Voice: {{voice}}. Language: {{language}}.
Cover: Style type (flat/3D/isometric/hand-drawn/abstract), Color palette application, Stroke vs no stroke, Shadow/highlight treatment, Character design rules, Texture usage, 5 sample illustration briefs.
Format as markdown spec.` },
      { id: 'mascot_creator', label: 'Mascot Creator', prompt: `Create a brand mascot concept for {{brandName}} ({{specialty}}). Language: {{language}}.
Mascot type: Animal, Character, Object personification, Abstract shape.
Design spec: Personality traits (5), Visual style, Color palette, Key poses (5), Expressions (6 basic emotions), Application sizes, On-brand vs off-brand usage examples. Format as markdown.` },
      { id: 'motion_guidelines', label: 'Motion Guidelines', prompt: `Write motion design guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Easing curves (standard, ease-in, ease-out), Duration ranges (micro: 100ms, standard: 300ms, narrative: 600ms+), Animation types (fade, slide, scale, rotate), Logo animation rules, Page transitions, Loading states.
Format as technical markdown.` },
      { id: 'photo_direction', label: 'Photography Direction', prompt: `Define photography style guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Lighting style (natural/studio/dramatic), Color grading (warm/cool/muted/vibrant), Composition rules (centered/rule-of-thirds/asymmetric), Subject matter (products/people/lifestyle), Background treatment, Model diversity requirements, Post-processing rules.
Format as markdown spec.` },
      { id: 'video_branding', label: 'Video Branding', prompt: `Design video branding guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Elements: Intro animation (3-5 sec), Lower thirds template, End screen/outro, Transition style, Watermark placement, Sound design (intro jingle, background music style), Color grade LUT specs, Aspect ratio variations.
Format as markdown per element.` },
      { id: 'data_viz', label: 'Data Visualization Style', prompt: `Define data visualization guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Chart types: bar, line, pie, scatter, heatmap, tables. Color application per chart type, Font hierarchy for titles/labels/numbers, Gridline and axis style, Annotation rules, Accessibility (color-blind friendly palettes), Tooltip/legend design.
Format as markdown spec.` },
      { id: 'responsive_logo', label: 'Responsive Logo', prompt: `Design responsive logo specifications for {{brandName}} ({{specialty}}). Language: {{language}}.
Breakpoints: Desktop (1024+), Tablet (768-1023), Mobile (320-767), Favicon (16-64), App icon (1024).
For each: variant to use, size specs, clear space reduction rules, what to remove/keep, simplified version for smallest sizes. Format as markdown.` },
      { id: 'accessibility_design', label: 'Accessibility-First Design', prompt: `Create accessibility guidelines for {{brandName}} ({{specialty}}) branding. Language: {{language}}.
Cover: WCAG 2.1 AA/AAA compliance targets, Color contrast ratios (4.5:1 normal, 3:1 large), Minimum touch targets (44×44px), Readable font sizes, Focus indicators, Screen reader annotations, Alt text rules, Motion sensitivity (reduced motion).
Format as markdown checklist.` },
    ]
  },
  {
    id: 'color_system', label: 'Color System', icon: '🌈',
    tools: [
      { id: 'palette_generator', label: 'Color Palette Generator', prompt: `Generate a complete brand color palette for {{brandName}} ({{specialty}}). Voice: {{voice}}. Language: {{language}}.
Palette: Primary (main brand color + 2 variants), Secondary (complementary, 2-3 colors), Accent (calls-to-action, 1-2 colors), Neutral (grays, off-whites, 4-5 colors).
Each: HEX, RGB, CMYK, PMS values. Color psychology meaning for each. Format as markdown table.` },
      { id: 'color_psychology', label: 'Color Psychology Report', prompt: `Write a color psychology analysis for {{brandName}} ({{specialty}}) chosen colors. Audience: {{audience}}. Language: {{language}}.
For each color in the palette: Psychological associations, Cultural meanings across US/EU/Asia/Middle East, Emotional response, Gender perception differences, Age-based perception shifts, Industry appropriateness.
Format as markdown report.` },
      { id: 'accessibility_checker', label: 'Accessibility Checker', prompt: `Audit color accessibility for {{brandName}} ({{specialty}}). Language: {{language}}.
For all color combinations: Foreground/background pairings, Contrast ratios, Pass/fail for WCAG AA/AAA at normal and large text, Color-blind simulation (protanopia/deuteranopia/tritanopia), Recommended fallbacks for failing pairs.
Format as markdown audit table.` },
      { id: 'color_hierarchy', label: 'Color Hierarchy', prompt: `Define color usage hierarchy for {{brandName}} ({{specialty}}). Language: {{language}}.
Usage percentages: Primary (60%), Secondary (30%), Accent (10%). Per element: Which colors for backgrounds, text, buttons, links, borders, icons, illustrations.
Include: Do/Don't examples, color distribution in common layouts. Format as markdown.` },
      { id: 'gradient_system', label: 'Gradient System', prompt: `Create a gradient system for {{brandName}} ({{specialty}}). Language: {{language}}.
3-5 gradient directions: Primary brand gradient, Dark mode gradient, Accent gradient, Translucent overlays.
Each: start/end colors, angle (linear) or shape (radial), usage rules (backgrounds, buttons, text overlays, illustrations), fallback for email/clients without gradient support. Format as markdown.` },
      { id: 'neutral_palette', label: 'Neutral Palette', prompt: `Generate a neutral color palette for {{brandName}} ({{specialty}}). Language: {{language}}.
Scale: 10 shades from white to black (50-900). Cool vs warm undertone decision, Application per shade (bg, text, border, disabled), Pairing with primary brand colors, Accessibility contrast with each neutral.
Format as markdown with color values.` },
      { id: 'seasonal_variants', label: 'Seasonal Variants', prompt: `Create seasonal/holiday color variations for {{brandName}} ({{specialty}}). Language: {{language}}.
Seasons: Spring (fresh/light), Summer (vibrant/warm), Fall (earthy/rich), Winter (cool/crisp). Holidays: Major celebrations relevant to the market.
Each: modified palette, accent changes only (keep primary stable), application timing, usage rules (don't over-seasonalize). Format as markdown.` },
      { id: 'competitor_colors', label: 'Industry Color Analysis', prompt: `Analyze competitor color usage in the {{specialty}} industry for {{brandName}} research. Language: {{language}}.
Research: Top 10 competitors' primary colors, Industry color clichés to avoid, Color differentiation opportunities, Market segment color trends, Cultural color considerations for target {{audience}}.
Recommend a color strategy that differentiates {{brandName}}. Format as markdown.` },
      { id: 'color_symbolism', label: 'Cross-Cultural Color Guide', prompt: `Create a cross-cultural color reference guide for {{brandName}} ({{specialty}}). Language: {{language}}.
Per region: North America, Latin America, Western Europe, Eastern Europe, Middle East/North Africa, Sub-Saharan Africa, South Asia, East Asia, Southeast Asia.
For each: positive/negative associations per color, religious/political color meanings, appropriate usage guidelines. Format as markdown per region.` },
      { id: 'dark_mode', label: 'Dark Mode Palette', prompt: `Design a dark mode adaptation of the {{brandName}} color palette. Specialty: {{specialty}}. Language: {{language}}.
Adjustments: Background (true dark #0a0a0a or dark gray), Text (diminished white for readability), Primary color (lighter variant for contrast), Shadows (use opacity, not black), Reduced saturation to prevent eye strain.
Test each color against WCAG contrast on #0a0a0a background. Format as markdown.` },
      { id: 'color_application', label: 'Color Application Map', prompt: `Create a color application map for {{brandName}} ({{specialty}}). Language: {{language}}.
For each brand touchpoint: Website, Mobile app, Email, Social media, Print collateral, Packaging, Signage, Merchandise, Advertising, Internal docs.
Specify: Which palette colors to use per element (bg, text, CTA, borders, accents). Format as markdown matrix.` },
      { id: 'tint_shade', label: 'Tint & Shade System', prompt: `Build a complete tint/shade system for {{brandName}} ({{specialty}}) primary and secondary colors. Language: {{language}}.
Per color: 50 (lightest) through 900 (darkest) with 100 increments. Color values for each step (HEX). Usage: 50-200 (backgrounds), 300-500 (interactive elements), 600-800 (text), 900 (headings).
Format as markdown table per color.` },
    ]
  },
  {
    id: 'typography', label: 'Typography System', icon: '🔤',
    tools: [
      { id: 'font_pairing', label: 'Font Pairing Tool', prompt: `Recommend font pairings for {{brandName}} ({{specialty}}). Voice: {{voice}}. Language: {{language}}.
Pair types: Serif + Sans-serif, Sans-serif + Sans-serif, Display + Body, Monospace + anything.
Provide 5 pairings: each with headline font, body font, why they work together, personality conveyed, usage rules (web, print, mobile). Include free (Google Fonts) and premium options. Format as markdown.` },
      { id: 'type_scale', label: 'Type Scale Generator', prompt: `Generate a modular type scale for {{brandName}} ({{specialty}}). Language: {{language}}.
Base size: 16px (1rem). Ratio: 1.250 (Major Third) or 1.333 (Perfect Fourth) — recommend best for the brand.
Scale output: 12 levels from caption to hero, with px/rem/em values, line-height per level, letter-spacing per level. Include web and print versions. Format as markdown table.` },
      { id: 'web_font_strategy', label: 'Web Font Strategy', prompt: `Create a web font loading strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Font loading (swap/block/fallback/optional), Preload critical fonts, Subsetting (latin + extended), File format ordering (woff2/woff/ttf), Performance budget (target <100kB total), Fallback font stack per OS, FOUT/FOIT handling.
Format as technical markdown.` },
      { id: 'font_psychology', label: 'Font Psychology Guide', prompt: `Analyze font psychology for {{brandName}} ({{specialty}}). Voice: {{voice}}. Language: {{language}}.
Per font choice: What personality traits it communicates (trustworthy/modern/luxurious/friendly), Industry appropriateness, Emotional response by demographic, Gender perception, Age relevance.
Comparison: How chosen fonts compare to competitor font choices. Format as markdown.` },
      { id: 'hierarchy_template', label: 'Hierarchy Template', prompt: `Define typography hierarchy for {{brandName}} ({{specialty}}). Language: {{language}}.
Levels: Hero/H1/H2/H3/H4/H5/H6/Body Large/Body/Caption/Small/Label/Button/Meta.
Each: font family, weight, size, line-height, letter-spacing, case, usage context (e.g., H1 = page title, Body = paragraph). Format as markdown table.` },
      { id: 'multilingual_type', label: 'Multilingual Typography', prompt: `Create multilingual typography guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Scripts: Latin, Arabic, CJK (Chinese/Japanese/Korean), Cyrillic, Devanagari.
Per script: Font recommendations that match the brand style, Size adjustments needed (Arabic needs ~20% larger), Line-height adjustments, Baseline alignment, LTR/RTL considerations.
Format as markdown per script.` },
      { id: 'responsive_type', label: 'Responsive Type Sizing', prompt: `Define responsive type sizes for {{brandName}} ({{specialty}}). Language: {{language}}.
Breakpoints: Desktop (1440+), Tablet (768), Mobile (375).
Per element (hero, h1-h6, body, caption): size at each breakpoint. Use clamp() for fluid sizing. Include example CSS clamp() values. Format as markdown table.` },
      { id: 'print_vs_digital', label: 'Print vs Digital Specs', prompt: `Contrast print and digital typography specs for {{brandName}} ({{specialty}}). Language: {{language}}.
Differences per element: Print uses pt, digital uses px/rem. Print uses serifs for body (readability), digital uses sans-serif (screen clarity). Print needs higher contrast, digital needs larger sizes.
Provide parallel spec table: print spec vs digital spec for each text element. Format as markdown.` },
      { id: 'type_guidelines', label: 'Typography Guidelines Page', prompt: `Write the typography section of the brand guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Sections: Brand fonts (primary + secondary), Type hierarchy with visual examples, Allowed weights and styles, Prohibited treatments (no stretching, no outlining, no arbitrary colors), Web font specifications, Print font specifications, Fallback fonts.
Format as brand-ready markdown copy.` },
      { id: 'custom_font_brief', label: 'Custom Font Brief', prompt: `Write a design brief for a custom brand font for {{brandName}} ({{specialty}}). Language: {{language}}.
Brief sections: Brand background, Design objectives, Character style (geometric/humanist/serif/sans/monospace/script), Glyph requirements (Uppercase, lowercase, numbers, punctuation, special chars: @#$€, multilingual support), Weights (Light to Black), Delivery format (OTF, WOFF2, variable font).
Include 3 reference fonts and what we like about each. Format as markdown.` },
      { id: 'emoji_font', label: 'Brand Emoji & Icon Font', prompt: `Define a brand emoji set and icon font strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Custom emoji: 20 essential emoji for brand communication (reactions, product categories, actions). Style: flat/3D/animated, Color palette, Size standardization.
Icon font: Recommend Font Awesome / Phosphor / custom SVG sprite, Licensing considerations, Naming conventions.
Format as markdown spec.` },
      { id: 'readability', label: 'Accessibility Readability', prompt: `Define readability standards for {{brandName}} ({{specialty}}). Language: {{language}}.
Minimum sizes: Body text 16px, Caption 12px. Line length: 45-75 characters. Line height: 1.5 body, 1.2 headings. Paragraph spacing: 1.5x line height. Maximum font weight for body: 400 (regular). Minimum contrast: 4.5:1 body text, 3:1 large text. Focus indicators: 2px outline.
Format as markdown spec table.` },
    ]
  },
  {
    id: 'voice_messaging', label: 'Brand Voice & Tone', icon: '🎙️',
    tools: [
      { id: 'voice_principles', label: 'Voice Principles', prompt: `Define 5 brand voice principles for {{brandName}} ({{specialty}}). Audience: {{audience}}. Language: {{language}}.
Per principle: Name (e.g., "Confident but not arrogant"), Description (1-2 sentences), Do example (sentence), Don't example (sentence), Personality trait it reinforces.
Make each principle distinct and actionable. Format as markdown.` },
      { id: 'tone_spectrum', label: 'Tone Spectrum', prompt: `Create a tone spectrum for {{brandName}} ({{specialty}}). Language: {{language}}.
Axis 1: Formal ↔ Casual. Axis 2: Serious ↔ Playful. Axis 3: Respectful ↔ Irreverent. Axis 4: Enthusiastic ↔ Reserved.
Per channel map: Website, Email, Social, Ads, Support, Internal, PR, Legal. Where each falls on each axis. Show positioning on a grid. Format as markdown.` },
      { id: 'messaging_house', label: 'Messaging House', prompt: `Build a messaging hierarchy for {{brandName}} ({{specialty}}). Language: {{language}}.
Roof: Brand promise (single sentence). Top floor: Primary message (key positioning). Middle floor: 3 proof pillars supporting the promise. Ground floor: Supporting evidence (stats, testimonials, features). Foundation: Brand values and personality.
Format as structured markdown.` },
      { id: 'tagline_generator', label: 'Tagline Generator', prompt: `Generate 15 tagline options for {{brandName}} ({{specialty}}). Language: {{language}}.
5 categories: Descriptive (what we do), Aspirational (what we enable), Evocative (emotional), Provocative (thought-provoking), Benefits-focused.
Each: tagline, category, why it works, best usage context (logo, campaign, email signature). Format as markdown table.` },
      { id: 'slogan_variants', label: 'Slogan Variants', prompt: `Create campaign-ready slogan variants for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
5 variants: Internal rallying cry, Customer-facing, Short (2-3 words), Medium (5-7 words), Long (10-12 words).
Each: slogan, target segment, emotional trigger, call to action. Format as markdown.` },
      { id: 'key_messages', label: 'Key Messages', prompt: `Develop key messages for {{brandName}} ({{specialty}}) per audience segment. Language: {{language}}.
Segments: Customers, Prospects, Employees, Investors, Partners, Media.
Per segment: Primary message, Supporting message (2-3), Proof points, Tone adjustment. Format as markdown per segment.` },
      { id: 'dos_donts', label: 'Language Do\'s and Don\'ts', prompt: `Create a brand language reference for {{brandName}} ({{specialty}}). Language: {{language}}.
Categories: Words to use (20+), Words to avoid (20+), Phrases to always include, Phrases to never say, Industry jargon (allowed vs prohibited), Punctuation preferences (Oxford comma? Exclamation marks?).
Format as markdown reference.` },
      { id: 'storytelling', label: 'Storytelling Framework', prompt: `Create a brand storytelling framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Framework: Hero (customer), Problem, Guide (brand), Plan, Action, Success, Avoid failure.
3 story templates: Origin story, Customer success story, Vision story. Each: template structure, emotional arc, length (short 100w / medium 300w / long 600w).
Format as markdown.` },
      { id: 'content_persona', label: 'Content Persona', prompt: `Create a brand content persona for {{brandName}} ({{specialty}}). Language: {{language}}.
If the brand were a person: Name, Age, Occupation, Education, Personality type (MBTI), Communication style, Hobbies, Values, Favorite media, Pet peeves, How they greet people, How they sign off.
Use this to guide all content creation. Format as markdown profile.` },
      { id: 'voice_ai_training', label: 'AI Voice Training', prompt: `Create an AI prompt training guide for {{brandName}} ({{specialty}}) brand voice. Language: {{language}}.
System prompt template: "You are {{brandName}}, a brand with the following personality... [insert personality]. When writing, follow these rules... [insert voice principles]."
Include: 20 sample prompts covering different content types with expected tone, 5 edge cases (bad news, complaints, crisis). Format as markdown.` },
      { id: 'crisis_tone', label: 'Crisis Communication Tone', prompt: `Define crisis communication tone guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Acknowledge quickly, Empathize genuinely, Take responsibility, Communicate progress.
Tone shift: Normal → Crisis (less playful, more direct, more formal). Templates: Initial statement, Follow-up update, Resolution message, Apology structure.
Format as markdown.` },
      { id: 'humor_guidelines', label: 'Humor Guidelines', prompt: `Define when and how {{brandName}} ({{specialty}}) can use humor. Language: {{language}}.
Humor types that fit the brand: Wit, Puns, Self-deprecation, Observational, Absurdist, Wholesome.
Guidelines: Appropriate channels for humor, Topics to never joke about, Cultural sensitivity per region, Testing process before publishing, Brand personality alignment check.
Format as markdown.` },
    ]
  },
  {
    id: 'digital_apps', label: 'Digital Brand Applications', icon: '💻',
    tools: [
      { id: 'website_branding', label: 'Website Branding', prompt: `Define website branding specifications for {{brandName}} ({{specialty}}). Language: {{language}}.
Elements: Hero section design, Navigation bar styling, Color application per section, Typography on screen, Button/CTA styling (default, hover, active, disabled), Form styling, Footer design, Mobile adaptations.
Format as markdown spec per element.` },
      { id: 'email_template', label: 'Email Template Design', prompt: `Create branded email template specifications for {{brandName}} ({{specialty}}). Language: {{language}}.
Template types: Newsletter, Promotional, Transactional, Welcome, Re-engagement.
Each: Header (logo placement, spacing), Body styling (fonts, colors, link styling), Footer (unsubscribe, social links, address), Mobile responsive rules. Include HTML email best practices. Format as markdown.` },
      { id: 'social_templates', label: 'Social Media Templates', prompt: `Design social media template specs for {{brandName}} ({{specialty}}). Language: {{language}}.
Per platform: Instagram (post, story, reel cover, carousel), LinkedIn (post, banner, article cover), Twitter/X (post, header, poll), TikTok (video cover, profile).
Each: dimensions, logo placement, color overlay rules, font treatment, photo filter/grading. Format as markdown per platform.` },
      { id: 'app_icon', label: 'App Icon Generator', prompt: `Create app icon specifications for {{brandName}} ({{specialty}}). Language: {{language}}.
Sizes: iOS (1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40), Android (512, 192, 144, 96, 72, 48), Web (favicon 16, 32, 48, 64, 96, 128, 196, 512).
Style: Flat/3D/Neumorphic, Shadow/gradient rules, Corner radius (iOS 20%, Android adaptive), Background color/gradient. Format as markdown.` },
      { id: 'favicon', label: 'Favicon Design', prompt: `Design a responsive favicon system for {{brandName}} ({{specialty}}). Language: {{language}}.
Formats: .ico (16×16, 32×32 multi-size), .svg (scalable), .png (32, 64, 180, 192, 512), Apple touch icon (180×60 with rounded corners).
Design: Simplified logo mark for small sizes, Monochrome version for small display, Dark mode variant. Browser configuration (theme-color meta tag). Format as markdown.` },
      { id: 'presentation', label: 'Presentation Template', prompt: `Design a brand presentation template for {{brandName}} ({{specialty}}). Language: {{language}}.
Slide types: Title, Section divider, Content (text), Content (image), Content (chart/data), Quote, Team, Contact, Thank you/closing.
Each: layout grid, color usage, typography, image placement, logo position. Slide master specifications: background (light + dark variant). Format as markdown.` },
      { id: 'newsletter_design', label: 'Newsletter Design', prompt: `Design a branded newsletter layout for {{brandName}} ({{specialty}}). Language: {{language}}.
Layout: Header (logo, navigation links), Hero section (featured content), Content cards (2-3 columns), Sidebar (optional), Footer (social, unsubscribe, address).
Specs: Width (600px max), Background color, Card styling (rounded corners, shadow), Typography for each element, CTA button style, Mobile breakpoint. Format as markdown.` },
      { id: 'landing_page', label: 'Brand Landing Page', prompt: `Design a brand-aligned landing page template for {{brandName}} ({{specialty}}). Language: {{language}}.
Sections: Hero (headline, subhead, CTA, hero image), Trust bar (logos, testimonials, stats), Features (3-column grid), How it works (3-step), Social proof, FAQ, Final CTA.
Each: copy length, image treatment, CTA styling, color usage. Format as markdown.` },
      { id: 'display_ads', label: 'Digital Ad Templates', prompt: `Create digital ad template specs for {{brandName}} ({{specialty}}). Language: {{language}}.
Sizes: Leaderboard (728×90), Medium rectangle (300×250), Skyscraper (160×600), Large mobile (320×100), Interstitial (480×320).
Each: copy length limits, CTA styling, color usage, logo placement, animation do's/don'ts. Format as markdown per size.` },
      { id: 'app_ui', label: 'App Interface Branding', prompt: `Define app UI branding for {{brandName}} ({{specialty}}). Language: {{language}}.
Elements: Navigation (top bar, tab bar, hamburger), Buttons (primary, secondary, ghost, icon), Cards, Lists, Forms (input, checkbox, radio, toggle), Modals, Alerts and toasts, Empty states, Loading states.
Each: color, typography, corner radius, spacing. Format as markdown per element.` },
      { id: '404_page', label: 'Branded 404 Page', prompt: `Design a branded 404 page concept for {{brandName}} ({{specialty}}). Language: {{language}}.
Concepts: 3 creative 404 page ideas (funny, helpful, brand-showcasing).
Each: headline, body copy, illustration/concept, CTA, brand elements included. Plus: 301 redirect strategy, custom error tracking. Format as markdown.` },
      { id: 'loading_animation', label: 'Loading Animation', prompt: `Design branded loading states for {{brandName}} ({{specialty}}). Language: {{language}}.
Types: Page loader (full-screen), Component loader (skeleton), Inline loader (spinner), Pull-to-refresh, Progress bar (linear).
Each: animation concept, color usage, timing (max 2-3 seconds), brand element integration, reduced motion fallback. Format as markdown.` },
    ]
  },
  {
    id: 'print_apps', label: 'Print Brand Applications', icon: '📄',
    tools: [
      { id: 'business_card', label: 'Business Card', prompt: `Design business card specifications for {{brandName}} ({{specialty}}). Language: {{language}}.
Standard: 85×55mm or 3.5×2in. Layout: Front (logo, name, title, company), Back (contact info, tagline).
Variants: Single-sided, Double-sided, Vertical, Mini (credit card size), Digital (vCard).
Each: paper stock recommendation, finish (matte/gloss/emboss), foil stamping options, color accuracy specs. Format as markdown.` },
      { id: 'letterhead', label: 'Letterhead', prompt: `Design letterhead specifications for {{brandName}} ({{specialty}}). Language: {{language}}.
Size: A4 (210×297mm) or US Letter (8.5×11in). Layout: Header (logo top-left or centered), Footer (address, contact, website).
Specs: Margins (top 2cm, sides 2.5cm, bottom 2cm), Color usage, Typography for body text, Second page rules, Envelope matching design.
Format as markdown spec.` },
      { id: 'envelope', label: 'Envelope Design', prompt: `Design envelope specifications for {{brandName}} ({{specialty}}). Language: {{language}}.
Sizes: DL (110×220mm), C5 (162×229mm), C4 (229×324mm).
Layout per size: Return address placement, Logo size and position, Window position (if applicable), Color/pattern usage, Mailing label format.
Format as markdown per size.` },
      { id: 'folder', label: 'Presentation Folder', prompt: `Design a presentation folder specification for {{brandName}} ({{specialty}}). Language: {{language}}.
Size: A4 (folded to 230×310mm). Layout: Front cover (logo centered), Inside left (brand story/values), Inside right (pocket for inserts), Back cover (contact info).
Material: Paper weight (300-350gsm), Finish (matte/gloss lamination), Foil stamping or emboss, Business card slot.
Format as markdown.` },
      { id: 'brochure', label: 'Brochure Template', prompt: `Design a tri-fold brochure template for {{brandName}} ({{specialty}}). Language: {{language}}.
Size: A4 folded to 99×210mm (3 panels each side). Outside panels: Front cover (logo + headline), Inside flap, Inner 3 panels (features/benefits), Back cover (contact + CTA).
Specs: Fold types (letter/C-fold/Z-fold/gate), Panel width calculations, Color bleed allowance (3mm), Typography per section.
Format as markdown.` },
      { id: 'annual_report', label: 'Annual Report Template', prompt: `Design an annual report branding template for {{brandName}} ({{specialty}}). Language: {{language}}.
Structure: Cover, CEO letter, Year highlights, Financial summary, Operations review, Future outlook, Corporate governance.
Design specs: Page size (A4 or 8.5×11), Binding method (saddle-stitch or perfect-bound), Data visualization style, Photography usage, Paper tier options (digital-only, standard print, premium print).
Format as markdown.` },
      { id: 'invoice', label: 'Invoice Template', prompt: `Design a branded invoice template for {{brandName}} ({{specialty}}). Language: {{language}}.
Layout: Header (logo, company info, invoice number/date), Bill to section, Line items table (description, qty, rate, amount), Subtotal/tax/total section, Payment terms, Footer.
Specs: Font sizes for readability, Color usage (keep printable), Print-friendly layout, Digital PDF version, QuickBooks/Xero compatibility notes.
Format as markdown.` },
      { id: 'signage', label: 'Signage Guidelines', prompt: `Create signage and environmental branding guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Types: Exterior (building sign, monument sign, window decal), Interior (reception, directional, office door), Wayfinding (hallway, floor numbers, restroom).
Each: size, material (acrylic, metal, vinyl, neon), color specs (PMS), illumination (backlit, frontlit, none), mounting instructions.
Format as markdown per type.` },
      { id: 'vehicle_wrap', label: 'Vehicle Wrap Design', prompt: `Design vehicle wrap branding specifications for {{brandName}} ({{specialty}}). Language: {{language}}.
Vehicle types: Sedan, SUV, Van, Truck, Trailer.
For each: Coverage area (full/partial/roof only/hood only), Logo placement, Typography sizing for readability, Color breakpoints, Contact info placement, Material (vinyl matte/gloss), Installation considerations.
Format as markdown.` },
      { id: 'uniform', label: 'Apparel Branding', prompt: `Create branded apparel/uniform guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Garment types: T-shirt, Polo, Hoodie, Jacket, Hat, Apron.
Each: Logo placement (left chest, center, sleeve), Embroidery vs screen print vs heat press, Color options (brand colors only vs neutral+accent), Garment color recommendations, Size range.
Format as markdown per garment.` },
      { id: 'trade_show', label: 'Trade Show Booth', prompt: `Design a trade show booth branding plan for {{brandName}} ({{specialty}}). Language: {{language}}.
Booth sizes: 10×10, 10×20, 20×20.
Elements: Back wall banner, Side headers, Table cover, Pop-up display, Brochure holder, Floor decal, Giveaway items.
Each: dimensions, artwork specs, material, assembly instructions. Lighting recommendations, Video display setup.
Format as markdown per size.` },
      { id: 'packaging', label: 'Product Packaging', prompt: `Design product packaging brand guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Packaging types: Primary (product container), Secondary (retail box), Tertiary (shipping box), Poly bag, Tissue paper, Stickers/seals.
Each: dimensions, material (cardboard, plastic, glass, fabric), Printing method (offset, flexo, digital), Color specs (PMS), Logo placement, Copy requirements, Sustainability notes.
Format as markdown per type.` },
    ]
  },
  {
    id: 'guidelines_manual', label: 'Brand Guidelines Manual', icon: '📘',
    tools: [
      { id: 'logo_usage', label: 'Logo Usage Rules', prompt: `Write the logo usage section of brand guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Clear space (minimum area around logo, formula based on logo height), Minimum size (print: 20mm, digital: 32px), Color variations (full color, single color, reversed, grayscale), Incorrect usage examples (8-10 don'ts), Background acceptability rules, Placement on photos.
Format as markdown.` },
      { id: 'color_usage_specs', label: 'Color Usage Specs', prompt: `Write the color section of brand guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Primary palette (HEX, RGB, CMYK, PMS, RAL per color), Secondary palette usage rules, Color hierarchy (primary > secondary > accent), Misuse examples, Gradient usage rules, Accessibility contrast specs, Color breakdown by channel (web vs print vs environmental).
Format as markdown.` },
      { id: 'typography_specs', label: 'Typography Specs', prompt: `Write the typography section of brand guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Primary typeface (specimen, weights available, licensing info), Secondary typeface, Fallback stacks (web + print), Type hierarchy with sizes, Allowed treatments (case, tracking, leading), Prohibited treatments, Type on color backgrounds, Web font loading spec.
Format as markdown.` },
      { id: 'photography_section', label: 'Photography Guide', prompt: `Write the photography section for {{brandName}} ({{specialty}}) brand guidelines. Language: {{language}}.
Cover: Image style (mood board description), Lighting direction, Color grading (temperature, saturation, curves), Subject composition, Model diversity requirements, Background treatment, Stock photo usage rules, Photo filter/overlay specs, Image sizing and cropping rules.
Format as markdown.` },
      { id: 'iconography_section', label: 'Iconography Guide', prompt: `Write the iconography section of brand guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Icon style (line/ filled/ duotone), Grid and sizing (24×24 standard), Padding and clear space, Color usage (single/brand/contextual), Stroke weight (1.5px/2px/2.5px), Corner radius, Naming conventions, Dos and don'ts.
Format as markdown.` },
      { id: 'layout_grids', label: 'Layout Grids', prompt: `Write the layout and grid systems section for {{brandName}} ({{specialty}}) brand guidelines. Language: {{language}}.
Grid types: Web (12-column responsive grid, gutter 20px), Print (A4 baseline grid, margin specifications), Social (1:1, 4:5, 9:16, 16:9 grid overlays).
Each: column count, gutter width, margin/padding rules, baseline grid for type alignment, breakpoint behavior. Format as markdown.` },
      { id: 'stationery_specs', label: 'Stationery Specs', prompt: `Write the stationery section of brand guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Items: Business card, Letterhead, Envelope (DL/C5/C4), Compliments slip, Presentation folder, Notepad, Sticker sheet.
Per item: dimensions, paper weight, printing method, color specs (PMS/CMYK), typography, layout diagram. Format as markdown per item.` },
      { id: 'digital_specs', label: 'Digital Specs', prompt: `Write the digital application specs for {{brandName}} ({{specialty}}) brand guidelines. Language: {{language}}.
Cover: Website (resolution, responsive behavior, color usage, typography), Email (HTML-safe colors, fallback fonts, mobile rendering), Social media (profile image size, cover photo size per platform, post template specs), Presentation template specs.
Format as markdown.` },
      { id: 'brand_assets', label: 'Brand Assets Package', prompt: `Create a brand assets delivery spec for {{brandName}} ({{specialty}}). Language: {{language}}.
Files to include: Logo files (AI, EPS, PDF, PNG, SVG per variant), Color palette files (ASE, CSS, SCSS), Font files (WOFF2, OTF, TTF), Templates (InDesign, PowerPoint, Canva, Figma), Guidelines PDF.
Folder structure recommendation, Naming convention, File format vs usage matrix. Format as markdown.` },
      { id: 'partner_cobranding', label: 'Co-Branding Rules', prompt: `Write co-branding and partner logo usage rules for {{brandName}} ({{specialty}}). Language: {{language}}.
Rules: Partner logo minimum size, Partner logo clear space, Partner logo color (full color vs grayscale), Logo lockups (side-by-side, stacked, grid), Logo sizing ratio (partner vs {{brandName}}), Prohibited lockups, Partner badge/endorsement seal.
Format as markdown with do/don't examples.` },
      { id: 'guidelines_versioning', label: 'Guidelines Versioning', prompt: `Create a brand guidelines version management system for {{brandName}} ({{specialty}}). Language: {{language}}.
Version scheme: v1.0 (initial), v1.1 (minor updates), v2.0 (major revision). Change log template, Approval workflow (update → review → approve → publish), Distribution methods (PDF, web portal, LMS), Review cadence (quarterly minor, annual major), Archive previous versions.
Format as markdown.` },
      { id: 'guidelines_distribution', label: 'Guidelines Distribution', prompt: `Plan brand guidelines distribution for {{brandName}} ({{specialty}}). Language: {{language}}.
Formats: PDF (print-ready, screen-optimized), Web portal (searchable, interactive), LMS (structured course), Brand asset DAM (downloadable files).
Audience segments: Internal team (full access), External agencies (brand + partner rules), Print vendors (technical specs only), Public (basic guidelines only).
Format as markdown.` },
    ]
  },
  {
    id: 'measurement', label: 'Brand Measurement & Intelligence', icon: '📊',
    tools: [
      { id: 'brand_health', label: 'Brand Health Score', prompt: `Define a brand health scorecard for {{brandName}} ({{specialty}}). Language: {{language}}.
Metrics: Awareness (unaided + aided), Consideration, Preference, Loyalty (repeat rate), Advocacy (NPS), Relevance, Differentiation, Trust.
Per metric: definition, measurement method, target score, data source, frequency. Composite health score formula. Format as markdown.` },
      { id: 'awareness_plan', label: 'Brand Awareness Plan', prompt: `Create a brand awareness measurement plan for {{brandName}} ({{specialty}}). Language: {{language}}.
Metrics: Unaided awareness (top-of-mind), Aided awareness (recognition), Brand recall, Brand recognition, Share of voice (SOV).
Methods: Surveys (sample size, frequency), Social listening, Search volume trends, Media impressions tracking. Targets: 3/6/12-month goals. Format as markdown.` },
      { id: 'nps_survey', label: 'NPS Survey Template', prompt: `Create a brand NPS survey template for {{brandName}} ({{specialty}}). Language: {{language}}.
Core question: "How likely are you to recommend {{brandName}} to a friend/colleague?" (0-10 scale).
Follow-up: Open-ended "Why?" for promoters (9-10) and detractors (0-6). Segments: by customer type, product line, region. Analysis template: NPS calculation, trend tracking, verbatim analysis, action planning.
Format as markdown.` },
      { id: 'recall_test', label: 'Brand Recall Test', prompt: `Design a brand recall testing methodology for {{brandName}} ({{specialty}}). Language: {{language}}.
Test types: Unaided recall ("Name brands in this category"), Aided recall ("Have you heard of {{brandName}}?"), Top-of-mind ("First brand that comes to mind").
Sample design: N=200 per segment, Online survey format, Frequency (quarterly), Analysis framework, Benchmark comparisons. Format as markdown.` },
      { id: 'sentiment_analysis', label: 'Sentiment Analysis', prompt: `Create a brand sentiment analysis framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Data sources: Social media (Twitter, Instagram, FB, TikTok, LinkedIn), Review platforms (G2, Capterra, Trustpilot, Google Reviews), News mentions, Support tickets, Survey verbatims.
Metrics: Sentiment ratio (positive/neutral/negative), Volume trends, Top topics per sentiment, Emotional drivers, Competitor comparison.
Format as markdown.` },
      { id: 'share_of_voice', label: 'Share of Voice', prompt: `Define a Share of Voice measurement framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Channels: Paid media (ad impressions), Earned media (mentions), Owned media (website traffic, social followers).
Competitors to track: Top 5. Metrics: SOV % per channel, Trend (monthly), Share of engagement, Share of spend. Visualization: stacked area chart description. Format as markdown.` },
      { id: 'brand_equity', label: 'Brand Equity Model', prompt: `Build a brand equity measurement framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Model: Keller's CBBE (Customer-Based Brand Equity) — 4 levels: Identity (who are you?), Meaning (what are you?), Response (what about you?), Relationships (what about us?).
Per level: metrics, measurement methods, current assessment, target state, gap analysis. Overall Brand Equity Index formula. Format as markdown.` },
      { id: 'perception_map', label: 'Customer Perception Map', prompt: `Create a brand perception mapping framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Dimensions to map: X-axis (Traditional ↔ Innovative), Y-axis (Affordable ↔ Premium).
Map: {{brandName}} vs 5 competitors plotted. Attributes to evaluate: Quality, Value, Trust, Innovation, Service. Data collection: survey with 7-point Likert scales. Visualization: 2D perceptual map description.
Format as markdown.` },
      { id: 'reputation_mgmt', label: 'Reputation Management', prompt: `Create a brand reputation management plan for {{brandName}} ({{specialty}}). Language: {{language}}.
Monitoring: Alert setup for brand mentions, Review response protocol (24h SLA), Crisis threshold definitions, Escalation chain.
Proactive: Content strategy for positive SEO, Thought leadership program, Community engagement calendar, CSR communication plan.
Format as markdown.` },
      { id: 'brand_tracking', label: 'Brand Tracking Dashboard', prompt: `Design a brand tracking dashboard for {{brandName}} ({{specialty}}). Language: {{language}}.
Dashboard sections: Awareness metrics (line chart, monthly), Sentiment trend (area chart), NPS score (gauge), SOV comparison (bar chart), Brand health composite (scorecard).
KPIs: 10 key metrics with targets, RAG status (red/amber/green), Period-over-period change, Data sources, Refresh frequency. Format as markdown.` },
      { id: 'competitor_score', label: 'Competitor Brand Score', prompt: `Create a competitive brand scoring model for {{brandName}} ({{specialty}}). Language: {{language}}.
Score categories: Brand awareness (20 pts), Brand perception (20 pts), Digital presence (20 pts), Customer loyalty (20 pts), Market share (20 pts).
Score 5 competitors + {{brandName}} in each category. Total scores out of 100. Gap analysis: where {{brandName}} leads/lags. Action priorities based on gap size. Format as markdown table.` },
      { id: 'brand_roi', label: 'Brand ROI', prompt: `Calculate brand ROI framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Inputs: Brand building investment (advertising, events, content, sponsorship, design), Brand equity value (premium pricing power, customer acquisition cost reduction, retention rate improvement, talent attraction).
Formula: Brand ROI = (Brand-Driven Revenue Growth - Brand Investment) / Brand Investment × 100. 5-year projection model. Format as markdown with formulas.` },
    ]
  },
  {
    id: 'expansion_architecture', label: 'Brand Expansion & Architecture', icon: '🏗️',
    tools: [
      { id: 'subbrand_creator', label: 'Sub-Brand Creator', prompt: `Design a sub-brand naming and identity framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Sub-brand types: Product line sub-brand, Target segment sub-brand, Premium/Value tier sub-brand, Geographic sub-brand.
Each: Relationship to master brand (endorsed vs standalone), Naming convention, Visual identity differences, How much master brand equity transfers.
Format as markdown.` },
      { id: 'branded_house', label: 'Branded House Strategy', prompt: `Develop a Branded House brand architecture strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Strategy: Single master brand across all products/services. Approach: {{brandName}} [Product Name] format.
Examples: Google (Google Drive, Google Maps, Google Docs). Benefits: unified equity, lower marketing cost. Risks: brand dilution, failure contagion.
Framework: naming convention, visual consistency rules, product portfolio map. Format as markdown.` },
      { id: 'house_of_brands', label: 'House of Brands Strategy', prompt: `Develop a House of Brands architecture for {{brandName}} ({{specialty}}). Language: {{language}}.
Strategy: Independent brand names per product/segment. Parent company may be invisible. Examples: Procter & Gamble (Tide, Pampers, Gillette).
When to use: diverse segments, premium vs mass, acquisition integration. Framework: brand portfolio map, target audience per brand, shared services model.
Format as markdown.` },
      { id: 'endorsed_brand', label: 'Endorsed Brand Strategy', prompt: `Design an endorsed brand architecture for {{brandName}} ({{specialty}}). Language: {{language}}.
Endorsement levels: Strong endorsement ("{{brandName}}'s [ProductName]"), Linked endorsement ([ProductName] by {{brandName}}), Token endorsement (small "part of {{brandName}} group").
Framework: endorsement type per product line, visual endorsement rules (logo lockup, sizing, placement), Brand equity transfer mechanics.
Format as markdown.` },
      { id: 'cobranding', label: 'Co-Branding Strategy', prompt: `Create a co-branding strategy framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Co-branding types: Ingredient (Intel Inside), Composite (co-created product), Complementary (Starbucks + Spotify), Joint promotion, Event sponsorship.
Partner criteria checklist (5 criteria, 1-10 scoring), Agreement template, Visual identity lockup rules, Exit clause considerations.
Format as markdown.` },
      { id: 'private_label', label: 'Private Label Strategy', prompt: `Develop a private label/white label brand strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Strategy: Product selection (which products to white label), Partner qualifications, Branding requirements (minimum logo size, packaging standards), Quality control, Pricing and margin targets, Exit strategy.
Format as markdown.` },
      { id: 'geo_expansion', label: 'Geographic Expansion Branding', prompt: `Create a geographic brand expansion strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Target markets: [ hypothetical: US, UK, Germany, UAE, Japan, Brazil, India ].
Per market: Brand name localization (translation vs transliteration vs new name), Visual adaptation (cultural color meanings), Positioning adjustment, Legal trademark check, Competitor landscape.
Format as markdown per market.` },
      { id: 'product_line', label: 'Product Line Extension', prompt: `Create a product line brand extension strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Extension types: Flanker brand (same category, different segment), Category extension (new category), Premium tier, Value tier.
Per extension: Brand fit score (1-10), Cannibalization risk, New audience reach, Investment required, Naming recommendation. Format as markdown table.` },
      { id: 'licensing', label: 'Brand Licensing', prompt: `Create a brand licensing framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Licensing types: Character/logo licensing, Brand extension licensing (apparel, accessories), Co-branding licenses, Franchise model.
Framework: Licensee qualifications, Royalty rate benchmarks (5-15% depending on category), Quality control process, Brand usage guidelines for licensees, Contract terms (minimum 2-year), Termination clauses.
Format as markdown.` },
      { id: 'acquisition_integration', label: 'Acquisition Integration', prompt: `Create a brand integration playbook for {{brandName}} ({{specialty}}) acquiring another brand. Language: {{language}}.
Integration options: Keep brand independent, Use as sub-brand, Absorb into master brand, Sunset brand entirely.
Timeline: Month 1-3 (assessment), Month 3-6 (strategy decision), Month 6-12 (implementation).
Risk: customer churn, employee morale, brand equity loss. Mitigation strategies. Format as markdown.` },
      { id: 'employer_brand', label: 'Employer Brand', prompt: `Create an employer branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
EVP (Employee Value Proposition): 5 key promises to employees.
Tactics: Careers page branding, Job description template, Interview experience, Onboarding brand immersion, Internal brand advocacy program, Glassdoor/Indeed management.
Metrics: application volume, offer acceptance rate, employee NPS, retention rate. Format as markdown.` },
      { id: 'community_brand', label: 'Brand Community Strategy', prompt: `Design a brand community strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Community types: User group, Fan club, Ambassador program, Customer advisory board, Online forum/group.
Platform: Discord, Slack, Facebook Group, Circle, Discourse, Custom platform.
Launch plan: Founding members (50-100 invite-only), Content cadence (3x weekly), Community guidelines, Moderation team, Growth milestones (100/500/1000/5000 members). Format as markdown.` },
    ]
  },
  {
    id: 'industry_specific', label: 'Industry-Specific Branding', icon: '🏭',
    tools: [
      { id: 'luxury_brand', label: 'Luxury Brand Tactics', prompt: `Create a luxury branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Scarcity (limited editions, waitlists), Exclusivity (by invitation only, membership), Heritage (craftsmanship storytelling), Sensory experience (materials, sound, scent), White space (minimalist design), Premium pricing psychology.
Tactics: Packaging as theater, VIP events, Brand museum/heritage site, Concierge-level service. Format as markdown.` },
      { id: 'dtc_brand', label: 'DTC Brand Strategy', prompt: `Create a direct-to-consumer branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Digital-first identity, Community-driven, Subscription/repeat model, Unboxing experience, Social proof engine, Influencer co-creation.
Tactics: Referral program design, Loyalty rewards structure, Subscription box branding, SMS/email relationship building, User-generated content strategy. Format as markdown.` },
      { id: 'b2b_brand', label: 'B2B Brand Strategy', prompt: `Create a B2B branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Trust signals (certifications, case studies, testimonials), Thought leadership (white papers, speaking, awards), Professional tone, Relationship-based messaging, ROI-focused copy.
Tactics: LinkedIn presence strategy, Industry event branding, Sales enablement materials branding, Partner co-marketing, Account-based marketing approach. Format as markdown.` },
      { id: 'saas_brand', label: 'SaaS Brand Strategy', prompt: `Create a SaaS branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Product-led growth, Freemium/free trial branding, In-app experience, Onboarding flow, Feature adoption through design, Community-driven education.
Tactics: Dashboard branding, Error message voice, Empty state design, Email lifecycle branding, Social proof (in-app testimonials, usage stats), Churn reduction through brand connection.
Format as markdown.` },
      { id: 'retail_brand', label: 'Retail Brand Strategy', prompt: `Create a retail/hospitality branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: In-store experience design, Sensory branding (music, scent, lighting), Staff as brand ambassadors, Store layout psychology, Window display strategy, Point-of-sale materials.
Tactics: Music playlist guidelines, Fragrance/scent strategy, Uniform design, Store format variations (flagship, boutique, outlet), Visual merchandising rules.
Format as markdown.` },
      { id: 'hospitality_brand', label: 'Hospitality Brand Strategy', prompt: `Create a hospitality/experience branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Service as brand moment, Atmosphere design, Guest journey mapping, Welcome ritual, Surprise & delight moments, Review generation.
Tactics: Check-in experience, Room design guide, F&B brand alignment, Amenities branding, Loyalty program design, Post-stay follow-up sequence.
Format as markdown.` },
      { id: 'healthcare_brand', label: 'Healthcare Brand Strategy', prompt: `Create a healthcare/wellness branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Trust and credibility above all, Empathy in communication, Clean/clinical aesthetic, Regulatory compliance awareness, Patient-centered language, Accessibility-first.
Tactics: Doctor/specialist profile branding, Patient education materials, Waiting room experience, Telehealth interface branding, HIPAA-compliant design notes.
Format as markdown.` },
      { id: 'nonprofit_brand', label: 'Non-Profit Brand Strategy', prompt: `Create a non-profit/social impact branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Mission-first messaging, Transparency and trust, Emotional storytelling, Community-centered design, Impact visualization, Donor recognition.
Tactics: Donation page optimization, Impact report design, Volunteer brand experience, Campaign identity system, Grant proposal template branding, Partnership co-branding rules.
Format as markdown.` },
      { id: 'tech_brand', label: 'Technology Brand Strategy', prompt: `Create a technology/innovation branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Innovation-forward, Clean/modern aesthetic, Complex → simple translation, Authority through clarity, Future-focused, Developer/technical community.
Tactics: Product launch identity system, Documentation branding, API portal design, Developer merch, Hackathon/event branding, Open source community guidelines.
Format as markdown.` },
      { id: 'fashion_brand', label: 'Fashion Brand Strategy', prompt: `Create a fashion/lifestyle branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Visual-first identity, Seasonal collection rhythm, Trend awareness with timelessness, Aspirational lifestyle imagery, Exclusivity and scarcity.
Tactics: Lookbook design spec, Runway/show presentation, Look/collection naming system, Collaborations framework (artist, designer, brand), Pop-up/store design language.
Format as markdown.` },
      { id: 'food_brand', label: 'Food & Beverage Strategy', prompt: `Create a food & beverage branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Appetite appeal (visual hunger), Ingredient-forward, Transparency, Sensory experience, Cultural authenticity, Sustainability communication.
Tactics: Packaging as content (Instagrammable), Menu design, Nutritional communication (icon system), Origin storytelling, Seasonal/holiday special edition branding.
Format as markdown.` },
      { id: 'real_estate', label: 'Real Estate Brand Strategy', prompt: `Create a real estate branding strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Principles: Location storytelling, Lifestyle visualization, Trust and professionalism, Architectural appreciation, Investment confidence.
Tactics: Project naming system, Sales gallery branding, Brochure design (per property type), Signage (construction, directional, sold), Model apartment styling guide, Agent brand kit.
Format as markdown.` },
    ]
  },
];

export function BrandTools({ project, setProject, brandName, specialty, audience, voice, language, aiConfig }: {
  project: BrandingStudioProject;
  setProject: (f: (prev: BrandingStudioProject) => BrandingStudioProject) => void;
  brandName: string;
  specialty: string;
  audience: string;
  voice: string;
  language: string;
  aiConfig: { provider: string; modelId: string; externalServiceConfig?: ExternalServiceConfig };
}) {
  const [loadingTool, setLoadingTool] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [toolProvider, setToolProvider] = useState<{ provider: string; modelId: string; externalServiceConfig?: ExternalServiceConfig } | null>(null);
  const { toast } = useToast();

  const section = project.brandToolsSection || SECTIONS[0].id;
  const tool = project.brandToolsSubTab || '';
  const results = project.brandToolsResults || {};

  const setSection = (s: string) => setProject(p => ({ ...p, brandToolsSection: s, brandToolsSubTab: '', brandToolsError: null }));
  const setTool = (t: string) => setProject(p => ({ ...p, brandToolsSubTab: t, brandToolsError: null }));

  const currentSection = SECTIONS.find(s => s.id === section) || SECTIONS[0];
  const currentTool = currentSection.tools.find(t => t.id === tool);

  const handleGenerate = async (t: ToolDef) => {
    setLoadingTool(t.id);
    setProject(p => ({ ...p, brandToolsError: null }));
    try {
      const { call } = createAICall('brand_' + t.id);
      const prompt = t.prompt
        .replace(/\{\{brandName\}\}/g, brandName)
        .replace(/\{\{specialty\}\}/g, specialty)
        .replace(/\{\{audience\}\}/g, audience)
        .replace(/\{\{voice\}\}/g, voice)
        .replace(/\{\{language\}\}/g, language === 'ar' ? 'Arabic' : 'English');
      const override = toolProvider || aiConfig;
      const isCustom = override.provider === 'custom';
      const result = await call(prompt, {
        provider: isCustom ? 'custom' : override.provider as 'google' | 'openai' | 'anthropic',
        modelId: override.modelId,
        ...(isCustom ? { externalServiceConfig: override.externalServiceConfig } : { fallbackProviders: ['google', 'openai', 'anthropic'].filter(p => p !== override.provider) as ('google' | 'openai' | 'anthropic')[] }),
      });
      setProject(p => ({ ...p, brandToolsResults: { ...(p.brandToolsResults || {}), [t.id]: result }, brandToolsSubTab: t.id }));
      toast({ type: 'success', title: `${t.label} generated` });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setProject(p => ({ ...p, brandToolsError: err.message || 'Generation failed' }));
        toast({ type: 'error', title: `${t.label} failed`, message: err.message });
      }
    } finally {
      setLoadingTool(null);
    }
  };

  const handleCopyTool = (toolId: string) => {
    const text = results[toolId];
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIdx(toolId);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleDownloadTool = (toolId: string) => {
    const text = results[toolId];
    if (!text) return;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Section tabs */}
      <div className="flex gap-1.5 p-1.5 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto mb-8 suggestions-scrollbar">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${section === s.id ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: tool pills */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex flex-wrap gap-2">
            {currentSection.tools.map(t => {
              const isActive = tool === t.id;
              const hasResult = !!results[t.id];
              const isLoading = loadingTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (!isActive) setTool(t.id);
                    if (hasResult && isActive) handleCopyTool(t.id);
                  }}
                  className={`group relative flex-1 min-w-[140px] px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border text-left ${isActive ? 'bg-white/10 border-white/30 text-white shadow-inner' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white/60'}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{t.label}</span>
                    {hasResult && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                  </div>
                  {isLoading && <Loader2 className="w-3 h-3 animate-spin absolute top-2 right-2 text-[var(--color-accent)]" />}
                </button>
              );
            })}
          </div>

          {currentTool && (
            <div className="space-y-4">
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
                <p className="text-[10px] text-blue-300 font-bold leading-relaxed">
                  Generates detailed brand strategy, guidelines, and recommendations.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerate(currentTool)}
                  disabled={loadingTool !== null}
                  className="flex-1 bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-black py-3 rounded-2xl transition-all text-[10px] uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {loadingTool === currentTool.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {loadingTool === currentTool.id ? 'Generating...' : 'Generate'}
                </button>

                <MiniAISelector
                  provider={toolProvider?.provider || aiConfig.provider}
                  modelId={toolProvider?.modelId || aiConfig.modelId}
                  externalServiceConfig={toolProvider?.externalServiceConfig || aiConfig.externalServiceConfig}
                  onChange={(p, m, esc) => setToolProvider({ provider: p, modelId: m, externalServiceConfig: esc })}
                />

                {results[currentTool.id] && (
                  <button
                    onClick={() => handleDownloadTool(currentTool.id)}
                    className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all"
                    title="Download as Markdown"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {project.brandToolsError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <p className="text-[11px] text-red-400 font-bold">{project.brandToolsError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: result */}
        <div className="lg:col-span-7 space-y-4">
          {tool && results[tool] ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden group">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest">{currentTool?.label || tool}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCopyTool(tool)} className="p-2 rounded-xl hover:bg-white/10 transition-all" title="Copy">
                    {copiedIdx === tool ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                  </button>
                  <button onClick={() => handleDownloadTool(tool)} className="p-2 rounded-xl hover:bg-white/10 transition-all" title="Download">
                    <Download className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              </div>
              <div className="p-6 suggestions-scrollbar overflow-y-auto max-h-[600px]">
                <div className="prose prose-invert max-w-none text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-medium">
                  {results[tool]}
                </div>
              </div>
            </div>
          ) : loadingTool ? (
            <div className="bg-white/5 rounded-3xl p-16 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--color-accent)]" />
                <span className="text-xs text-white/30 font-bold uppercase tracking-widest">Generating...</span>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-3xl p-16 text-center">
              <FileText className="w-10 h-10 text-white/10 mx-auto mb-4" />
              <p className="text-[11px] text-white/20 font-bold uppercase tracking-widest">Select a tool and generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
