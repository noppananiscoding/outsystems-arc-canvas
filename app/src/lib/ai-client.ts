export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Default max tokens for chat/review responses — keeps costs low */
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

/**
 * Streams AI chat responses, yielding text chunks as they arrive.
 * All calls happen server-side (via Next.js API route) so no browser
 * restrictions apply.
 * @param maxTokens Override the default output token limit. Pass undefined to use model default (no cap).
 */
export async function* streamAIChat(
  provider: AIProvider,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number | undefined = DEFAULT_MAX_OUTPUT_TOKENS
): AsyncGenerator<string> {
  if (provider === 'gemini') {
    yield* streamGemini(apiKey, model, systemPrompt, messages, maxTokens);
  } else if (provider === 'openai') {
    yield* streamOpenAI(apiKey, model, systemPrompt, messages, maxTokens);
  } else {
    yield* streamAnthropic(apiKey, model, systemPrompt, messages, maxTokens);
  }
}

async function* streamGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number | undefined
): AsyncGenerator<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
    generationConfig: maxTokens !== undefined ? { maxOutputTokens: maxTokens } : {},
  });

  // Gemini history excludes the last user message (sent separately)
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  const chat = geminiModel.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  for await (const chunk of result.stream) {
    yield chunk.text();
  }
}

async function* streamOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number | undefined
): AsyncGenerator<string> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey });

  const stream = await client.chat.completions.create({
    model,
    stream: true,
    ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
    messages: [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
  });

  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content ?? '';
  }
}

async function* streamAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number | undefined
): AsyncGenerator<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens ?? 4096,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield chunk.delta.text;
    }
  }
}

/**
 * Sends a minimal test message to verify the API key and model are valid.
 */
export async function testAIConnection(
  provider: AIProvider,
  apiKey: string,
  model: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const testMessages: AIMessage[] = [{ role: 'user', content: 'Hello' }];
    let received = false;

    for await (const chunk of streamAIChat(
      provider,
      apiKey,
      model,
      'You are a helpful assistant. Reply with a single word.',
      testMessages
    )) {
      if (chunk.length > 0) {
        received = true;
        break; // we only need the first chunk to confirm it works
      }
    }

    return received ? { ok: true } : { ok: false, error: 'No response received' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
