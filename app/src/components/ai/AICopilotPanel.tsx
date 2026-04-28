'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
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

      // Add user message
      const userMsg: ChatMessageData = {
        id: uuidv4(),
        role: 'user',
        content: trimmed,
      };

      // Add streaming placeholder for assistant
      const assistantId = uuidv4();
      const assistantPlaceholder: ChatMessageData = {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
        provider: aiProvider,
      };

      setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
      setInput('');
      setStreaming(true);

      // Build history (exclude the latest streaming placeholder)
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: trimmed,
            history,
            canvasContext,
            provider: aiProvider,
            apiKey: aiApiKey,
            model: aiModel,
          }),
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
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: accumulated, streaming: true }
                : m
            )
          );
        }

        // Finalise — remove streaming flag
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: accumulated, streaming: false }
              : m
          )
        );
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') {
          // User cancelled
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: m.content + '\n\n[Cancelled]', streaming: false }
                : m
            )
          );
        } else {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: `[Error: ${errMsg}]`, streaming: false }
                : m
            )
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, messages, modules, violations, projectName, aiProvider, aiApiKey, aiModel]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed top-0 right-0 h-full w-[480px] bg-gray-900 border-l border-gray-700 flex flex-col z-40 shadow-2xl"
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
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
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
        {streaming && messages[messages.length - 1]?.streaming && messages[messages.length - 1]?.content === '' && (
          <div className="text-gray-500 text-xs italic px-1">Analyzing your architecture…</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompt chips */}
      <div className="px-4 py-2 border-t border-gray-800 flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
            title="Send message"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
