
import { ImageFile, AudioFile, AIConfig } from '../types';
import { logApiInteraction } from '../lib/admin';

async function googleAICall(modelId: string, contents: any, config: any = {}, signal?: AbortSignal) {
  const body: any = {
    contents: Array.isArray(contents) ? contents : [contents],
    safetySettings,
  };
  if (config && Object.keys(config).length > 0) {
    const topLevelKeys = ['systemInstruction'];
    for (const [k, v] of Object.entries(config)) {
      if (topLevelKeys.includes(k)) {
        body[k] = v;
      } else {
        if (!body.generationConfig) body.generationConfig = {};
        body.generationConfig[k] = v;
      }
    }
  }
  const res = await fetch('/api/ai/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'gemini', modelId, body }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gemini call failed');
  }
  const data = await res.json();
  data.text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
  return data;
}

// Helpers for unified calling
export async function callAI(prompt: string, config: AIConfig, systemInstruction?: string, jsonSchema?: any, signal?: AbortSignal): Promise<string> {
    const { provider, modelId } = config;
    const startTime = Date.now();

    try {
        const { IntegrationService } = await import('./integrationService');
        const response = await IntegrationService.smartCall(provider as any, {
            prompt,
            systemInstruction,
            signal,
        }, config.externalServiceConfig ? {
            endpoint: config.externalServiceConfig.url,
            apiKeys: [],
            authType: 'header',
            authHeaderName: 'Authorization',
            name: config.externalServiceConfig.name,
        } : undefined);

        await logApiInteraction(`${provider}:${modelId}`, 200, Date.now() - startTime);
        return response.message || '';
    } catch (err) {
        await logApiInteraction(`${provider}:${modelId}`, 500, Date.now() - startTime, err instanceof Error ? err.message : String(err));
        throw err;
    }
}

export async function callAIWithImages(
    prompt: string,
    images: ImageFile[],
    config: AIConfig,
    systemInstruction?: string,
    signal?: AbortSignal
): Promise<string> {
    const { provider, modelId } = config;
    const startTime = Date.now();

    try {
        if (provider === 'google' || provider === 'gemini') {
            const parts: any[] = [
                ...images.map(img => ({
                    inlineData: {
                        data: img.base64,
                        mimeType: img.mimeType
                    }
                })),
                { text: prompt }
            ];
            const response = await googleAICall(modelId, { parts }, {
                systemInstruction
            }, signal);

            await logApiInteraction(`Gemini:${modelId}`, 200, Date.now() - startTime);
            return response.text || '';
        }

        if ((provider === 'custom' || provider === 'external') && config.externalServiceConfig) {
            const { IntegrationService } = await import('./integrationService');
            const resp = await IntegrationService.smartCall('custom', {
                prompt,
                systemInstruction,
                signal,
            }, {
                endpoint: config.externalServiceConfig.url,
                apiKeys: [],
                authType: 'header',
                authHeaderName: 'Authorization',
                name: config.externalServiceConfig.name,
            });
            await logApiInteraction(`Custom:${modelId}`, 200, Date.now() - startTime);
            return resp.message || '';
        }

        // For simplicity, we fallback to standard callAI for providers that might not support easy base64 vision via this simple multi-modal structure yet,
        // or add support for etc.
        return callAI(prompt, config, systemInstruction, undefined, signal);
    } catch (err) {
        await logApiInteraction(`${provider}:${modelId}`, 500, Date.now() - startTime, err instanceof Error ? err.message : String(err));
        throw err;
    }
}

const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

const handleApiResponse = (response: any): ImageFile => {
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return {
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
                name: 'generated-image.png',
            };
        }
    }
    
    const safetyText = response.candidates?.[0]?.finishReason;
    if (safetyText && safetyText !== 'STOP') {
        throw new Error(`Image generation failed due to safety settings: ${safetyText}`);
    }

    throw new Error('No image was generated by the model.');
};

export async function generateImage(
  productImages: ImageFile[],
  prompt: string,
  styleImages: ImageFile[] | null,
  aspectRatio: string = "1:1",
  config?: AIConfig,
  signal?: AbortSignal
): Promise<ImageFile> {
  const model = config?.modelId || 'gemini-2.0-flash';
  const parts: any[] = [];
  const startTime = Date.now();

  // Add product references if they exist
  if (productImages && productImages.length > 0) {
    productImages.forEach(productImage => {
        parts.push({
          inlineData: {
            data: productImage.base64,
            mimeType: productImage.mimeType,
          },
        });
      });
  }
  
  parts.push({ text: prompt });

  if (styleImages && styleImages.length > 0) {
    styleImages.forEach(styleImage => {
      parts.push({
        inlineData: {
          data: styleImage.base64,
          mimeType: styleImage.mimeType,
        },
      });
    });
  }

  try {
    const provider = config?.provider;
    if ((provider === 'custom' || provider === 'external') && config?.externalServiceConfig) {
      const { IntegrationService } = await import('./integrationService');
      const resp = await IntegrationService.smartCall('custom', {
        prompt,
        systemInstruction: 'Generate an image based on this description.',
        signal,
      }, {
        endpoint: config.externalServiceConfig.url,
        apiKeys: [],
        authType: 'header',
        authHeaderName: 'Authorization',
        name: config.externalServiceConfig.name,
        requestTemplate: JSON.stringify({
          prompt: '{{prompt}}',
          model: '{{model}}',
        }),
        responsePath: 'data.url',
      });
      const text = resp.message || '';
      // If response contains a URL, fetch and return as ImageFile
      if (text.startsWith('http')) {
        const imgRes = await fetch(text);
        const blob = await imgRes.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
        await logApiInteraction(`Custom:${model}`, 200, Date.now() - startTime);
        return { base64, mimeType: blob.type || 'image/png', name: 'generated-image.png' };
      }
      await logApiInteraction(`Custom:${model}`, 200, Date.now() - startTime);
      return { base64: text, mimeType: 'image/png', name: 'generated-image.png' };
    }

    const response = await googleAICall(model, { parts: parts }, {
      imageConfig: { aspectRatio: aspectRatio as any }
    }, signal);

    const result = handleApiResponse(response);
    await logApiInteraction(`Gemini:${model}`, 200, Date.now() - startTime);
    return result;

  } catch (error) {
    console.error('Error calling API for generation:', error);
    await logApiInteraction(`${config?.provider || 'Gemini'}:${model}`, 500, Date.now() - startTime, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function editImage(
  baseImage: ImageFile,
  prompt: string,
  config?: AIConfig,
  signal?: AbortSignal
): Promise<ImageFile> {
  const model = config?.modelId || 'gemini-2.0-flash';

  const parts: any[] = [
    {
      inlineData: {
        data: baseImage.base64,
        mimeType: baseImage.mimeType,
      },
    },
    { text: prompt },
  ];

  try {
    const response = await googleAICall(model, { parts: parts }, undefined, signal);
    return handleApiResponse(response);

  } catch (error) {
    console.error('Error calling Gemini API for editing:', error);
    throw error;
  }
}

export async function expandImage(
  image: ImageFile,
  prompt: string,
  signal?: AbortSignal
): Promise<ImageFile> {
  return editImage(image, prompt, undefined, signal);
}

export async function analyzeImageForPrompt(
  images: ImageFile[],
  instructions: string,
  config?: AIConfig,
  signal?: AbortSignal
): Promise<string> {
  const model = config?.modelId || 'gemini-2.0-flash';
  const parts: any[] = [];

  images.forEach(image => {
    parts.push({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    });
  });

  let textPrompt = `Analyze the provided image(s) in detail. Craft a descriptive prompt for an AI model. Instruction: ${instructions}`;
  parts.push({ text: textPrompt });

  try {
    const response = await googleAICall(model, { parts: parts }, undefined, signal);
    return response.text?.trim() || '';
  } catch (error) {
    throw error;
  }
}

export async function analyzeStyleImage(images: ImageFile[], signal?: AbortSignal): Promise<string> {
  const model = 'gemini-2.0-flash';
  const parts: any[] = images.map(img => ({
    inlineData: {
      data: img.base64,
      mimeType: img.mimeType,
    },
  }));
  parts.push({ text: "Analyze the visual style of these images. Describe the lighting, color palette, mood, and aesthetic in detail for a text-to-image prompt." });

  try {
    const response = await googleAICall(model, { parts: parts }, undefined, signal);
    return response.text?.trim() || '';
  } catch (error) {
    console.error('Error analyzing style image:', error);
    throw error;
  }
}

export async function analyzeLogoForBranding(images: ImageFile[], signal?: AbortSignal): Promise<{ colors: string[] }> {
  const model = 'gemini-2.0-flash';
  const parts: any[] = images.map(img => ({
    inlineData: {
      data: img.base64,
      mimeType: img.mimeType,
    },
  }));
  parts.push({ text: "Analyze this logo and extract the primary brand colors. Return them as a JSON object with a 'colors' key containing a string array of hex codes." });

  try {
    const response = await googleAICall(model, { parts: parts }, {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          colors: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Hex color codes representing the logo palette"
          }
        },
        required: ["colors"]
      }
    }, signal);
    const text = response.text || '{"colors": []}';
    return JSON.parse(text);
  } catch (error) {
    console.error('Error analyzing logo for branding:', error);
    throw error;
  }
}

export async function generatePromptFromText(instructions: string, config?: AIConfig, signal?: AbortSignal): Promise<string> {
  const model = config?.modelId || 'gemini-2.0-flash';
  const prompt = `Expand this idea into a detailed text-to-image prompt: "${instructions}"`;
  try {
    const response = await googleAICall(model, { parts: [{ text: prompt }] }, undefined, signal);
    return response.text?.trim() || '';
  } catch (error) {
    throw error;
  }
}

export async function translateText(text: string, signal?: AbortSignal): Promise<string> {
  const model = 'gemini-2.0-flash';
  const prompt = `Translate the following text to English, preserving any technical or descriptive nuances: "${text}"`;
  try {
    const response = await googleAICall(model, { parts: [{ text: prompt }] }, undefined, signal);
    return response.text?.trim() || '';
  } catch (error) {
    throw error;
  }
}

export async function generateSpeech(text: string, styleInstructions: string, voiceName: string, config?: AIConfig, signal?: AbortSignal): Promise<AudioFile> {
  const model = config?.modelId || "gemini-3.1-flash-tts-preview";
  const prompt = `Speak the following text ${styleInstructions ? '(' + styleInstructions + ')' : ''}: ${text}`;
  
  try {
    const response = await googleAICall(model, { parts: [{ text: prompt }] }, {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName },
        },
      },
    }, signal);

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio data returned from the model.');
    }

    return {
      base64: base64Audio,
      name: `voiceover-${Date.now()}.wav`,
    };
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

export async function generateCampaignPlan(
    productImages: ImageFile[],
    userPrompt: string,
    targetMarket: string = "Global",
    dialect: string = "English",
    config?: AIConfig,
    signal?: AbortSignal
): Promise<any[]> {
    const model = config?.modelId || 'gemini-2.0-flash';
    const parts: any[] = [];

    if (productImages && productImages.length > 0) {
        productImages.forEach(img => parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } }));
    }

    const instruction = `Act as a professional Creative Director and Marketing Strategist. 
    Target Market: ${targetMarket}. Requested Content Dialect/Language: ${dialect}.
    Goal: "${userPrompt}". 
    
    Task: Generate 9 unique campaign post ideas tailored for the specified market and written in the requested dialect.
    Return a JSON array where each object has:
    - id: string
    - scenario: highly descriptive visual prompt for AI image generation (English). If no product image was provided, describe the subject/product from the user's goal.
    - caption: engaging social media caption written STRICTLY in the specified dialect (${dialect})
    - tov: a short, catchy text suggestion or hook (max 5-7 words) derived from the caption, intended to be written directly on the design/visual itself.
    - schedule: recommended posting day/time for the ${targetMarket} market.
    Return ONLY the raw JSON array.`;

    parts.push({ text: instruction });

    try {
        const response = await googleAICall(model, { parts }, {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        id: { type: "STRING" },
                        scenario: { type: "STRING" },
                        caption: { type: "STRING" },
                        tov: { type: "STRING" },
                        schedule: { type: "STRING" },
                    },
                    required: ["id", "scenario", "caption", "tov", "schedule"]
                }
            }
        }, signal);
        const text = response.text || '[]';
        return JSON.parse(text.trim());
    } catch (err) {
        console.error("Plan generation failed:", err);
        throw err;
    }
}

export async function analyzeProductForCampaign(productImages: ImageFile[], signal?: AbortSignal): Promise<string> {
    const model = 'gemini-2.0-flash';
    const parts: any[] = [];
    productImages.forEach(img => parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } }));

    const prompt = `Analyze these image(s) to identify the product/service category and its market positioning. 
    Return a concise analysis including:
    1. Identified Category (e.g. Luxury Watches, Organic Skincare, Tech Services).
    2. Best Market Fit: Describe the ideal setting and audience for this product based on current market trends.
    Format as a clear, professional summary.`;
    
    parts.push({ text: prompt });

    try {
        const response = await googleAICall(model, { parts }, undefined, signal);
        return response.text?.trim() || '';
    } catch (error) {
        throw error;
    }
}

export async function generateStoryboardPlan(
    script: string,
    visualStyle: string,
    aspectRatio: string,
    config?: AIConfig
): Promise<any[]> {
    const model = config?.modelId || 'gemini-2.0-flash';
    const instruction = `Act as a cinematic Storyboard Director, Scriptwriter, and Visual Artist. 
    Script/Context: "${script}".
    Intended Visual Style: "${visualStyle}".
    Aspect Ratio: ${aspectRatio}.
    
    Task: Create a professional cinematic storyboard sequence (exactly 12 frames) that tells a compelling story based on the script.
    
    For each frame, provide:
    - sequence: incrementing number starting from 1
    - description: what is happening in the scene (detailed action)
    - dialogue: any character speech or narration
    - shotType: technical shot description (e.g. Extreme Close-up, Wide Shot, Dutch Angle)
    - cameraMovement: how the camera moves (e.g. Truck Left, Tilt Up, Static)
    - lighting: the lighting setup (e.g. Backlit, Chiaroscuro, High Key)
    - location: where the scene takes place
    - duration: estimated time in seconds (e.g. 3.5s)
    - visualPrompt: extremely detailed English prompt for an AI image generator to create THIS specific frame. Include the visual style "${visualStyle}" and maintain character consistency.
    - notes: director's or cinematographer's notes
    
    Return a JSON array of 12 objects. 
    Return ONLY raw JSON.`;

    try {
        const response = await callAI(instruction, config || { provider: 'google', modelId: model });
        
        // Clean the response from markdown if present
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        const cleanJson = jsonMatch ? jsonMatch[0] : response;
        
        return JSON.parse(cleanJson);
    } catch (err) {
        console.error("Storyboard plan failed:", err);
        throw err;
    }
}

export async function generateCharacterAnalysis(script: string, aiConfig: AIConfig): Promise<string> {
    const prompt = `Perform a deep character analysis based on this script: ${script}.
    Include:
    1. Key Character Profiles (Name, Role, Motivations, Appearance).
    2. Character Consistency Guidelines for Visual Generation.
    3. Archetype Analysis.
    4. Wardrobe & Physical Trait suggestions.
    Use Markdown.`;
    return await callAI(prompt, aiConfig);
}

export async function generateLocationGuide(script: string, aiConfig: AIConfig): Promise<string> {
    const prompt = `Generate a Location Scout & Production Design guide based on this script: ${script}.
    Include:
    1. Location breakdown (Interior/Exterior).
    2. Atmospheric & Mood descriptions for each environment.
    3. Props & Essential Set Pieces.
    4. Color Palette suggestions per location.
    Use Markdown.`;
    return await callAI(prompt, aiConfig);
}

export async function generateMarketingAnalysis(
    brandData: { 
        type: 'new' | 'existing'; 
        name?: string; 
        specialty?: string; 
        brief?: string; 
        link?: string;
        platforms?: string[];
        tone?: string;
        goal?: string;
        competitors?: string;
        budget?: string;
        archetype?: string;
        painPoints?: string;
        campaignType?: string;
        traditionalChannels?: string[];
        seoFocus?: string;
        conversionGoal?: string;
        
        // Detailed inputs
        marketTrends?: string;
        targetAudience?: string;
        targetDemographics?: string;
        perceivedStrengths?: string;
        perceivedWeaknesses?: string;
        perceivedOpportunities?: string;
        perceivedThreats?: string;
        positioningStatement?: string;
        uniqueSellingPoint?: string;
        campaignDuration?: string;
        successMetrics?: string;
        resourceRequirements?: string;
    },
    language: 'ar' | 'en',
    aiConfig: AIConfig
): Promise<string> {
    let context = '';
    const platformCtx = brandData.platforms && brandData.platforms.length > 0 ? ` Focus specifically on these platforms: ${brandData.platforms.join(', ')}.` : '';
    const toneCtx = brandData.tone ? ` The desired tone for all content is ${brandData.tone}.` : '';
    const goalCtx = brandData.goal ? ` The primary campaign goal is ${brandData.goal}.` : '';
    const competitorsCtx = brandData.competitors ? ` Key competitors to analyze against: ${brandData.competitors}.` : '';
    const budgetCtx = brandData.budget ? ` Monthly budget: $${brandData.budget}.` : '';
    const archetypeCtx = brandData.archetype ? ` Strategy Archetype: ${brandData.archetype}.` : '';
    const painPointsCtx = brandData.painPoints ? ` Addressing user pain points: ${brandData.painPoints}.` : '';
    const digitalCtx = brandData.seoFocus ? ` \nONLINE FOCUS: SEO on ${brandData.seoFocus}, Goal: ${brandData.conversionGoal}.` : '';
    const traditionalCtx = (brandData.traditionalChannels && brandData.traditionalChannels.length > 0) ? ` \nOFFLINE FOCUS: ${brandData.traditionalChannels.join(', ')}.` : '';
    
    // Add extra granular context
    const planCtx = `\nCAMPAIGN DURATION: ${brandData.campaignDuration || 'Unspecified'}. 
    SUCCESS METRICS: ${brandData.successMetrics || 'Unspecified'}. 
    RESOURCES: ${brandData.resourceRequirements || 'Unspecified'}.`;

    if (brandData.type === 'existing') {
        context = `Analyze brand from: ${brandData.link}.${platformCtx}${toneCtx}${goalCtx}${budgetCtx}${archetypeCtx}${painPointsCtx}${digitalCtx}${traditionalCtx}${planCtx}`;
    } else {
        context = `Strategy for NEW brand: ${brandData.name}. Specialty: ${brandData.specialty}. Brief: ${brandData.brief}.${competitorsCtx}${platformCtx}${toneCtx}${goalCtx}${budgetCtx}${archetypeCtx}${painPointsCtx}${digitalCtx}${traditionalCtx}${planCtx}`;
    }

    const prompt = `Act as a world-class CMO and Marketing Strategist. 
    ${context}
    
    Task: Provide a detailed, professional marketing strategy report.
    Language: ${language === 'ar' ? 'Arabic' : 'English'}.
    
    The report MUST include:
    1. SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats).
    2. Detailed Buyer Persona (Demographics, Psychographics, Buying Behavior).
    3. Competitor Analysis & Market Gaps.
    4. Value Proposition (USP) and Messaging Pillars.
    5. HYBRID Go-To-Market (GTM) Strategy (Digital + Traditional integration).
    6. Specific Performance Marketing Hacks.
    7. SEO & Organic Roadmap.
    8. 30-60-90 Day Execution Roadmap.
    9. Growth KPI Dashboard recommendations.
    
    Format the output with professional headers, bullet points, and a tone of high-level business consultation.
    Use Markdown for formatting.`;

    try {
        return await callAI(prompt, aiConfig);
    } catch (err) {
        console.error("Marketing strategy generation failed:", err);
        throw err;
    }
}

export async function generateDigitalStrategy(
    brandData: any,
    aiConfig: AIConfig
): Promise<string> {
    const context = `
    TARGET: ${brandData.name || brandData.link}
    SEO FOCUS: ${brandData.seoFocus || 'General'}
    CONVERSION GOAL: ${brandData.conversionGoal || 'Unspecified'}
    PAIN POINTS: ${brandData.painPoints || 'Unspecified'}
    PLATFORMS: ${brandData.platforms?.join(', ')}
    `;
    const prompt = `Develop a high-performance Digital Growth Strategy for: ${context}.
    Include:
    1. Channel-specific tactics (e.g. Meta vs TikTok).
    2. SEO Keyword Clusters & Content Pillars.
    3. Conversion Rate Optimization (CRO) Hacks.
    4. Paid Ad Funnel Structure.
    5. Technical Analytics Checklist.
    Use Markdown.`;
    return await callAI(prompt, aiConfig);
}

export async function generateTraditionalStrategy(
    brandData: any,
    aiConfig: AIConfig
): Promise<string> {
    const context = `
    TARGET: ${brandData.name || brandData.link}
    CHANNELS: ${brandData.traditionalChannels?.join(', ')}
    EVENT VISION: ${brandData.eventStrategy || 'Unspecified'}
    PHYSICAL SPECS: ${brandData.printMediaDetails || 'Unspecified'}
    `;
    const prompt = `Develop a high-impact Traditional Marketing & Offline Strategy for: ${context}.
    Include:
    1. Creative Outdoor/Offline Concepts (Billboards, Ambient).
    2. Event Activation & Guerilla Marketing roadmap.
    3. Print Media & Physical Tangibility Strategy.
    4. Hybrid QR-to-Digital bridging tactics.
    5. Local Community Engagement strategies.
    Use Markdown.`;
    return await callAI(prompt, aiConfig);
}

export async function generateSWOTAnalysis(
    brandData: { 
        type: 'new' | 'existing', 
        name?: string, 
        link?: string, 
        specialty?: string, 
        brief?: string,
        competitors?: string,
        perceivedStrengths?: string,
        perceivedWeaknesses?: string,
        perceivedOpportunities?: string,
        perceivedThreats?: string
    },
    aiConfig: AIConfig
): Promise<string> {
    const brandStr = brandData.type === 'existing' ? `Target: ${brandData.link}` : `Name: ${brandData.name}, Niche: ${brandData.specialty}, Brief: ${brandData.brief}`;
    const context = `
    ${brandStr}
    USER PERCEIVED STRENGTHS: ${brandData.perceivedStrengths || 'Not provided'}
    USER PERCEIVED WEAKNESSES: ${brandData.perceivedWeaknesses || 'Not provided'}
    USER PERCEIVED OPPORTUNITIES: ${brandData.perceivedOpportunities || 'Not provided'}
    USER PERCEIVED THREATS: ${brandData.perceivedThreats || 'Not provided'}
    `;
    const prompt = `Perform a world-class SWOT Analysis for: ${context}.
    Combine the user's perceived factors with your external market knowledge to provide an elite strategic matrix.
    
    Format in professional Markdown:
    - Strengths (Internal/Positive)
    - Weaknesses (Internal/Negative)
    - Opportunities (External/Positive)
    - Threats (External/Negative)
    
    Be objective and provide deep strategic insights.`;
    return await callAI(prompt, aiConfig);
}

export async function generateCompetitiveStudy(
    brandData: { 
        type: 'new' | 'existing', 
        name?: string, 
        link?: string, 
        specialty?: string, 
        competitors?: string,
        positioningStatement?: string,
        uniqueSellingPoint?: string
    },
    aiConfig: AIConfig
): Promise<string> {
    const brandStr = brandData.type === 'existing' ? `Target: ${brandData.link}` : `Target: ${brandData.name} (${brandData.specialty})`;
    const competitors = brandData.competitors ? `Direct competitors: ${brandData.competitors}` : '';
    const positioning = `POSITIONING: ${brandData.positioningStatement || 'Not provided'}. USP: ${brandData.uniqueSellingPoint || 'Not provided'}.`;
    
    const prompt = `Conduct a Strategic Competitive Study.
    ${brandStr}. ${competitors}. ${positioning}
    
    Include:
    1. Market Positioning Matrix.
    2. Competitor Pricing & Value Hooks.
    3. Competitive Advantages/Disadvantages.
    4. Strategic Counter-measures.
    
    Use Markdown tables for comparison where appropriate.`;
    return await callAI(prompt, aiConfig);
}

export async function generateMarketResearch(
    brandData: { specialty: string, brief: string, marketTrends?: string, targetAudience?: string, targetDemographics?: string },
    aiConfig: AIConfig
): Promise<string> {
    const context = `
    INDUSTRY: ${brandData.specialty}
    BRIEF: ${brandData.brief}
    REPORTED TRENDS: ${brandData.marketTrends || 'Not provided'}
    TARGET AUDIENCE PSYCHOGRAPHICS: ${brandData.targetAudience || 'Not provided'}
    TARGET DEMOGRAPHICS: ${brandData.targetDemographics || 'Not provided'}
    `;
    const prompt = `Perform intensive Market Research for: ${context}.
    
    Fields to cover:
    1. Trend Analysis (Short & Long term).
    2. Audience Intent & Psychographic Shifts.
    3. Regulatory & Economic Sensitivity.
    4. High-Growth Sub-segment Opportunities.
    
    Return a detailed Markdown report.`;
    return await callAI(prompt, aiConfig);
}

export async function generateBrandManual(
    data: { 
        name: string; 
        specialty: string; 
        colors: string[]; 
        personality: string[]; 
        voice: string; 
        audience: string;
        fonts: string;
    },
    language: 'ar' | 'en',
    aiConfig: AIConfig
): Promise<string> {
    const prompt = `Act as a Senior Brand Identity Director. Based on the following brand data, generate a comprehensive Brand Identity Manual.
    
    Brand Name: ${data.name}
    Industry: ${data.specialty}
    Primary Colors: ${data.colors.join(', ')}
    Personality: ${data.personality.join(', ')}
    Voice/Tone: ${data.voice}
    Target Audience: ${data.audience}
    Font Preferences: ${data.fonts}
    
    The manual MUST include:
    1. Brand Story & Mission Statement.
    2. Visual Identity Guidelines (Color usage, Typography recommendations).
    3. Voice & Tone Guide (Dos and Donts of communication).
    4. Brand Archetype analysis.
    5. Photography & Imagery Direction.
    6. Digital & Print Usage best practices.
    
    Format with professional Markdown headers and clear sections. ${language === 'ar' ? 'Respond in Arabic.' : 'Respond in English.'}`;

    try {
        return await callAI(prompt, aiConfig);
    } catch (error) {
        console.error('Error generating brand manual:', error);
        throw error;
    }
}

export async function generateAdCopies(
    data: { 
        name: string; 
        platforms: string[]; 
        tone: string; 
        goal: string; 
        brief: string;
        language: string;
    },
    aiConfig: AIConfig
): Promise<{ platform: string, copy: string }[]> {
    const prompt = `Act as a senior social media copywriter. Generate high-converting ad copy:
    Name: ${data.name}
    Tone: ${data.tone}
    Goal: ${data.goal}
    Brief: ${data.brief}
    Platforms: ${data.platforms.join(', ')}
    Language: ${data.language === 'ar' ? 'Arabic' : 'English'}
    
    JSON object with an array "ads" containing {platform, copy}.`;

    try {
        const responseText = await callAI(prompt, aiConfig, undefined, {
            type: "OBJECT",
            properties: {
                ads: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            platform: { type: "STRING" },
                            copy: { type: "STRING" }
                        },
                        required: ["platform", "copy"]
                    }
                }
            },
            required: ["ads"]
        });
        const parsed = JSON.parse(responseText || '{"ads": []}');
        return parsed.ads || [];
    } catch (error) {
        console.error('Error generating ad copies:', error);
        return data.platforms.map(p => ({ platform: p, copy: "Failed to generate specialized copy." }));
    }
}

export async function generateMissionVisionValues(
    data: { name: string; specialty: string; audience: string; personality: string[] },
    aiConfig: AIConfig
): Promise<{ mission: string; vision: string; values: string[] }> {
    const prompt = `Generate a compelling Mission, Vision, and Core Values for:
    Name: ${data.name}
    Industry: ${data.specialty}
    Target Audience: ${data.audience}
    Personality: ${data.personality.join(', ')}
    
    Return a JSON object with keys "mission", "vision", and "values".`;

    try {
        const responseText = await callAI(prompt, aiConfig, undefined, {
            type: "OBJECT",
            properties: {
                mission: { type: "STRING" },
                vision: { type: "STRING" },
                values: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["mission", "vision", "values"]
        });
        return JSON.parse(responseText || '{"mission": "", "vision": "", "values": []}');
    } catch (error) {
        console.error('Error generating mission/vision/values:', error);
        return { mission: '', vision: '', values: [] };
    }
}

export async function generateEmailSequence(
    data: { name: string; specialty: string; goal: string; brief: string; language: string },
    aiConfig: AIConfig
): Promise<{ subject: string, body: string }[]> {
    const prompt = `Act as an email marketing expert. Create a 3-email sequence for:
    Brand: ${data.name} (${data.specialty})
    Goal: ${data.goal}
    Brief: ${data.brief}
    Language: ${data.language === 'ar' ? 'Arabic' : 'English'}
    
    Return JSON with array "emails" of {subject, body}.`;

    try {
        const responseText = await callAI(prompt, aiConfig, undefined, {
            type: "OBJECT",
            properties: {
                emails: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            subject: { type: "STRING" },
                            body: { type: "STRING" }
                        },
                        required: ["subject", "body"]
                    }
                }
            },
            required: ["emails"]
        });
        const parsed = JSON.parse(responseText || '{"emails": []}');
        return parsed.emails || [];
    } catch (error) {
        console.error('Error generating email sequence:', error);
        return [];
    }
}

export async function generateBrandPersona(
    data: { name: string; specialty: string; audience: string },
    aiConfig: AIConfig
): Promise<string> {
    const prompt = `Act as a branding psychologist. Create a detailed "Brand Persona" for:
    Brand: ${data.name}
    Industry: ${data.specialty}
    Target Audience: ${data.audience}`;

    try {
        return await callAI(prompt, aiConfig);
    } catch (error) {
        console.error('Error generating brand persona:', error);
        return "Failed to generate persona.";
    }
}

export async function generateInfluencerAndCalendar(
    data: { name: string; specialty: string; goal: string; brief: string; language: string },
    aiConfig: AIConfig
): Promise<{ influencerStrategy: string; contentCalendar: { day: string, topic: string, format: string }[] }> {
    const prompt = `Act as a digital marketing director. Create influencer mapping and 7-day content calendar for:
    Brand: ${data.name} (${data.specialty})
    Goal: ${data.goal}
    Brief: ${data.brief}
    Language: ${data.language === 'ar' ? 'Arabic' : 'English'}
    
    JSON object with: "influencerStrategy" and "contentCalendar" (array of {day, topic, format}).`;

    try {
        const responseText = await callAI(prompt, aiConfig, undefined, {
            type: "OBJECT",
            properties: {
                influencerStrategy: { type: "STRING" },
                contentCalendar: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            day: { type: "STRING" },
                            topic: { type: "STRING" },
                            format: { type: "STRING" }
                        },
                        required: ["day", "topic", "format"]
                    }
                }
            },
            required: ["influencerStrategy", "contentCalendar"]
        });
        return JSON.parse(responseText || '{"influencerStrategy": "", "contentCalendar": []}');
    } catch (error) {
        console.error('Error generating influencer/calendar:', error);
        return { influencerStrategy: '', contentCalendar: [] };
    }
}

export async function generateMarketingAssets(
    data: { name: string; specialty: string; brief: string; language: string },
    aiConfig: AIConfig
): Promise<{ socialBios: { platform: string, bio: string }[], hashtags: string[], customerJourney: { stage: string, action: string, message: string }[] }> {
    const prompt = `Generate digital marketing assets: 
    Brand: ${data.name} (${data.specialty})
    Language: ${data.language}
    
    JSON object with: "socialBios" ([{platform, bio}]), "hashtags" ([]), "customerJourney" ([{stage, action, message}]).`;

    try {
        const resultText = await callAI(prompt, aiConfig, undefined, {
            type: "OBJECT",
            properties: {
                socialBios: { 
                    type: "ARRAY", 
                    items: { 
                        type: "OBJECT", 
                        properties: { platform: { type: "STRING" }, bio: { type: "STRING" } },
                        required: ["platform", "bio"]
                    } 
                },
                hashtags: { type: "ARRAY", items: { type: "STRING" } },
                customerJourney: { 
                    type: "ARRAY", 
                    items: { 
                        type: "OBJECT", 
                        properties: { stage: { type: "STRING" }, action: { type: "STRING" }, message: { type: "STRING" } },
                        required: ["stage", "action", "message"]
                    } 
                }
            },
            required: ["socialBios", "hashtags", "customerJourney"]
        });
        return JSON.parse(resultText || '{"socialBios":[], "hashtags":[], "customerJourney":[]}');
    } catch (error) {
        console.error('Error generating marketing assets:', error);
        return { socialBios: [], hashtags: [], customerJourney: [] };
    }
}

export async function generateBrandStory(
    data: { name: string; specialty: string; audience: string; personality: string[] },
    aiConfig: AIConfig
): Promise<string> {
    const prompt = `Act as a world-class Copywriter and Brand Storyteller. Create a compelling "Brand Story" for:
    Brand: ${data.name}
    Industry: ${data.specialty}
    Target Audience: ${data.audience}
    Traits: ${data.personality.join(', ')}
    
    The story should be emotional, grounded, and clearly articulate the 'Why' behind the brand. Use a narrative style that builds trust and excitement.`;

    try {
        return await callAI(prompt, aiConfig);
    } catch (error) {
        console.error('Error generating brand story:', error);
        return "Failed to generate brand story.";
    }
}

export async function generateCompetitorAnalysis(
    data: { name: string; specialty: string; audience: string },
    aiConfig: AIConfig
): Promise<string> {
    const prompt = `Act as a Strategic Market Analyst. Provide a brief but professional "Competitor Analysis & Market Position" for:
    Brand: ${data.name}
    Industry: ${data.specialty}
    Target Audience: ${data.audience}
    
    Identify potential competitors, market gaps, and where this brand should position itself to stand out (Blue Ocean Strategy).`;

    try {
        return await callAI(prompt, aiConfig);
    } catch (error) {
        console.error('Error generating competitor analysis:', error);
        return "Failed to generate competitor analysis.";
    }
}

export async function deconstructImageForPrompts(
    images: ImageFile[],
    aiConfig: AIConfig
): Promise<{ subject: string; lighting: string; composition: string; technical: string; style: string }> {
    const prompt = `Act as an expert prompt engineer and digital cinematographer. Analyze the provided image(s) and deconstruct them into these specific technical layers:
    - Subject: What is the main focal point? Describe it with high detail.
    - Lighting: What is the light source, quality, color, and direction?
    - Composition: Camera angle, depth of field, framing, and lens perspective.
    - Technical: Film stock, camera gear, aperture, or digital artifacts.
    - Style: Artistic movement, era, mood, and color grade.

    Return the analysis as a JSON object with these keys: subject, lighting, composition, technical, style. Return ONLY the JSON object.`;

    try {
        const response = await callAIWithImages(prompt, images, aiConfig);
        try {
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            return {
                subject: response,
                lighting: "Detected in analysis",
                composition: "Detected in analysis",
                technical: "Detected in analysis",
                style: "Detected in analysis"
            };
        }
    } catch (error) {
        console.error('Error deconstructing image:', error);
        throw error;
    }
}

export async function generateProfessionalPrompt(
    data: { deconstruction?: any; instructions: string; parameters?: any },
    aiConfig: AIConfig
): Promise<string> {
    const prompt = `Act as a Professional AI Prompt Engineer. Create a MASTER PROMPT based on:
    ${data.deconstruction ? `Base DNA: ${JSON.stringify(data.deconstruction)}` : ''}
    User Instructions: ${data.instructions}
    Technical Parameters: ${JSON.stringify(data.parameters || {})}
    
    The prompt should be structured for high-end diffusion models. Use specific cinematic language. 
    Focus on hyper-realism and precise artistic direction.
    
    Format: Return ONLY the final prompt text. No quotes, no intro.`;

    try {
        return await callAI(prompt, aiConfig);
    } catch (error) {
        console.error('Error generating professional prompt:', error);
        return "Failed to generate prompt.";
    }
}

export async function generateMoodboardPlan(prompt: string, aiConfig: AIConfig): Promise<any[]> {
    const instruction = `Act as a Visual Art Director.
    Goal: Create 4 distinct visual style concepts for a project titled/described as: "${prompt}".
    
    For each concept, provide:
    - title: name of the style (e.g. Noir Thriller, Pastel Dream, Industrial Grime)
    - description: what makes this style unique
    - prompt: a detailed text-to-image prompt to visualize this mood
    
    Return a JSON array of 4 objects. Return ONLY raw JSON.`;

    try {
        const response = await callAI(instruction, aiConfig);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : response);
    } catch (err) {
        console.error("Moodboard generation failed:", err);
        return [];
    }
}

export async function generateShotScript(scenes: any[], aiConfig: AIConfig): Promise<string> {
    const instruction = `Act as a Technical Screenwriter. Review these ${scenes.length} storyboard frames and expand them into a professional shot-by-shot production script. Include camera settings, blocking, and detailed audio descriptions.
    Scenes: ${JSON.stringify(scenes.map(s => ({ id: s.id, desc: s.description, dialogue: s.dialogue })))}
    Use Markdown with clear scene headings.`;

    try {
        return await callAI(instruction, aiConfig);
    } catch (err) {
        return "Failed to generate technical script.";
    }
}

export async function generateDirectorCritique(scene: any, previousScene: any | null, aiConfig: AIConfig, signal?: AbortSignal): Promise<string> {
    const model = aiConfig?.modelId || 'gemini-2.0-flash';
    const instruction = `Act as a Senior Film Director. Critique the following shot selection:
    Current Shot: ${scene.shotType} with ${scene.cameraMovement} movement.
    Description: ${scene.description}
    ${previousScene ? `Previous Shot: ${previousScene.shotType} with ${previousScene.cameraMovement}.` : ''}
    
    Provide a sharp, 2-3 sentence technical critique of this cinematic choice. Mention pacing, focus, or visual impact. Return raw text.`;

    try {
        const response = await googleAICall(model, { parts: [{ text: instruction }] }, undefined, signal);
        return response.text || "Director's feedback unavailable.";
    } catch (err) {
        return "Director's feedback unavailable.";
    }
}

export async function generatePlanStrategy(
    productImages: ImageFile[],
    userPrompt: string,
    targetMarket: string,
    config?: AIConfig
): Promise<any> {
    const instruction = `Act as a Senior Business Development Strategist. Based on this goal: "${userPrompt}" for the market "${targetMarket}", architect a full business strategy.
    
    Return a JSON object with:
    - pillars: Array of 3 objects { title: string, description: string } (Content strategy)
    - personas: Array of 2 objects { title: string, description: string, painPoints: string[] }
    - swot: Object { strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] }
    - positioning: Object { valueProp: string, competitorGaps: string[], targetPricing: string }
    - roadmap: Array of 3 objects { phase: string, tasks: string[] }
    - canvas: Object { keyPartners: string[], keyActivities: string[], valueProps: string[], customerRelations: string[], segments: string[], channels: string[], costStructure: string[], revenueStreams: string[] }
    - battleCards: Array of 2 objects { competitor: string, strengths: string, weaknesses: string, killShot: string }
    - pitchDeck: Array of 5 objects { slide: string, content: string } (Title, Problem, Solution, Market, Ask)
    
    Return ONLY raw JSON. Do not include markdown blocks.`;

    try {
        const response = await callAI(instruction, config);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : response);
    } catch (err) {
        console.error("Business architecture failed:", err);
        return null;
    }
}

export async function generateBrandStrategy(prompt: string, aiConfig: AIConfig): Promise<any> {
    const instruction = `Act as a World-Class Brand Strategist. Based on the following brief: "${prompt}", develop a comprehensive brand strategy.
    
    Return a JSON object with:
    - archetype: One of the 12 brand archetypes (e.g. The Hero, The Creator, The Outlaw)
    - missionStatement: A powerful mission statement
    - visionStatement: An inspiring vision statement
    - coreValues: Array of 5 core values
    - brandPersonality: Array of 5 personality traits
    - brandStory: A compelling 3-paragraph brand origin story
    - targetAudience: Detailed description of the ideal customer persona
    - brandVoice: Description of the brand's tone of voice
    
    Return ONLY raw JSON.`;

    try {
        const response = await callAI(instruction, aiConfig);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : response);
    } catch (err) {
        console.error("Brand strategy generation failed:", err);
        return null;
    }
}

export async function generateNeuralNaming(prompt: string, aiConfig: AIConfig): Promise<any[]> {
    const instruction = `Act as a Professional Naming Specialist. Generate 10 highly creative, memorable, and industry-appropriate names for: "${prompt}".
    
    For each name, provide:
    - name: The brand name
    - tagline: A short, punchy tagline
    - logic: The semantic or emotional reasoning behind the name
    
    Return a JSON array of 10 objects. Return ONLY raw JSON.`;

    try {
        const response = await callAI(instruction, aiConfig);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : response);
    } catch (err) {
        console.error("Neural naming failed:", err);
        return [];
    }
}

export async function generateVisualIdentity(prompt: string, strategy: any, aiConfig: AIConfig): Promise<any> {
    const instruction = `Act as a Visual Identity Designer. Based on the brand strategy: ${JSON.stringify(strategy)}, create a professional visual identity.
    
    Return a JSON object with:
    - colors: Array of 3 primary HEX colors that match the archetype
    - secondaryColors: Array of 2 complementary HEX colors
    - typography: Object with { primary: "Google Font for Headings", secondary: "Google Font for Body" }
    - designDirection: 1-paragraph explanation of the aesthetic choice
    
    Return ONLY raw JSON.`;

    try {
        const response = await callAI(instruction, aiConfig);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : response);
    } catch (err) {
        console.error("Visual identity generation failed:", err);
        return null;
    }
}
