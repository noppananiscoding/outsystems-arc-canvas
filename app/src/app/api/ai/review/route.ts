import { NextRequest } from 'next/server';
import { streamAIChat, AIProvider } from '@/lib/ai-client';
import { buildReviewPrompt, ReviewReport } from '@/lib/ai-review-prompt';
import { Module, ValidationViolation } from '@/types/architecture';

export const runtime = 'nodejs';

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Find first { … } block
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

async function collectStream(
  provider: AIProvider,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const messages = [{ role: 'user' as const, content: prompt }];
  let result = '';
  for await (const chunk of streamAIChat(provider, apiKey, model, '', messages)) {
    result += chunk;
  }
  return result;
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
    // First attempt
    const rawText = await collectStream(provider as AIProvider, apiKey, model, prompt);
    const jsonStr = extractJSON(rawText);

    let report: ReviewReport;
    try {
      report = JSON.parse(jsonStr) as ReviewReport;
    } catch {
      // Retry with explicit instruction
      const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous response contained non-JSON content. Return ONLY valid JSON, no markdown fences, no explanation — just the JSON object.`;
      const retryText = await collectStream(provider as AIProvider, apiKey, model, retryPrompt);
      const retryJson = extractJSON(retryText);
      try {
        report = JSON.parse(retryJson) as ReviewReport;
      } catch {
        return Response.json({ error: 'Failed to parse AI response as JSON after retry.' }, { status: 500 });
      }
    }

    return Response.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
