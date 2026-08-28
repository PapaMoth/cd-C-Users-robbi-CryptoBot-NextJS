import OpenAI from 'openai';
import { NextResponse } from 'next/server';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY=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;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  return new OpenAI({ apiKey });
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeBlueprint(data, input) {
  return {
    title: data?.title || `${input.niche} Faceless Reel`,
    hook: data?.hook || `If you're ${input.audience}, stop scrolling.`,
    voiceover:
      data?.voiceover ||
      `Here is a ${input.duration} reel about ${input.niche} for ${input.audience}. End with ${input.cta}.`,
    shotList: Array.isArray(data?.shotList)
      ? data.shotList
      : [
          'Strong title card opener',
          'Problem visual',
          'Quick tip breakdown',
          'Proof or outcome shot',
          `End frame with CTA: ${input.cta}`,
        ],
    onScreenCaptions: Array.isArray(data?.onScreenCaptions)
      ? data.onScreenCaptions
      : ['Stop scrolling', 'Do this first', 'Save this'],
    hashtags:
      data?.hashtags ||
      `#facelessreels #contentcreator #shortformvideo #${input.niche
        .toLowerCase()
        .replace(/\s+/g, '')}`,
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      niche = 'Content Marketing',
      duration = '30s',
      tone = 'Educational',
      audience = 'creators',
      cta = 'Follow for more',
    } = body || {};

    const prompt = `
Create a high-performing faceless short-form reel blueprint.

Return ONLY valid JSON.
No markdown.
No code fences.
No explanation.

Use this exact shape:
{
  "title": "string",
  "hook": "string",
  "voiceover": "string",
  "shotList": ["string"],
  "onScreenCaptions": ["string"],
  "hashtags": "string"
}

Requirements:
- Make it specific and punchy
- Optimize for social retention
- Voiceover should fit roughly ${duration}
- Tone: ${tone}
- Audience: ${audience}
- Topic/Niche: ${niche}
- CTA: ${cta}
- Include 5 to 8 shotList items
- Include 4 to 6 onScreenCaptions
- Hashtags should be relevant and compact
`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'sora 2',
      temperature: 0.9,
      messages: [
        {
          role: 'system',
          content:
            'You generate viral short-form content blueprints as strict JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content || '';
    const parsed = safeParse(text);

    return NextResponse.json(
      normalizeBlueprint(parsed, { niche, duration, tone, audience, cta })
    );
  } catch (error) {
    console.error('generate-reel route error:', error);

    return NextResponse.json(
      { error: 'Failed to generate reel blueprint.' },
      { status: 500 }
    );
  }
}
