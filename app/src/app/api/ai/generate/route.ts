import { NextRequest } from 'next/server';
import { streamAIChat, AIProvider } from '@/lib/ai-client';
import { buildGeneratePrompt } from '@/lib/ai-generate-prompt';
import { parseAndValidateAIOutput, ParsedArchitecture } from '@/lib/ai-output-parser';

export const runtime = 'nodejs';

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
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
    description: string;
    provider: string;
    apiKey: string;
    model: string;
  };

  const { description, provider, apiKey, model } = body;

  if (!apiKey || !provider || !model) {
    return Response.json({ error: 'AI not configured' }, { status: 400 });
  }
  if (!description || !description.trim()) {
    return Response.json({ error: 'Description is required' }, { status: 400 });
  }

  const prompt = buildGeneratePrompt(description.trim());

  try {
    const rawText = await collectStream(provider as AIProvider, apiKey, model, prompt);
    const jsonStr = extractJSON(rawText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Retry
      const retryPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown fences, no explanation.`;
      const retryText = await collectStream(provider as AIProvider, apiKey, model, retryPrompt);
      const retryJson = extractJSON(retryText);
      try {
        parsed = JSON.parse(retryJson);
      } catch {
        return Response.json({ error: 'Failed to parse AI response as JSON after retry.' }, { status: 500 });
      }
    }

    const result: ParsedArchitecture = parseAndValidateAIOutput(parsed);
    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
