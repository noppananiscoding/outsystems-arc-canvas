import { NextRequest } from 'next/server';
import { AIProvider } from '@/lib/ai-client';
import { buildReviewPrompt, ReviewReport } from '@/lib/ai-review-prompt';
import { Module, ValidationViolation } from '@/types/architecture';

export const runtime = 'nodejs';

/**
 * Bracket-aware JSON extractor — finds the real root closing brace
 * instead of the last `}` in the text (which may be from an inner object).
 */
function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const start = text.indexOf('{');
  if (start === -1) return text.trim();

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  const end = text.lastIndexOf('}');
  if (end > start) return text.slice(start, end + 1);
  return text.trim();
}

/**
 * Calls the AI for a JSON response using native JSON mode where supported.
 * Gemini: responseMimeType = 'application/json'
 * OpenAI: response_format = { type: 'json_object' }
 * Anthropic: non-streaming with high token limit
 */
async function callForJSON(
  provider: AIProvider,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  if (provider === 'gemini') {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  }

  if (provider === 'openai') {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });
    return completion.choices[0]?.message?.content ?? '';
  }

  // Anthropic — no JSON mode, rely on prompt engineering
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    canvasContext: string;
    modules: Module[];
    violations: ValidationViolation[];
    projectName: string;
    provider: string;
    apiKey: string;
    model: string;
  };

  const { modules, violations, projectName, provider, apiKey, model } = body;

  if (!apiKey || !provider || !model) {
    return Response.json({ error: 'AI not configured' }, { status: 400 });
  }

  const prompt = buildReviewPrompt(modules, violations, projectName);

  try {
    const rawText = await callForJSON(provider as AIProvider, apiKey, model, prompt);
    const jsonStr = extractJSON(rawText);

    let report: ReviewReport;
    try {
      report = JSON.parse(jsonStr) as ReviewReport;
    } catch {
      // Retry with a shorter, direct prompt
      const retryPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON — no markdown, no explanation. Start your response with { and end with }`;
      const retryText = await callForJSON(provider as AIProvider, apiKey, model, retryPrompt);
      const retryJson = extractJSON(retryText);
      try {
        report = JSON.parse(retryJson) as ReviewReport;
      } catch {
        const snippet = retryText.slice(0, 400).replace(/\n/g, ' ');
        return Response.json(
          { error: `Could not parse AI review response as JSON. Preview: "${snippet}"` },
          { status: 500 }
        );
      }
    }

    return Response.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

