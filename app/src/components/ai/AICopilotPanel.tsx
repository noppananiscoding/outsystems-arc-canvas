'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { useArchitectureStore } from '@/store/architecture-store';
import { serializeCanvasContext } from '@/lib/ai-context';
import { Module, ValidationViolation } from '@/types/architecture';
import ChatMessage, { ChatMessageData } from './ChatMessage';
import { v4 as uuidv4 } from 'uuid';

interface AICopilotPanelProps {
  open: boolean;
  onClose: () => void;
  modules: Module[];
  violations: ValidationViolation[];
  projectName: string;
}

const QUICK_PROMPTS = [
  'Explain my violations',
  'Review my design',
  'Suggest improvements',
  'Best practices check',
];

/** Convert raw API/SDK error messages into short human-readable strings */
function parseAIError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes('429') || raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('rate')) {
    // Try to extract retry delay
    const retryMatch = raw.match(/retryDelay["\s:]+(\d+)/);
    const retrySeconds = retryMatch ? `~${retryMatch[1]}s` : 'a moment';
    return `Rate limit reached. You've exceeded your free-tier quota. Please wait ${retrySeconds} and try again, or upgrade your API plan.`;
  }
  if (raw.includes('401') || raw.toLowerCase().includes('api key') || raw.toLowerCase().includes('api_key') || raw.toLowerCase().includes('invalid key')) {
    return 'Invalid API key. Please check your AI settings and re-enter your key.';
  }
  if (raw.includes('403')) {
    return 'Access denied. Your API key may not have permission for this model.';
  }
  if (raw.includes('500') || raw.includes('503')) {
    return 'The AI provider is temporarily unavailable. Please try again in a moment.';
  }
  if (raw.toLowerCase().includes('fetch') || raw.toLowerCase().includes('network') || raw.toLowerCase().includes('enotfound')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  // Fallback — strip huge JSON blobs
  const truncated = raw.length > 200 ? raw.slice(0, 200) + '…' : raw;
  return truncated;
}

type PanelSize = 'normal' | 'expanded' | 'collapsed';

export default function AICopilotPanel({
  open,
  onClose,
  modules,
  violations,
  projectName,
}: AICopilotPanelProps) {
  const { aiProvider, aiApiKey, aiModel } = useArchitectureStore();

  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [size, setSize] = useState<PanelSize>('normal');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (size !== 'collapsed') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, size]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const canvasContext = serializeCanvasContext(modules, violations, projectName);

      const userMsg: ChatMessageData = { id: uuidv4(), role: 'user', content: trimmed };
      const assistantId = uuidv4();
      const assistantPlaceholder: ChatMessageData = {
        id: assistantId, role: 'assistant', content: '', streaming: true, provider: aiProvider,
      };

      setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
      setInput('');
      setStreaming(true);

      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ message: trimmed, history, canvasContext, provider: aiProvider, apiKey: aiApiKey, model: aiModel }),
        });

        if (!res.ok || !res.body) {
          const errData = await res.json() as { error?: string };
          throw new Error(errData.error ?? `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulated, streaming: true } : m));
        }

        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulated, streaming: false } : m));
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: (m.content || '') + '\n\n*Cancelled.*', streaming: false } : m));
        } else {
          const friendly = parseAIError(err);
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: friendly, streaming: false, isError: true } : m));
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, messages, modules, violations, projectName, aiProvider, aiApiKey, aiModel]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  if (!open) return null;

  const panelWidth = size === 'expanded' ? 'w-[680px]' : 'w-[480px]';

  /* ── Collapsed state: slim bottom-right bar ── */
  if (size === 'collapsed') {
    return (
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl px-4 py-2.5">
        <Sparkles size={14} className="text-indigo-400" />
        <span className="text-white text-sm font-semibold">AI Copilot</span>
        {messages.length > 0 && (
          <span className="text-[10px] bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
            {messages.length} msg{messages.length !== 1 ? 's' : ''}
          </span>
        )}
        <button onClick={() => setSize('normal')} title="Expand" className="text-gray-400 hover:text-white transition-colors cursor-pointer ml-1">
          <ChevronUp size={15} />
        </button>
        <button onClick={onClose} title="Close" className="text-gray-400 hover:text-white transition-colors cursor-pointer">
          <X size={14} />
        </button>
      </div>
    );
  }

  /* ── Normal / Expanded state ── */
  return (
    <div
      className={`fixed top-0 right-0 h-full ${panelWidth} bg-gray-900 border-l border-gray-700 flex flex-col z-40 shadow-2xl overflow-hidden transition-[width] duration-200`}
      style={{ maxWidth: '100vw' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          <span className="text-white font-semibold text-sm">AI Copilot</span>
          <span className="text-[10px] bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
            {aiProvider}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Expand / Normal toggle */}
          <button
            onClick={() => setSize(s => s === 'expanded' ? 'normal' : 'expanded')}
            title={size === 'expanded' ? 'Shrink panel' : 'Expand panel'}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-gray-700"
          >
            {size === 'expanded' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          {/* Collapse to bar */}
          <button
            onClick={() => setSize('collapsed')}
            title="Minimise"
            className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-gray-700"
          >
            <ChevronDown size={14} />
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            title="Close"
            className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-gray-700"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 min-w-0 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-12 h-12 rounded-full bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center">
              <Sparkles size={22} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-gray-300 font-medium text-sm">Ask me anything about your OutSystems architecture</p>
              <p className="text-gray-500 text-xs mt-1">I can review violations, suggest improvements, and explain best practices.</p>
            </div>
          </div>
        ) : (
          messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompt chips */}
      <div className="px-4 py-2 border-t border-gray-800 flex-shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={streaming}
              className="flex-shrink-0 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-white px-2.5 py-1 rounded-full border border-gray-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-700 flex-shrink-0 bg-gray-900/95">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-800 border border-gray-600 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your architecture…"
              disabled={streaming}
              rows={1}
              className="w-full bg-transparent text-white text-sm px-3 py-2.5 resize-none focus:outline-none placeholder-gray-500 disabled:opacity-50"
              style={{ minHeight: '40px', maxHeight: '80px' }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors cursor-pointer"
            title="Send (Enter)"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}

