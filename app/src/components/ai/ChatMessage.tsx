'use client';

import React from 'react';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  provider?: string;
  isError?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

/** Very lightweight markdown renderer — handles bold, italic, inline code, and line breaks */
function renderMarkdown(text: string): React.ReactNode {
  // Trim leading/trailing whitespace to avoid blank spans at top/bottom
  const lines = text.trimStart().split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    // Pattern order matters: **bold** before *italic* before `code`
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      // Text before this match
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      if (match[1]) {
        // **bold**
        parts.push(<strong key={`${lineIdx}-${match.index}-b`}>{match[2]}</strong>);
      } else if (match[3]) {
        // *italic*
        parts.push(<em key={`${lineIdx}-${match.index}-i`}>{match[4]}</em>);
      } else if (match[5]) {
        // `code`
        parts.push(
          <code
            key={`${lineIdx}-${match.index}-c`}
            className="bg-gray-700 text-indigo-300 px-1 py-0.5 rounded text-[11px] font-mono"
          >
            {match[6]}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    elements.push(
      <span key={lineIdx} style={line === '' ? { display: 'block', height: '0.5em' } : undefined}>
        {parts}
        {lineIdx < lines.length - 1 && line !== '' && <br />}
      </span>
    );
  });

  return elements;
}

const PROVIDER_BADGES: Record<string, string> = {
  gemini: 'G',
  openai: 'GPT',
  anthropic: 'C',
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mt-2">
        <div className="max-w-[85%] bg-indigo-600 text-white text-sm px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm break-words min-w-0" style={{ overflowWrap: 'anywhere' }}>
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start mt-2">
      <div className="max-w-[92%] min-w-0">
        <div
          className={`text-sm px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed min-w-0 ${
            message.isError
              ? 'bg-red-950/60 border border-red-700/50 text-red-200'
              : 'bg-gray-800 border border-gray-700/50 text-gray-100'
          }`}
          style={{ overflowWrap: 'anywhere' }}
        >
          {message.streaming && message.content === '' ? (
            // Three-dot loading pulse
            <span className="flex gap-1 items-center py-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          ) : (
            <div style={{ overflowWrap: 'anywhere' }}>{renderMarkdown(message.content.trimStart())}</div>
          )}
        </div>

        {/* Provider badge */}
        {message.provider && !message.streaming && (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded font-mono">
              {PROVIDER_BADGES[message.provider] ?? message.provider}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
