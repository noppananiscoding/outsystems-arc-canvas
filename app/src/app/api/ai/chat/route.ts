import { NextRequest } from 'next/server';
import { streamAIChat, AIProvider } from '@/lib/ai-client';
import { buildSystemPrompt } from '@/lib/system-prompt';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    message: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    canvasContext: string;
    provider: string;
    apiKey: string;
    model: string;
  };

  const { message, history, canvasContext, provider, apiKey, model } = body;

  if (!apiKey || !provider || !model) {
    return Response.json({ error: 'AI not configured' }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(canvasContext);
  const messages = [...history, { role: 'user' as const, content: message }];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAIChat(
          provider as AIProvider,
          apiKey,
          model,
          systemPrompt,
          messages
        )) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'AI error';
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
