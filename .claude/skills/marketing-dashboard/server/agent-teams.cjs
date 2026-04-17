/**
 * Agent Teams — Pipeline definitions for each marketing tool.
 *
 * Each pipeline is an array of steps: { agent, label, buildPrompt(inputs, prevOutput) }
 * Steps run sequentially; `prevOutput` carries the previous agent's result.
 */

const PIPELINES = {

  // ── Tagline Generator ────────────────────────────────────────────────────
  tagline: [
    {
      agent: 'researcher',
      label: '🔍 Research Market & Audience',
      buildPrompt: (i) =>
        `Research the target audience and market positioning for: "${i.product}".
Industry: ${i.industry || 'general'}. Tone required: ${i.tone || 'professional'}.
Provide: (1) Core customer pain points, (2) Key emotional triggers, (3) Top 3 competitors and their taglines, (4) Positioning opportunity. Be concise — bullet points only.`,
    },
    {
      agent: 'copywriter',
      label: '✍️ Write Taglines',
      buildPrompt: (i, ctx) =>
        `Using the research above, create 7 taglines for: "${i.product}".
Tone: ${i.tone || 'professional'}. Industry: ${i.industry || 'general'}.
Rules: (1) Each under 8 words, (2) Emotionally resonant, (3) Differentiated from competitors, (4) No generic filler.
Format: numbered list with 1-line rationale for each.`,
    },
    {
      agent: 'content-reviewer',
      label: '✅ Review & Rank',
      buildPrompt: (i, ctx) =>
        `Review all 7 taglines above. Score each 1-10 on: memorability, emotional impact, differentiation.
Then: (1) Pick the TOP 3 with explanations, (2) Suggest 1 improvement per rejected tagline, (3) Give a "Winner" recommendation with implementation tips.`,
    },
  ],

  // ── Ad Copywriter ────────────────────────────────────────────────────────
  adcopy: [
    {
      agent: 'researcher',
      label: '🔍 Analyze Audience & Platform',
      buildPrompt: (i) =>
        `Research ${i.platform || 'Facebook'} ad best practices for: "${i.product}".
USP: ${i.usp || 'quality'}. Target audience psychology analysis. Ad format specs. Top-performing ad patterns in this niche. Be brief and actionable.`,
    },
    {
      agent: 'copywriter',
      label: '✍️ Write Ad Copy',
      buildPrompt: (i, ctx) =>
        `Write a high-converting ${i.platform || 'Facebook'} ad for: "${i.product}".
USP: ${i.usp || 'quality'}. CTA: ${i.cta || 'Mua ngay'}. Length: ${i.length || 'short'}.
Use AIDA framework. Include: Hook line, body, CTA. Write 2 variants with different angles (benefit vs urgency).`,
    },
    {
      agent: 'content-reviewer',
      label: '✅ Compliance & Quality Check',
      buildPrompt: (i) =>
        `Review the ad copy above. Check: (1) Platform policy compliance for ${i.platform || 'Facebook'}, (2) Hook strength, (3) CTA clarity, (4) Grammar & flow.
Deliver: Final polished version + A/B test recommendation.`,
    },
  ],

  // ── Campaign Planner ─────────────────────────────────────────────────────
  campaign: [
    {
      agent: 'researcher',
      label: '🔍 Market Research',
      buildPrompt: (i) =>
        `Conduct market research for a campaign: "${i.product}".
Goal: ${i.goal || 'brand awareness'}. Budget: ${i.budget || 'medium'}. Duration: ${i.duration || '1 month'}.
Analyze: competitor campaigns, best channels for this goal/budget mix, content trends, KPI benchmarks.`,
    },
    {
      agent: 'campaign-manager',
      label: '🚀 Build Campaign Strategy',
      buildPrompt: (i, ctx) =>
        `Design a full marketing campaign based on the research above.
Product: "${i.product}". Goal: ${i.goal}. Budget: ${i.budget}. Duration: ${i.duration}.
Include: (1) Campaign concept & theme, (2) Channel breakdown with budget allocation %, (3) Week-by-week content calendar, (4) KPIs and success metrics, (5) Risk mitigation.`,
    },
    {
      agent: 'planner',
      label: '📋 Create Action Plan',
      buildPrompt: (i) =>
        `Convert the campaign strategy above into an actionable execution plan.
Format: (1) Week 1-4 task breakdown with owners, (2) Priority matrix (High/Med/Low), (3) Quick wins to execute in Week 1, (4) Budget tracking template structure.`,
    },
  ],

  // ── Blog Outline ─────────────────────────────────────────────────────────
  blogOutline: [
    {
      agent: 'researcher',
      label: '🔍 SEO & Topic Research',
      buildPrompt: (i) =>
        `Research SEO and content strategy for blog: "${i.title}".
Main keyword: ${i.keyword || i.title}. Audience: ${i.audience || 'general'}.
Find: top-ranking competitor articles structure, related keywords, questions people ask (PAA), content gaps to exploit.`,
    },
    {
      agent: 'content-creator',
      label: '📝 Draft Outline',
      buildPrompt: (i, ctx) =>
        `Create a detailed blog outline for: "${i.title}".
Keyword: ${i.keyword || i.title}. Audience: ${i.audience || 'general'}.
Structure: H1 title variants (3 options), H2 sections (6-8), H3 subsections, intro hook, conclusion CTA. Each section has 2-sentence description of what to cover.`,
    },
    {
      agent: 'seo-specialist',
      label: '🔍 SEO Optimization',
      buildPrompt: (i) =>
        `Optimize the blog outline above for SEO.
Target keyword: ${i.keyword}. Add: (1) Keyword placement recommendations per section, (2) Internal linking opportunities, (3) Meta title & description, (4) Schema markup suggestions, (5) Featured snippet optimization tips.`,
    },
  ],

  // ── Social Caption ───────────────────────────────────────────────────────
  socialCaption: [
    {
      agent: 'copywriter',
      label: '✍️ Write Captions',
      buildPrompt: (i) =>
        `Write 3 social media captions for ${i.platform || 'Instagram'} about: "${i.topic}".
Tone: ${i.tone || 'friendly'}. Platform best practices. Length: ${i.length || '100-150 words'}.
Each caption: hook + body + CTA + relevant hashtags (max 5). Different angles: emotional, informational, action-driven.`,
    },
    {
      agent: 'social-media-manager',
      label: '📱 Optimize for Platform',
      buildPrompt: (i) =>
        `Review the captions above for ${i.platform || 'Instagram'}.
Optimize: (1) Timing recommendations, (2) Hashtag strategy refinement, (3) Engagement mechanics (question, poll suggestion, etc.), (4) Select THE BEST caption with reasoning, (5) Posting schedule suggestion.`,
    },
  ],

  // ── Email Subject Lines ──────────────────────────────────────────────────
  emailSubject: [
    {
      agent: 'copywriter',
      label: '✍️ Write Subject Lines',
      buildPrompt: (i) =>
        `Write 12 email subject lines for campaign: "${i.campaign}".
Audience: ${i.audience || 'subscribers'}. Goal: ${i.goal || 'increase open rate'}.
Include variants: (1) Curiosity-driven x3, (2) Benefit-focused x3, (3) Urgency/FOMO x3, (4) Personalization x3.
Each under 50 characters. No spam trigger words.`,
    },
    {
      agent: 'email-wizard',
      label: '📧 Optimize & Rank',
      buildPrompt: (i) =>
        `Analyze all 12 subject lines above.
Score each on: open rate potential, spam risk, mobile display.
Deliver: (1) Top 5 ranked with scores, (2) A/B test pairs (pick 2 vs 2), (3) Preview text for the top 3, (4) Best send time recommendation for ${i.audience || 'subscribers'}.`,
    },
  ],

  // ── Meta Description ─────────────────────────────────────────────────────
  metaDesc: [
    {
      agent: 'seo-specialist',
      label: '🔍 Write SEO Meta',
      buildPrompt: (i) =>
        `Write meta description for page: "${i.pageTitle}".
Keyword: ${i.keyword}. URL: ${i.url || ''}. Exactly 150-160 characters. Include keyword naturally. Compelling click driver. Write 3 variants.`,
    },
    {
      agent: 'content-reviewer',
      label: '✅ Review & Select Best',
      buildPrompt: (i) =>
        `Review the 3 meta descriptions. Verify character count (must be 150-160 each). Check: keyword inclusion, click appeal, no truncation issues.
Final output: THE ONE best meta description + reason + title tag suggestion.`,
    },
  ],

  // ── CTA Copy ─────────────────────────────────────────────────────────────
  cta: [
    {
      agent: 'copywriter',
      label: '✍️ Generate CTA Options',
      buildPrompt: (i) =>
        `Create 12 CTA button texts and micro-copy for: "${i.action}".
Context: ${i.context || 'landing page'}. Tone: ${i.tone || 'action-oriented'}.
Format: button text (2-5 words) + supporting micro-copy (under 15 words) per option. Vary angles: benefit, urgency, social proof, curiosity.`,
    },
    {
      agent: 'content-reviewer',
      label: '✅ Select & Refine Best',
      buildPrompt: () =>
        `Pick the TOP 5 CTAs from the list. For each: conversion probability score (1-10), when to use it, A/B test pairing suggestion. Deliver as ready-to-implement copy.`,
    },
  ],

  // ── Product Description ──────────────────────────────────────────────────
  productDesc: [
    {
      agent: 'copywriter',
      label: '✍️ Write Product Copy',
      buildPrompt: (i) =>
        `Write a compelling product description for: "${i.product}".
Features: ${i.features || 'see above'}. Benefits: ${i.benefits || 'optimal experience'}. Tone: ${i.tone || 'professional'}.
Use PAS framework. 150-200 words. No feature dumping — lead with customer benefit. Include 5-bullet feature highlight.`,
    },
    {
      agent: 'content-reviewer',
      label: '✅ Refine & Polish',
      buildPrompt: () =>
        `Review and polish the product description. Check: (1) Benefit-first language, (2) Emotional appeal, (3) Clarity and scannability, (4) SEO friendliness.
Final output: polished version + short 50-word variant for ads.`,
    },
  ],

  // ── Banner (image — single prompt building step) ─────────────────────────
  banner: [
    {
      agent: 'copywriter',
      label: '🎨 Craft Visual Prompt',
      buildPrompt: (i) =>
        `Design a highly detailed Midjourney/DALL-E image generation prompt for a marketing banner.
Brand: "${i.product}". Message: "${i.message || i.product}". Style: ${i.style || 'modern dark'}.
Prompt must include: composition, lighting, colors, typography feel, mood, technical quality descriptors. Output ONLY the image prompt, nothing else.`,
    },
  ],

  // ── Thumbnail (image) ────────────────────────────────────────────────────
  thumbnail: [
    {
      agent: 'copywriter',
      label: '🎨 Craft Thumbnail Prompt',
      buildPrompt: (i) =>
        `Create a detailed image generation prompt for a YouTube thumbnail.
Topic: "${i.topic}". Style: ${i.style || 'bold high contrast clickbait'}.
Include: dramatic composition, emotion, text area placement, color psychology, eye-catching elements. Output ONLY the image prompt.`,
    },
  ],

  // ── Social Image ─────────────────────────────────────────────────────────
  socialImage: [
    {
      agent: 'copywriter',
      label: '🎨 Craft Image Prompt',
      buildPrompt: (i) =>
        `Create a detailed image generation prompt for ${i.platform || 'Instagram'} (${i.format || '1:1'}).
Brand/Theme: "${i.brand}". Colors: ${i.colors || 'purple and blue gradient'}. Style: clean, modern, professional.
Output ONLY the image generation prompt.`,
    },
  ],
};

/**
 * Get pipeline for a given tool name.
 * Returns null if tool not found.
 */
function getPipeline(toolName) {
  return PIPELINES[toolName] || null;
}

/**
 * List all available tools.
 */
function listTools() {
  return Object.keys(PIPELINES).map(key => ({
    tool:   key,
    steps:  PIPELINES[key].length,
    agents: PIPELINES[key].map(s => s.agent),
  }));
}

module.exports = { getPipeline, listTools, PIPELINES };
