import { useState, useRef } from 'react';
import { createAICall } from '../lib/ai';
import { Sparkles, Copy, Check, Loader2, FileText, Download } from 'lucide-react';
import { useToast } from '../lib/useToast';
import { MiniAISelector } from './MiniAISelector';
import type { MarketingStudioProject } from '../types';

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
    id: 'content_copy', label: 'Content & Copy', icon: '✏️',
    tools: [
      { id: 'headline_tester', label: 'Headline Tester', prompt: `Generate 10 headline variants for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Include: headline, predicted CTR (Low/Med/High), emotional trigger, reason it works. Format as markdown table.` },
      { id: 'short_scripts', label: 'Short-form Scripts', prompt: `Write short-form video scripts for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create 3 scripts: 15 seconds (hook + quick payoff), 30 seconds (hook + problem + solution), 60 seconds (hook + story + benefit + CTA). Each: duration, hook line, full script, suggested visual notes. Format as markdown.` },
      { id: 'sms_sequences', label: 'SMS Sequences', prompt: `Write a 5-message SMS marketing sequence for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Day 1: Welcome + intro offer. Day 2: Value tip. Day 3: Social proof. Day 4: Limited-time offer. Day 5: Final call + next steps.
Each: day label, message body (≤160 chars), goal of message. Format as markdown table.` },
      { id: 'landing_copy', label: 'Landing Page Copy', prompt: `Write complete landing page copy for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Sections: Hero headline + subheadline, Key benefits (3-5 bullets with brief explanation), Social proof snippet, CTA button copy (3 variants), FAQ (3 questions).
Format as structured markdown per section.` },
      { id: 'multi_language', label: 'Multi-language Translate', prompt: `Take this copy for {{brandName}} ({{specialty}}) and adapt it for 5 languages while preserving brand tone. Goal: {{goal}}.
Original: "{{brief}}"
Languages: Arabic (formal), Spanish (LATAM casual), French (European), German, Japanese.
For each: translated version, back-translation to English, cultural adaptation notes. Format as markdown per language.` },
      { id: 'email_copy', label: 'Email Copy Generator', prompt: `Write 3 email copy variants for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Variants: Promotional (new product/offer), Educational (value-driven), Re-engagement (win-back).
Each: subject line (≤60 chars), preview text (≤100 chars), body (200-300 words), CTA button text. Format as markdown per variant.` },
      { id: 'blog_outliner', label: 'Blog Post Outliner', prompt: `Create 5 SEO-optimized blog post outlines for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Each outline: Working title (with keyword), meta description (≤160 chars), H2/H3 outline with key points per section, suggested word count, internal link targets, target reader persona.
Format as markdown per outline.` },
      { id: 'ad_copy_ab', label: 'Ad Copy A/B Tester', prompt: `Generate 10 A/B ad copy pairs for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Pairs cover: Benefit vs feature, Emotional vs logical, Short vs long, Urgency vs social proof, Question vs statement.
Each pair: Variant A, Variant B, predicted better performer, rationale. Format as markdown table.` },
      { id: 'product_desc', label: 'Product Description Generator', prompt: `Write product descriptions for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create 5 product descriptions: Short (50 words), Standard (150 words), Detailed (300 words), Bullet-point feature list, SEO-optimized (with schema-ready format).
Each: title, description, key features, sensory language, target keyword. Format as markdown.` },
      { id: 'ugc_scripts', label: 'UGC Script Writer', prompt: `Write 5 User-Generated Content briefs for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Brief types: Unboxing/review, Tutorial/how-to, Before/after transformation, Day in the life, Testimonial.
Each: concept/logline, key talking points (3-5), visual directions, suggested duration, hook suggestion. Format as markdown per brief.` },
      { id: 'press_release', label: 'Press Release', prompt: `Write a press release for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Use this context: {{brief}}
Structure: Headline (bold, news-worthy), Dateline, Lead paragraph (who/what/when/where/why), Body (details + quote from leadership), Boilerplate (about the company), Media contact info, ### marker.
Format as complete press release in markdown.` },
      { id: 'repurpose', label: 'Repurpose Engine', prompt: `Take this content and repurpose it into 8 formats for {{brandName}} ({{specialty}}). Language: {{language}}.
Original content: "{{brief}}"
Formats: Twitter/X thread (5 tweets), LinkedIn post, Instagram caption, TikTok script (30s), Email newsletter blurb, Blog post summary, Infographic outline, Podcast episode outline.
Each: format label, repurposed content, platform-specific formatting notes. Format as markdown per format.` },
    ]
  },
  {
    id: 'search_seo', label: 'Search & SEO', icon: '🔍',
    tools: [
      { id: 'keyword_research', label: 'Keyword Research', prompt: `Generate a keyword research report for {{brandName}} in {{specialty}}. Goal: {{goal}}. Brief: {{brief}}. Language: {{language}}.
Include: 15 high-intent keywords with search volume estimates (Low/Med/High), difficulty score (Low/Med/High), and search intent (Informational/Navigational/Transactional/Commercial).
Group by topic cluster. Format as a structured markdown table.` },
      { id: 'content_gap', label: 'Content Gap Analysis', prompt: `Analyze content gaps for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Identify 10 content topics competitors rank for that we don't have. For each: topic, competitor example, our angle, content format recommendation, and target keyword.
Output as a structured markdown table.` },
      { id: 'serp_preview', label: 'SERP Preview', prompt: `Create a SERP preview simulation for {{brandName}} ({{specialty}}). Language: {{language}}.
For 5 key pages (Homepage, Product/Service page, Blog, Landing page, About): show how the title tag and meta description should appear in Google search results.
Include clickability notes. Format as markdown with each preview in a code block.` },
      { id: 'meta_generator', label: 'Meta Tag Generator', prompt: `Generate optimized meta tags for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
For each of 8 pages: Page name, Title tag (≤60 chars), Meta description (≤160 chars), Focus keyword.
Format as a markdown table.` },
      { id: 'schema_builder', label: 'Schema Builder', prompt: `Create Schema.org structured data recommendations for {{brandName}} ({{specialty}}). Language: {{language}}.
Include: schema type, JSON-LD example code, which pages to implement on, and expected SEO benefit.
Cover: Organization, WebSite, Article, Product, FAQ, LocalBusiness, Review, BreadcrumbList.
Output as markdown with code blocks.` },
      { id: 'link_optimizer', label: 'Internal Link Optimizer', prompt: `Design an internal linking strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Include: pillar page structure (1 main + 5-8 cluster topics), link distribution strategy, anchor text optimization tips, and a visual sitemap (text-based).
Output as structured markdown.` },
      { id: 'seo_brief', label: 'SEO Content Brief', prompt: `Write an SEO-optimized content brief for a new article for {{brandName}} in {{specialty}}. Goal: {{goal}}. Language: {{language}}.
Include: Working title, Target keyword, Related keywords (5-8), Search intent, Outline with H2/H3, Word count target, Internal links to include, External authority links.
Format as a detailed markdown brief.` },
      { id: 'rank_tracker', label: 'Rank Tracker Setup', prompt: `Create a rank tracking setup plan for {{brandName}} ({{specialty}}). Language: {{language}}.
List 20 priority keywords to track, grouped by: Head terms (3-5), Body terms (5-7), Long-tail (8-10).
For each: current assumed position (Not ranked/Top 100/Top 50/Top 10), optimization priority (High/Med/Low).
Format as markdown table.` },
      { id: 'topic_clusters', label: 'Topic Cluster Planner', prompt: `Design a topic cluster strategy for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Define 3-5 pillar topics with 5-8 cluster content pieces each. For each cluster piece: title, format (blog/video/infographic), keyword target, internal link target.
Output as a structured markdown hierarchy.` },
      { id: 'voice_search', label: 'Voice Search Optimizer', prompt: `Optimize {{brandName}} ({{specialty}}) for voice search. Language: {{language}}.
Generate 10 conversational long-tail queries people would ask voice assistants. For each: query, answer snippet, page to optimize, structured data recommendation.
Output as markdown table.` },
      { id: 'featured_snippet', label: 'Featured Snippet Tool', prompt: `Create featured snippet optimization strategies for {{brandName}} ({{specialty}}). Language: {{language}}.
Identify 8 "People Also Ask" questions in the niche. For each: question, answer (40-50 words for snippet), page to target, snippet type (paragraph/list/table).
Format as markdown.` },
      { id: 'mobile_seo', label: 'Mobile SEO Checker', prompt: `Audit mobile SEO readiness for {{brandName}} ({{specialty}}). Language: {{language}}.
Checklist covering: Core Web Vitals targets, viewport/responsive design, tap target sizing, font legibility, mobile page speed, AMP/instant pages, mobile-first indexing signals.
Output as a checklist in markdown with pass/fail criteria per item.` },
    ]
  },
  {
    id: 'social_media', label: 'Social Media + Community', icon: '📱',
    tools: [
      { id: 'post_scheduler', label: 'Post Scheduler', prompt: `Create a 2-week social media content calendar for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Include 14 posts (daily) across Instagram, TikTok, LinkedIn, Twitter/X. For each: platform, day, content concept, format (image/video/carousel/text), caption hook (under 150 chars), hashtags (5), best posting time.
Format as markdown table.` },
      { id: 'engagement_analyzer', label: 'Engagement Analyzer', prompt: `Analyze and recommend engagement optimization for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Provide: 5 content types that drive highest engagement in {{specialty}}, optimal posting frequency per platform, engagement rate benchmarks, 10 hook templates, 5 call-to-action variants, reply/comment engagement templates.
Output as structured markdown.` },
      { id: 'community_guidelines', label: 'Community Guidelines', prompt: `Write comprehensive community guidelines for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Welcome message, code of conduct (dos/don'ts), moderation policy, comment removal criteria, ban policy, appeals process, tone and voice expectations.
Format as a ready-to-post markdown document.` },
      { id: 'hashtag_research', label: 'Hashtag Research', prompt: `Generate a hashtag strategy for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Provide 10 sets of 5 hashtags each (50 total) organized by: Broad reach (500K+ posts), Medium (50-500K), Niche (<50K), Branded, Campaign-specific.
For each set: total estimated reach, recommendation. Format as markdown.` },
      { id: 'social_listening', label: 'Social Listening', prompt: `Create a social listening framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: 10 brand keywords to monitor, 5 competitor accounts, 5 industry hashtags, sentiment tracking categories, alert triggers, weekly report template, response protocol.
Output as structured markdown.` },
      { id: 'ugc_campaign', label: 'UGC Campaign Builder', prompt: `Design a User-Generated Content campaign for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Include: Campaign name, hashtag, prompt/theme, submission guidelines, incentive structure, content rights agreement template, curation process, featured content schedule.
Format as detailed markdown.` },
      { id: 'influencer_outreach', label: 'Influencer Outreach', prompt: `Create influencer outreach templates for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Write 5 email templates: Cold outreach (nano), Cold outreach (macro), Collaboration proposal, Follow-up, Sponsorship agreement summary.
Each template: subject line (≤60 chars), body, personalization tips. Format as markdown.` },
      { id: 'content_pillars', label: 'Content Pillar Planner', prompt: `Design 5 content pillars for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
For each pillar: name/topic, target audience segment, 10 content ideas, format mix (reel/post/story/article), KPIs.
Output as structured markdown.` },
      { id: 'platform_optimizer', label: 'Platform Optimizer', prompt: `Optimize {{brandName}} social profiles across platforms. Specialty: {{specialty}}. Language: {{language}}.
For each (Instagram, TikTok, LinkedIn, Twitter/X, YouTube): profile bio (150-char version), link in bio strategy, cover/image specs, content mix ratio (entertain/educate/promote), posting cadence.
Format as markdown per platform.` },
      { id: 'viral_challenge', label: 'Viral Challenge Creator', prompt: `Create a viral challenge concept for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Include: Challenge name, hook/theme, participation rules, format (dance/transition/duet/etc.), launch strategy, seeding influencer list (5-10), hashtag system, predicted virality mechanics.
Output as detailed markdown.` },
      { id: 'social_calendar_sync', label: 'Social Calendar Sync', prompt: `Build an integrated social media calendar strategy for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Cover: Monthly thematic pillars, cross-platform content repurposing map, holiday/event alignment, product launch integration, content recycling schedule, approval workflow.
Format as markdown system document.` },
      { id: 'cross_platform_reposter', label: 'Cross-Platform Reposter', prompt: `Design a cross-platform content repurposing system for {{brandName}} ({{specialty}}). Language: {{language}}.
Show how one long-form piece becomes: 5 social posts, 3 stories, 1 carousel, 1 short video, 1 newsletter blurb. Include format adaptation notes per platform.
Output as a conversion map in markdown.` },
    ]
  },
  {
    id: 'email_marketing', label: 'Email Marketing', icon: '✉️',
    tools: [
      { id: 'welcome_sequence', label: 'Welcome Sequence', prompt: `Write a 5-email welcome sequence for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
For each email: Subject line (≤60 chars), Preview text (≤100 chars), Email body (200-300 words), CTA button text, Send delay (minutes/hours/day after signup).
Format as structured markdown for each email.` },
      { id: 'abandoned_cart', label: 'Abandoned Cart Flow', prompt: `Create a 3-email abandoned cart recovery sequence for {{brandName}} ({{specialty}}). Language: {{language}}.
Email 1 (1 hr): Reminder + product benefits. Email 2 (24 hrs): Social proof + urgency. Email 3 (72 hrs): Discount/incentive.
Each: subject line, preview text, body, CTA. Format as markdown.` },
      { id: 'newsletter_template', label: 'Newsletter Template', prompt: `Design a newsletter template strategy for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create 4 newsletter issue templates: Educational, Promotional, Curated, Community update. Each: subject line formula, section structure, content mix ratio, image requirements, CTA placement.
Format as reusable markdown templates.` },
      { id: 'segmentation_rules', label: 'Segmentation Rules', prompt: `Define email segmentation strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Create 8 segments: New subscribers, Engaged (opened last 30d), At-risk (not opened 60d), Purchased once, Repeat buyers, High-value (top 20%), Cart abandoners, Inactive (90d+).
For each: segment criteria, re-engagement strategy, email frequency, content personalization rules. Output as markdown.` },
      { id: 'subject_line_tester', label: 'Subject Line A/B Tester', prompt: `Generate 20 A/B subject line pairs for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Each pair: variant A (benefit-driven), variant B (curiosity-driven). Categorized by: Welcome, Promo, Educational, Event, Re-engagement, Transactional, Seasonal, Urgency.
Format as markdown table with expected open rate impact (Low/Med/High).` },
      { id: 'send_time_optimizer', label: 'Send Time Optimizer', prompt: `Create an email send time optimization strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Provide: Best sending times for each day of week, timezone mapping strategy, optimal frequency per segment, re-engagement send patterns, A/B testing framework for send time.
Output as structured markdown.` },
      { id: 'reengagement', label: 'Re-engagement Campaign', prompt: `Write a 3-email re-engagement campaign for inactive subscribers of {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Email 1: "We miss you" + what's new. Email 2: Feedback request + incentive. Email 3: Final notice.
Each: subject line, preview text, body, CTA. Include unsubscribe flow recommendation. Format as markdown.` },
      { id: 'milestone_automation', label: 'Milestone Automation', prompt: `Design milestone-based email automations for {{brandName}} ({{specialty}}). Language: {{language}}.
Create triggers for: Birthday/anniversary, Loyalty tier upgrade, Purchase anniversary, Content milestone (100th blog), Referral goal reached.
Each: trigger, email concept, reward/incentive idea. Format as markdown table.` },
      { id: 'email_preview', label: 'Email Preview Tool', prompt: `Create email rendering preview notes for {{brandName}} ({{specialty}}). Language: {{language}}.
Checklist for: Desktop rendering, Mobile rendering (320px, 375px, 414px), Dark mode, Gmail/Outlook/Apple Mail/ProtonMail, Accessibility (screen reader, contrast, font size).
Plus 5 pre-built mobile-optimized email templates. Format as markdown.` },
      { id: 'spam_checker', label: 'Spam Score Checker', prompt: `Audit email deliverability for {{brandName}} ({{specialty}}). Language: {{language}}.
Checklist: SPF/DKIM/DMARC setup, Sender score, Domain warming plan, Spam trigger words to avoid (list 30), Image-to-text ratio best practices, Link safety, Authentication setup guide.
Format as actionable markdown guide.` },
      { id: 'unsubscribe_flow', label: 'Unsubscribe Flow', prompt: `Design a positive unsubscribe/opt-down flow for {{brandName}} ({{specialty}}). Language: {{language}}.
Include: 3-option preference center (reduce frequency / change topics / unsubscribe), Feedback form, "Thank you" page copy, Re-engagement win-back offer for opt-down, Confirmation email template.
Output as markdown.` },
      { id: 'forward_to_friend', label: 'Forward-to-Friend', prompt: `Create a viral "Forward to Friend" strategy for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Include: Forward CTA placement (top/middle/bottom), Incentive for forwarding, Landing page for new subscribers, Referral tracking mechanism, 5 email templates designed for forwarding.
Format as structured markdown.` },
    ]
  },
  {
    id: 'paid_ads', label: 'Paid Ads + Retargeting', icon: '🎯',
    tools: [
      { id: 'audience_builder', label: 'Audience Builder', prompt: `Build detailed ad audience segments for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create 10 audience segments: each with demographics (age, gender, location, income), interests, behaviors, platform (Meta/Google/LinkedIn/TikTok), estimated size, recommended bid strategy.
Format as markdown table.` },
      { id: 'budget_allocator', label: 'Budget Allocator', prompt: `Create a multi-platform budget allocation plan for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Assume total budget of $X/month. Split across: Meta Ads (Feeds/Stories/Reels), Google Ads (Search/Display/YouTube/Youtube Shorts), TikTok, LinkedIn, Retargeting.
For each: % allocation, recommended objective, expected CPA, scaling strategy. Format as markdown.` },
      { id: 'creative_brief', label: 'Creative Brief Generator', prompt: `Write 5 ad creative briefs for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Each brief: Ad format (static image/video/carousel), Platform, Headline, Primary text, CTA, Visual description, Hook (first 3 seconds for video), A/B variant suggestion.
Format as structured markdown per brief.` },
      { id: 'landing_matcher', label: 'Landing Page Matcher', prompt: `Match ad campaigns to optimized landing pages for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create 8 ad-to-landing page pairs: each with ad message, landing page URL/template, headline match, CTA consistency, form length recommendation, load time target.
Format as markdown table.` },
      { id: 'retargeting_funnel', label: 'Retargeting Funnel', prompt: `Design a 3-tier retargeting funnel for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Tier 1 (Visitors): awareness content, frequency cap 3/week. Tier 2 (Engaged): demo/case study, freq cap 5/week. Tier 3 (Cart drop): discount + urgency, freq cap 7/week.
Each: audience definition, creative strategy, offer, budget allocation, expiration rules. Format as markdown.` },
      { id: 'ad_fatigue', label: 'Ad Fatigue Detector', prompt: `Create ad fatigue prevention system for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Fatigue signals (CTR drop >20%, CPM >1.5x, frequency >4), Creative refresh triggers, Rotation schedule, New creative briefing template, Archive criteria.
Plus 10 "refresh" creative concepts ready to produce. Output as markdown.` },
      { id: 'bid_strategy', label: 'Bid Strategy Optimizer', prompt: `Define bidding strategies for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
For each platform (Meta/Google/TikTok/LinkedIn): recommended bid type (lowest cost/cost cap/bid cap/target CPA/target ROAS), starting bid range, scaling trigger, budget change protocol.
Format as markdown table per platform.` },
      { id: 'placement_analyzer', label: 'Placement Analyzer', prompt: `Analyze ad placement strategy for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Evaluate: Feeds (FB/IG), Stories, Reels, In-stream video, Search, Display, Shopping, YouTube, TikTok feed, LinkedIn feed/message.
For each: best use case, expected CPM/CTR range, creative format, audience overlap risk. Format as markdown.` },
      { id: 'ctr_predictor', label: 'CTR Predictor', prompt: `Generate CTR-optimized ad copy variants for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create 20 ad copy variations across: Problem-solution, Feature-benefit, Social proof, Urgency, Question, Storytelling, Comparison, Emotional.
Each: copy, predicted CTR (Low/Med/High), best platform match. Format as markdown table.` },
      { id: 'multi_channel_budget', label: 'Multi-Channel Budgeter', prompt: `Create a quarterly multi-channel advertising budget for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
12-week plan showing: weekly spend per platform, total reach estimate, expected conversions, ROAS target, scaling milestones, seasonal adjustments.
Format as markdown table by week.` },
      { id: 'roas_calculator', label: 'ROAS Calculator', prompt: `Build a ROAS calculation framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Cost inputs (ad spend, creative production, tools, management), Revenue attribution model (first-click/last-click/linear), Break-even ROAS calculation, 5 ROAS scenarios (0.5x to 5x) with profit analysis.
Output as structured markdown formulas.` },
      { id: 'ad_copy_library', label: 'Ad Copy Library', prompt: `Build a swipeable ad copy library for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create 25 ad copy templates across: Awareness (5), Consideration (5), Conversion (5), Retargeting (5), Seasonal (5).
Each: platform, objective, headline, primary text, CTA, visual note. Format as markdown library.` },
    ]
  },
  {
    id: 'analytics', label: 'Analytics + Attribution', icon: '📊',
    tools: [
      { id: 'dashboard_builder', label: 'Dashboard Builder', prompt: `Design a marketing analytics dashboard for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Define 5 dashboard views: Executive summary, Acquisition, Engagement, Conversion, Retention.
For each: KPIs (3-5), visualization type, data source, refresh frequency, alert thresholds. Format as markdown.` },
      { id: 'funnel_visualizer', label: 'Funnel Visualizer', prompt: `Build a conversion funnel analysis framework for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Stages: Awareness → Interest → Consideration → Intent → Purchase → Retention.
For each: definition, leading indicators, typical drop-off rate, optimization tactics (3 per stage), benchmark targets.
Output as structured markdown.` },
      { id: 'cohort_analyzer', label: 'Cohort Analyzer', prompt: `Create a cohort analysis framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Weekly/monthly cohorts, Retention metrics (D1/D7/D30/D90), Revenue per cohort, Cohort comparison methodology, Anomaly detection rules, Actionable insight templates.
Plus 3 example cohort interpretations. Format as markdown.` },
      { id: 'attribution_modeler', label: 'Attribution Modeler', prompt: `Design an attribution modeling strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Compare: First-touch, Last-touch, Linear, Time-decay, Position-based (U-shaped), Data-driven. For each: pros/cons, best use case, implementation complexity, example scenario.
Recommend the best model for {{specialty}} with rationale. Format as markdown.` },
      { id: 'retention_analysis', label: 'Cohort Retention', prompt: `Build a customer retention analysis framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Retention cohorts by acquisition channel, Churn prediction indicators (5 key signals), Retention rate benchmarks by industry, Win-back campaign triggers, Loyalty program KPIs.
Format as structured markdown.` },
      { id: 'report_builder', label: 'Custom Report Builder', prompt: `Create custom report templates for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
5 report templates: Weekly performance, Monthly deep-dive, Campaign post-mortem, Quarterly business review, Competitor analysis.
Each: sections, KPIs, data sources, narrative structure, stakeholder (executive/team/client). Format as markdown briefs.` },
      { id: 'anomaly_detector', label: 'Anomaly Detector', prompt: `Create an anomaly detection system for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Metrics to monitor (traffic, conversions, revenue, CPA, CTR), Anomaly thresholds (±2 std dev, % change triggers), Alert protocol, Investigation checklist, Root cause analysis template.
Output as structured markdown.` },
      { id: 'goal_flow', label: 'Goal Flow Optimizer', prompt: `Optimize Google Analytics goal flows for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Define 5 key conversion goals: type (destination/event/duration/pages-per-session), funnel steps, drop-off points, optimization recommendations per step, A/B test ideas.
Format as markdown per goal.` },
      { id: 'segmentation_analyzer', label: 'Segmentation Analyzer', prompt: `Create an audience segmentation analysis framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Segment by: Demographics, Behavior (frequency/value), Channel preference, Device, Geography, Content affinity.
For each: analysis methodology, tools to use, expected insights, personalization recommendations. Format as markdown.` },
      { id: 'utm_builder', label: 'UTM Builder', prompt: `Design a UTM parameter strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: UTM naming convention (source/medium/campaign/term/content), Campaign code structure, 20 pre-built UTM links for typical campaigns, Tracking spreadsheet template, Common mistakes to avoid.
Output as markdown guide.` },
      { id: 'roi_calculator', label: 'ROI Calculator', prompt: `Build a marketing ROI calculator framework for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Define: Cost categories (ad spend, tools, team, agency, production), Revenue inputs, ROI formulas (ROMI, ROAS, CAC, LTV), 5 scenarios with different budget/combo strategies, Break-even analysis.
Format as markdown with formulas.` },
      { id: 'predictive_analytics', label: 'Predictive Analytics', prompt: `Design a predictive analytics framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Predict: Next month's traffic (±%), Conversion probability per segment, Churn risk (30/60/90 day), Customer lifetime value, Campaign performance before launch.
For each: data requirements, methodology, confidence factors, action triggers. Format as markdown.` },
    ]
  },
  {
    id: 'cro_ux', label: 'CRO + UX', icon: '🧪',
    tools: [
      { id: 'ab_test_builder', label: 'A/B Test Builder', prompt: `Design an A/B testing roadmap for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create 10 A/B test ideas covering: Headline, CTA, Layout, Images, Form length, Social proof, Urgency, Price display, Navigation, Color.
Each: hypothesis, variant description, primary metric, sample size estimate, test duration, success threshold. Format as markdown table.` },
      { id: 'heatmap_overlay', label: 'Heatmap Overlay', prompt: `Create a heatmap analysis plan for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Define: Key pages to heatmap (homepage, product, pricing, checkout, blog), Metrics to track (click maps, scroll depth, hover maps, attention maps), Expected insights, Implementation tools, Analysis frequency.
Plus 10 common heatmap patterns and their fixes. Format as markdown.` },
      { id: 'form_analyzer', label: 'Form Analyzer', prompt: `Audit and optimize forms for {{brandName}} ({{specialty}}). Language: {{language}}.
Analyze: Field count optimization (ideal: 3-7 fields), Field label best practices, Error message templates, Validation timing (inline vs on-submit), Submit button copy variants, Mobile thumb-zone placement.
Provide 3 optimized form layouts. Format as markdown.` },
      { id: 'exit_intent', label: 'Exit Intent Popup', prompt: `Create exit-intent popup strategies for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Design 5 popup variants: Discount offer, Lead magnet, Survey, Email capture, Content recommendation.
Each: trigger timing, headline, body text, CTA, visual description, success metric. Format as markdown.` },
      { id: 'microcopy_writer', label: 'Microcopy Writer', prompt: `Write microcopy for key touchpoints at {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: 404 page, Empty state, Loading state, Error message, Success confirmation, Tooltip, Placeholder text, Button copy (20 variants), Form help text, Checkout progress labels.
All under 100 chars each. Format as markdown list.` },
      { id: 'button_tester', label: 'Button Color Tester', prompt: `Create a CTA button optimization strategy for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Test variables: Color (10 combinations), Shape (rounded/pill/square), Size (small/med/large), Text (10 action-oriented variants), Placement (above fold/below/inline), Animation (pulse/glow/none).
Recommend top 3 combinations with rationale. Format as markdown.` },
      { id: 'trust_signal', label: 'Trust Signal Generator', prompt: `Generate trust-building elements for {{brandName}} ({{specialty}}). Language: {{language}}.
Create: 5 testimonial templates, 3 case study outlines, Trust badge recommendations (SSL, payment icons, awards), Guarantee copy variants, Social proof counter copy ("Join 10K+ users"), Press/featured-in section copy.
Format as ready-to-use markdown snippets.` },
      { id: 'speed_checker', label: 'Load Speed Checker', prompt: `Create a page speed optimization plan for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Core Web Vitals targets (LCP <2.5s, FID <100ms, CLS <0.1), Image optimization strategy, Lazy loading implementation, JS/CSS minification, CDN setup, Caching policy, Critical CSS approach.
Plus 10 quick wins checklist. Format as markdown.` },
      { id: 'navigation_flow', label: 'Navigation Flow Tool', prompt: `Design an optimized navigation flow for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create: Primary nav structure (5-7 items), Secondary nav, Mobile nav (hamburger/bottom tab), Search placement and autocomplete, Breadcrumb strategy, Footer hierarchy.
Output as text-based sitemap with rationale.` },
      { id: 'checkout_optimizer', label: 'Checkout Optimizer', prompt: `Optimize the checkout flow for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Step count reduction (target: 2-3 steps), Guest checkout vs forced signup, Payment option variety, Progress indicator, Address autocomplete, Trust badges placement, Error recovery, Cart abandonment save.
Format as markdown audit with before/after recommendations.` },
      { id: 'pricing_tester', label: 'Pricing Page Tester', prompt: `Design pricing page variations for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Create 3 pricing page layouts: Classic tiered (3 tiers), Feature comparison table, Pay-what-you-want / value-based.
Each: tier names, pricing, feature sets, CTA, social proof placement, annual/monthly toggle. Format as markdown.` },
      { id: 'social_proof_injector', label: 'Social Proof Injector', prompt: `Create a social proof placement strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Placement recommendations for: Hero section, Feature section, Pricing page, Checkout, Popup, Footer.
Types: Customer count, Testimonial carousel, Logo cloud, Review stars, Real-time purchase notifications, Rating badges.
Format as markdown per page with wireframe notes.` },
    ]
  },
  {
    id: 'partnerships', label: 'Partnerships + Affiliates', icon: '🤝',
    tools: [
      { id: 'affiliate_finder', label: 'Affiliate Finder', prompt: `Create an affiliate partner sourcing strategy for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Define: Ideal affiliate profile, 20 potential affiliate types (bloggers, YouTubers, podcasters, coupon sites, review sites, social creators), Outreach priority scoring system, Partner tier criteria.
Format as markdown strategy doc.` },
      { id: 'partnership_tiers', label: 'Partnership Tier Builder', prompt: `Design a partnership tier system for {{brandName}} ({{specialty}}). Language: {{language}}.
3 tiers: Partner, Premium Partner, Enterprise Partner.
Each: Commission rate, Cookie duration, Creative assets provided, Support level, Co-marketing opportunities, Qualification criteria.
Format as markdown comparison table.` },
      { id: 'commission_calc', label: 'Commission Calculator', prompt: `Build a commission structure for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Options: Flat rate, Tiered (% based on volume), Performance-based (CPA/CPS/CPL), Hybrid.
For each: calculation formula, example scenarios, breakeven analysis, recommended starting structure.
Format as markdown with formulas.` },
      { id: 'co_marketing', label: 'Co-Marketing Template', prompt: `Create co-marketing partnership templates for {{brandName}} ({{specialty}}). Language: {{language}}.
5 templates: Joint webinar, Cross-promotional email, Co-branded content, Social media takeover, Bundle offer.
Each: proposal email, scope of work outline, success metrics, timeline template, promotion plan.
Format as actionable markdown templates.` },
      { id: 'ambassador_program', label: 'Ambassador Program', prompt: `Design a brand ambassador program for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Include: Program name, Ambassador tiers, Benefits per tier, Application process, Selection criteria, Onboarding flow, Content expectations, Compensation structure, Exclusive community plan, KPI tracking.
Format as complete markdown program doc.` },
      { id: 'referral_flow', label: 'Referral Flow Builder', prompt: `Create a customer referral program for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Design: Referral incentive (bounty for referrer + discount for referee), Sharing mechanism (email/social/link), Landing page for referrals, Tracking system, Rewards fulfillment, 5 referral email templates.
Format as structured markdown.` },
      { id: 'partner_dashboard', label: 'Partner Dashboard', prompt: `Design a partner dashboard concept for {{brandName}} ({{specialty}}). Language: {{language}}.
Sections: Earnings summary, Links & creatives, Performance stats (clicks/conversions/revenue), Payout history, Resources library, Support ticket.
For each: metrics displayed, visualization type, update frequency. Format as markdown spec.` },
      { id: 'cross_promotion', label: 'Cross-Promotion Planner', prompt: `Plan a cross-promotion calendar for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Quarterly plan with: 6 cross-promotion campaigns, Partner type per campaign, Offer structure, promotion channels, timeline, expected reach, success metrics.
Format as markdown by quarter.` },
      { id: 'content_syndication', label: 'Content Syndication Tool', prompt: `Create a content syndication strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Platforms: Medium, LinkedIn Articles, dev.to, Business 2 Community, GrowthHackers, Reddit, Quora, SlideShare, YouTube, Podcast appearances.
For each: content type that works, republishing guidelines, canonical link setup, audience size estimate, engagement expectations.
Format as markdown per platform.` },
      { id: 'joint_webinar', label: 'Joint Webinar Planner', prompt: `Create a joint webinar plan for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Include: Topic brainstorm (5 ideas), Ideal partner profile, Pre-webinar promotion plan (email + social), Webinar structure (30/45/60min formats), Post-webinar nurture sequence (3 emails), Lead sharing agreement template.
Format as complete markdown playbook.` },
      { id: 'partner_onboarding', label: 'Partner Onboarding', prompt: `Design a partner onboarding flow for {{brandName}} ({{specialty}}). Language: {{language}}.
Steps: Application review → Welcome email → Partner agreement → Dashboard access → Training materials → First campaign setup → Performance review (30/60/90 days).
Provide email templates for each step and training outline. Format as markdown.` },
      { id: 'perf_tracker', label: 'Performance Tracker', prompt: `Create a partner performance tracking framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: KPIs (clicks, conversion rate, revenue, EPC, churn rate), Review cadence (weekly/monthly/quarterly), Performance tiers (over/at/below target), Improvement plan template, Top performer rewards structure.
Format as markdown system doc.` },
    ]
  },
  {
    id: 'sales_crm', label: 'Sales + CRM Integration', icon: '💼',
    tools: [
      { id: 'lead_scoring', label: 'Lead Scoring Model', prompt: `Design a lead scoring model for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Define: Explicit criteria (job title, company size, industry, budget), Implicit criteria (page visits, email opens, form fills, content downloads), Scoring ranges (Cold/Warm/Hot), Threshold for sales handoff, Decay rules for inactivity.
Format as markdown scoring matrix.` },
      { id: 'pipeline_stages', label: 'Pipeline Stage Builder', prompt: `Create a sales pipeline structure for {{brandName}} ({{specialty}}). Language: {{language}}.
6 stages: New Lead → Qualified → Meeting Scheduled → Proposal → Negotiation → Closed Won/Lost.
For each: definition, entry criteria, exit criteria, typical time-in-stage, key actions, win rate benchmark.
Format as markdown pipeline spec.` },
      { id: 'sales_script', label: 'Sales Script Generator', prompt: `Write sales scripts for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
5 scripts: Cold call (60s), Discovery call, Demo presentation, Follow-up call, Closing call.
Each: opening, qualifying questions (5), value proposition, objection handling (3 objections), closing technique, call-to-action.
Format as markdown per script.` },
      { id: 'followup_sequence', label: 'Follow-up Sequence', prompt: `Create a lead follow-up sequence for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
7-touch sequence over 14 days: Touch 1 (Day 1) — Thank you + recap, Touch 2 (Day 2) — Case study, Touch 3 (Day 4) — Social proof, Touch 4 (Day 6) — Value add content, Touch 5 (Day 9) — Unlock/FOMO, Touch 6 (Day 12) — Direct ask, Touch 7 (Day 14) — Breakup.
Each: channel (email/call/linkedin), subject/opening, body. Format as markdown.` },
      { id: 'proposal_template', label: 'Proposal Template', prompt: `Write a sales proposal template for {{brandName}} ({{specialty}}). Language: {{language}}.
Sections: Executive summary, Understanding of client needs, Our solution, Timeline & milestones, Pricing & packages, ROI projections, Case studies / social proof, Terms & conditions, Next steps.
Fill with placeholder copy optimized for conversion. Format as markdown proposal.` },
      { id: 'demo_request', label: 'Demo Request Flow', prompt: `Create a demo request and nurture flow for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Design: Demo request form (minimal fields), Confirmation page copy, Calendar scheduling integration, Pre-demo email (preparation guide), Demo script outline, Post-demo follow-up sequence (3 days).
Format as complete markdown flow.` },
      { id: 'trial_nurture', label: 'Trial Nurture Builder', prompt: `Build a free trial nurture sequence for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
14-day trial journey: Day 1 — Welcome + quick start, Day 3 — Feature spotlight, Day 5 — Best practices, Day 7 — Mid-trial check-in, Day 10 — Success stories, Day 12 — Upgrade incentive, Day 14 — Expiry + retention offer.
Each: email subject, body, CTA. Format as markdown.` },
      { id: 'objection_handler', label: 'Objection Handler', prompt: `Create objection handling responses for {{brandName}} ({{specialty}}). Language: {{language}}.
15 common objections in {{specialty}} with responses: Price too high, Not now, Happy with current solution, Need to think about it, No budget, Too busy, Need approval, Competitor is cheaper, Don't see value, Too complex, Security concerns, Implementation time, Contract length, Need custom solution, Not interested.
Each: empathy statement, reframe, proof point, recovery question. Format as markdown table.` },
      { id: 'deal_analyzer', label: 'Deal Stage Analyzer', prompt: `Create a deal analysis framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Deal stages with probability weights, Aging analysis (30/60/90+ days in stage), Stuck deal indicators, Deal health score (1-10), Next-action automation rules, Win/loss reasons tracker, Forecasting methodology.
Format as markdown system spec.` },
      { id: 'abm_tool', label: 'ABM Tool', prompt: `Design an Account-Based Marketing plan for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Identify 10 target accounts, For each: Account name, Industry, Key decision makers, Personalized content strategy (3 touches), Channel mix, Success metrics, Timeline.
Plus: ABM playbook with 5 campaign types. Format as markdown.` },
      { id: 'win_loss', label: 'Win/Loss Analyzer', prompt: `Create a win/loss analysis framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Win reasons categories (product, price, relationship, timing), Loss reasons categories (competitor, budget, no fit, no response), Data collection method (post-mortem survey template), Analysis cadence (monthly), Action items from insights.
Format as markdown framework.` },
      { id: 'sales_calendar', label: 'Sales Calendar Sync', prompt: `Design a sales activity calendar for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Weekly rhythm: Monday (planning + prospecting), Tuesday (calls/demos), Wednesday (follow-ups + proposals), Thursday (calls/closing), Friday (admin + review).
Include: Daily activity targets, Time blocking template, Tool integrations (CRM, calendar, email), Monthly/quarterly review cadence.
Format as markdown schedule.` },
    ]
  },
  {
    id: 'workflow_automation', label: 'AI Workflow Automation', icon: '⚡',
    tools: [
      { id: 'agent_builder', label: 'Agent Builder', prompt: `Design an AI agent workflow for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Define: Agent purpose, Trigger events (5), Input data sources, Processing steps (3-5), Output actions, Success criteria, Fallback behavior (human handoff).
Provide 3 example agent workflows relevant to {{specialty}}. Format as markdown spec.` },
      { id: 'trigger_response', label: 'Trigger-Response Designer', prompt: `Create trigger-response automations for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
10 automation rules: Trigger (event/condition + data source), Condition filter, Action (send email/update CRM/post webhook/create task), Rollback on failure.
Examples: New lead → send welcome, Cart abandon → send reminder, Support ticket → tag + route, etc.
Format as markdown rule table.` },
      { id: 'multi_step', label: 'Multi-step Workflow', prompt: `Design 5 multi-step marketing workflows for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Workflows: Lead qualification → nurture → sales handoff, Content creation → review → publish → promote, Campaign launch → monitor → optimize → report, Webinar registration → reminder → follow-up, Customer onboarding → activation → retention.
Each: steps (5-8), decision points, integration points, error handling. Format as markdown flowcharts.` },
      { id: 'conditional_logic', label: 'Conditional Logic Tool', prompt: `Create conditional branching logic templates for {{brandName}} ({{specialty}}). Language: {{language}}.
5 templates: Lead scoring-based routing, Behavior-based email send, Form response branching, Support ticket prioritization, Campaign budget allocation.
Each: conditions, branches, actions per branch, default fallback. Format as markdown decision trees.` },
      { id: 'data_transform', label: 'Data Transform Pipeline', prompt: `Design data transformation pipelines for {{brandName}} ({{specialty}}). Language: {{language}}.
3 pipelines: Webhook → Normalize → CRM, CSV import → Clean → Enrich → Load, API scrape → Transform → Analytics DB.
Each: input format, transformation steps (mapping, filtering, enrichment), output format, error logging, retry logic.
Format as markdown spec.` },
      { id: 'webhook_tester', label: 'Webhook Tester', prompt: `Create a webhook integration guide for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Webhook setup (URL, secret, events), Payload structure (JSON schema), Authentication methods, Retry policy, 5 example payloads with explanations, Testing checklist, Debugging tips, Monitoring/alerting.
Format as technical markdown guide.` },
      { id: 'approval_flow', label: 'Approval Flow', prompt: `Design content approval workflows for {{brandName}} ({{specialty}}). Language: {{language}}.
3 flows: Social post approval (draft → review → approve → schedule), Ad creative approval (copy → design → legal → launch), Email campaign approval (write → design → QA → send).
Each: roles, review steps, notification triggers, SLA per step, escalation path, rejection feedback template.
Format as markdown per flow.` },
      { id: 'scheduled_actions', label: 'Scheduled Action Builder', prompt: `Create scheduled automation recipes for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
10 scheduled actions: Daily (lead report email), Weekly (content digest), Monthly (performance report), Quarterly (audit), Event-based (webinar follow-up), Date-based (anniversary).
Each: schedule (cron expression), action, data source, output channel. Format as markdown table.` },
      { id: 'log_viewer', label: 'Log/Event Viewer', prompt: `Design an automation log and event monitoring system for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Log levels (info/warn/error/critical), Event types to capture, Retention policy, Search/filter capabilities, Alert rules, Dashboard visualization, Audit trail requirements, Error notification setup (Slack/email).
Format as markdown spec.` },
      { id: 'retry_logic', label: 'Retry Logic Config', prompt: `Create error handling and retry strategies for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Retry strategies (fixed interval, exponential backoff, jitter), Max retry counts per operation type, Dead letter queue handling, Failure notification templates, Circuit breaker patterns, Recovery procedures.
Provide 5 example scenarios with recommended retry configs. Format as markdown.` },
      { id: 'human_in_loop', label: 'Human-in-the-Loop', prompt: `Design human-in-the-loop workflows for {{brandName}} ({{specialty}}). Language: {{language}}.
5 scenarios: AI-generated content review, High-value lead approval, Fraud/risk flag review, Custom quote generation, Complex support escalation.
Each: automation scope, human decision point, notification method, response SLA, fallback if no response, audit trail.
Format as markdown spec per scenario.` },
      { id: 'audit_trail', label: 'Audit Trail Generator', prompt: `Create an audit trail system for {{brandName}} ({{specialty}}). Language: {{language}}.
Define: Events to log (create/read/update/delete), Data to capture (who/what/when/where/why), Storage strategy (DB/table structure), Retention period, Search interface requirements, Compliance requirements (GDPR/SOC2), Report templates.
Format as technical markdown spec.` },
    ]
  },
  {
    id: 'international', label: 'International + Multi-Market', icon: '🌍',
    tools: [
      { id: 'market_selector', label: 'Market Selector', prompt: `Evaluate international market expansion opportunities for {{brandName}} ({{specialty}}). Goal: {{goal}}. Language: {{language}}.
Analyze 5 potential markets: for each — market size, growth rate, competition level, entry difficulty (Low/Med/High), cultural fit, legal complexity, localization needs, recommended entry strategy.
Recommend top 3 markets with rationale. Format as markdown.` },
      { id: 'localization_planner', label: 'Localization Planner', prompt: `Create a localization roadmap for {{brandName}} ({{specialty}}) expanding to new markets. Language: {{language}}.
Define: Content to localize (website, app, support, marketing, legal), Translation approach (human vs AI hybrid), Cultural adaptation checklist (colors, symbols, values, humor), Region-specific SEO strategy, Local pricing adaptation.
Format as markdown phased roadmap.` },
      { id: 'currency_converter', label: 'Currency Converter', prompt: `Design a multi-currency pricing strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Target currencies (USD, EUR, GBP, JPY, AUD, CAD, SGD, BRL), Price localization rules (rounding, psychology per market), Dynamic conversion vs fixed local pricing, FX hedging strategy, Display best practices (symbol placement, decimal format).
Format as markdown pricing guide.` },
      { id: 'legal_checker', label: 'Legal Compliance Checker', prompt: `Create a cross-border legal compliance checklist for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: GDPR (EU), CCPA/CPRA (California), LGPD (Brazil), PIPEDA (Canada), POPIA (South Africa), APPI (Japan), Data residency requirements, Cookie consent laws, E-commerce regulations, Industry-specific compliance (fintech/healthcare/advertising).
Format as markdown per region checklist.` },
      { id: 'cultural_analyzer', label: 'Cultural Sensitivity Analyzer', prompt: `Create a cultural sensitivity guide for {{brandName}} ({{specialty}}) expanding to: US, UK, Germany, Japan, Brazil, UAE, India, Australia.
For each: Communication style (direct/indirect), Hierarchy expectations, Color symbolism, Taboo topics, Humor style, Trust signals, Negotiation approach, Visual preferences.
Format as markdown per country.` },
      { id: 'timezone_scheduler', label: 'Timezone Scheduler', prompt: `Create a global timezone management system for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Team/project timezone map, Meeting scheduling best practices, Follow-the-sun support model, Global campaign launch timing (optimize for 3 major timezones), Send time optimization per region for email.
Include timezone conversion reference table. Format as markdown.` },
      { id: 'region_seo', label: 'Region-Specific SEO', prompt: `Create a multi-region SEO strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: hreflang tag implementation, ccTLD vs subdomain vs subdirectory strategy, Region-specific keyword research methodology, Local search engine considerations (Baidu, Yandex, Naver, Seznam), Local backlink building, Google My Business per location.
Format as technical markdown guide.` },
      { id: 'language_variants', label: 'Language Variant Generator', prompt: `Create language variant localization guide for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover key variants: UK vs US English, EU vs LATAM Spanish, European vs Brazilian Portuguese, Modern Standard vs regional Arabic, Simplified vs Traditional Chinese.
For each: key vocabulary differences (10 words), spelling rules, date/number formats, tone differences. Format as markdown.` },
      { id: 'payment_planner', label: 'Payment Gateway Planner', prompt: `Design a global payment strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: North America (Stripe, PayPal, Square), Europe (Adyen, Klarna, SEPA, iDEAL), Asia (Paytm, Alipay, WeChat Pay, GrabPay), LATAM (Mercado Pago, PagSeguro), Crypto options.
For each: setup complexity, fee structure, fraud protection level, customer preference data, integration recommendation. Format as markdown.` },
      { id: 'shipment_planner', label: 'International Shipment', prompt: `Create a cross-border logistics strategy for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: Shipping carriers per region (DHL, FedEx, UPS, local), Duty/tax calculation strategy, Incoterms selection, Returns management per region, Warehousing strategy (centralized vs regional), Last-mile delivery partners.
Plus cost comparison table for 5 destination regions. Format as markdown.` },
      { id: 'tax_calculator', label: 'Tax/VAT Calculator', prompt: `Create a cross-border tax compliance framework for {{brandName}} ({{specialty}}). Language: {{language}}.
Cover: VAT/GST rates per country, Digital services tax rules, VAT registration thresholds (US state-by-state, EU, UK, Australia, Japan, UAE), Tax collection responsibility (marketplace vs seller), Invoice requirements per region, Filing frequency.
Format as markdown reference table.` },
      { id: 'market_entry', label: 'Market Entry Strategy', prompt: `Write a market entry strategy for {{brandName}} ({{specialty}}) entering a new international market. Goal: {{goal}}. Language: {{language}}.
Structure: Market analysis (size, trends, competition), Entry mode (direct export, JV, franchise, subsidiary), Go-to-market timeline (12 weeks), Localization requirements, Partnership needs, Budget estimate, Risk assessment, Success metrics.
Format as complete markdown strategy doc.` },
    ]
  },
];

export function ContentTools({ project, setProject, brandName, specialty, goal, brief, language, aiConfig }: {
  project: MarketingStudioProject;
  setProject: (f: (prev: MarketingStudioProject) => MarketingStudioProject) => void;
  brandName: string;
  specialty: string;
  goal: string;
  brief: string;
  language: string;
  aiConfig: { provider: string; modelId: string };
}) {
  const [loadingTool, setLoadingTool] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [toolProvider, setToolProvider] = useState<{ provider: string; modelId: string } | null>(null);
  const { toast } = useToast();

  const section = project.contentSection || SECTIONS[0].id;
  const tool = project.contentSubTab || '';
  const results = project.contentResults || {};

  const setSection = (s: string) => setProject(p => ({ ...p, contentSection: s, contentSubTab: '', contentError: null }));
  const setTool = (t: string) => setProject(p => ({ ...p, contentSubTab: t, contentError: null }));

  const currentSection = SECTIONS.find(s => s.id === section) || SECTIONS[0];
  const currentTool = currentSection.tools.find(t => t.id === tool);

  const handleGenerate = async (t: ToolDef) => {
    setLoadingTool(t.id);
    setProject(p => ({ ...p, contentError: null }));
    try {
      const { call } = createAICall('content_' + t.id);
      const prompt = t.prompt
        .replace(/\{\{brandName\}\}/g, brandName)
        .replace(/\{\{specialty\}\}/g, specialty)
        .replace(/\{\{goal\}\}/g, goal)
        .replace(/\{\{brief\}\}/g, brief)
        .replace(/\{\{language\}\}/g, language === 'ar' ? 'Arabic' : 'English');
      const override = toolProvider || aiConfig;
      const result = await call(prompt, { provider: override.provider, modelId: override.modelId, fallbackProviders: ['google', 'openai', 'anthropic'].filter(p => p !== override.provider) as any });
      setProject(p => ({ ...p, contentResults: { ...(p.contentResults || {}), [t.id]: result }, contentSubTab: t.id }));
      toast({ type: 'success', title: `${t.label} generated` });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setProject(p => ({ ...p, contentError: err.message || 'Generation failed' }));
        toast({ type: 'error', title: `${t.label} failed`, message: err.message });
      }
    } finally {
      setLoadingTool(null);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyTool = (toolId: string) => {
    const text = results[toolId];
    if (!text) return;
    handleCopy(text, toolId);
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
    <div className="col-span-12 animate-in fade-in duration-500">
      {/* Section tabs */}
      <div className="flex gap-1.5 p-1.5 bg-black/20 rounded-2xl border border-white/5 overflow-x-auto mb-8 suggestions-scrollbar">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${section === s.id ? 'bg-white/10 text-white shadow-inner' : 'text-white/30 hover:text-white/50'}`}
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
                    if (hasResult) handleCopyTool(t.id);
                  }}
                  className={`group relative px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border text-left ${isActive ? 'bg-white/10 border-white/30 text-white shadow-inner' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20 hover:text-white/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{t.label}</span>
                    {hasResult && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
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
                  {currentTool.id.replace(/_/g, ' ')} — generates detailed analysis and recommendations.
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
                  onChange={(p, m) => setToolProvider({ provider: p, modelId: m })}
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

              {project.contentError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <p className="text-[11px] text-red-400 font-bold flex-1">{project.contentError}</p>
                  {currentTool && (
                    <button
                      onClick={() => handleGenerate(currentTool)}
                      disabled={loadingTool !== null}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shrink-0 disabled:opacity-30"
                    >
                      Retry
                    </button>
                  )}
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
                  <button
                    onClick={() => handleCopyTool(tool)}
                    className="p-2 rounded-xl hover:bg-white/10 transition-all"
                    title="Copy to clipboard"
                  >
                    {copiedIdx === tool ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                  </button>
                  <button
                    onClick={() => handleDownloadTool(tool)}
                    className="p-2 rounded-xl hover:bg-white/10 transition-all"
                    title="Download as Markdown"
                  >
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
