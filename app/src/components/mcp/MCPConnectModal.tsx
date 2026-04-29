'use client';
import { useState, useCallback } from 'react';
import { Cpu, Copy, Check, X, Wifi, WifiOff, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useArchitectureStore } from '@/store/architecture-store';

function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.0002 2L4.5 7.5V16.5L12.0002 22L19.5 16.5V7.5L12.0002 2Z" fill="#D97757" />
      <path d="M12 5.5L7 8.75V15.25L12 18.5L17 15.25V8.75L12 5.5Z" fill="#F5A98A" />
      <path d="M12 8.5L9.5 10V14L12 15.5L14.5 14V10L12 8.5Z" fill="#FDDDD3" />
    </svg>
  );
}

function CursorLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2L20 12L13 13.5L9.5 20L4 2Z" fill="#ffffff" />
      <path d="M4 2L20 12L13 13.5L9.5 20L4 2Z" stroke="#6B7280" strokeWidth="1" strokeLinejoin="round" />
      <path d="M13 13.5L16.5 17" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HttpClientLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="20" height="3.5" rx="1" fill="#6366F1" />
      <rect x="2" y="8.5" width="14" height="2" rx="1" fill="#818CF8" />
      <rect x="2" y="12.5" width="10" height="2" rx="1" fill="#818CF8" />
      <rect x="2" y="16.5" width="12" height="2" rx="1" fill="#818CF8" />
      <circle cx="19" cy="18" r="3.5" fill="#10B981" />
      <path d="M17.5 18L18.5 19L20.5 17" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface MCPConnectModalProps {
  onClose: () => void;
}

export function MCPConnectModal({ onClose }: MCPConnectModalProps) {
  const { mcpSessionId, mcpConnected, startMcpSession, stopMcpSession } = useArchitectureStore();
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState<'claude' | 'cursor' | 'custom' | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
  const mcpUrl = mcpSessionId ? `${origin}/api/mcp?session=${mcpSessionId}` : '';

  const handleConnect = useCallback(async () => {
    setIsStarting(true);
    try {
      await startMcpSession();
    } finally {
      setIsStarting(false);
    }
  }, [startMcpSession]);

  const handleDisconnect = useCallback(() => {
    stopMcpSession();
  }, [stopMcpSession]);

  const copyText = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const claudeConfig = mcpSessionId ? JSON.stringify({
    mcpServers: {
      'outsystems-canvas': {
        command: 'npx',
        args: ['-y', 'mcp-remote', mcpUrl],
      },
    },
  }, null, 2) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${mcpConnected ? 'bg-green-500/20' : 'bg-gray-700'}`}>
              <Cpu className={`w-5 h-5 ${mcpConnected ? 'text-green-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Connect AI Agent</h2>
              <p className="text-gray-400 text-xs">Expose canvas as MCP server for your AI agent</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {!mcpConnected ? (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <WifiOff className="w-12 h-12 text-gray-600" />
              </div>
              <div>
                <p className="text-white font-medium">No active session</p>
                <p className="text-gray-400 text-sm mt-1">
                  Start a session to get an MCP endpoint URL. Any AI agent that supports MCP can then interact with your canvas.
                </p>
              </div>
              <button
                onClick={handleConnect}
                disabled={isStarting}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 mx-auto"
              >
                <Wifi className="w-4 h-4" />
                {isStarting ? 'Starting session…' : 'Start MCP Session'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status badge */}
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-green-400 font-medium text-sm">Session active</span>
                <span className="text-gray-500 text-xs ml-auto">Canvas syncing every 3s</span>
              </div>

              {/* Session ID */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Session ID</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono truncate">
                    {mcpSessionId}
                  </code>
                  <button
                    onClick={() => copyText(mcpSessionId!, 'sid')}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copied === 'sid' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'sid' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* MCP URL */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">MCP Endpoint URL</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono truncate">
                    {mcpUrl}
                  </code>
                  <button
                    onClick={() => copyText(mcpUrl, 'url')}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copied === 'url' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'url' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Connection Instructions (collapsible) */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400">Connect with your agent:</p>
                {(['claude', 'cursor', 'custom'] as const).map(type => (
                  <div key={type} className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowInstructions(showInstructions === type ? null : type)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        {type === 'claude' && (
                          <>
                            <ClaudeLogo className="w-4 h-4 shrink-0" />
                            <span>Claude Desktop</span>
                          </>
                        )}
                        {type === 'cursor' && (
                          <>
                            <span className="w-4 h-4 shrink-0 flex items-center justify-center bg-gray-900 rounded-sm">
                              <CursorLogo className="w-3.5 h-3.5" />
                            </span>
                            <span>Cursor / Continue</span>
                          </>
                        )}
                        {type === 'custom' && (
                          <>
                            <HttpClientLogo className="w-4 h-4 shrink-0" />
                            <span>Custom HTTP Client</span>
                          </>
                        )}
                      </span>
                      {showInstructions === type ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showInstructions === type && (
                      <div className="px-4 pb-4 pt-1 bg-gray-800/50 space-y-3 text-xs text-gray-400">
                        {type === 'claude' && (
                          <>
                            <p>Add to your <code className="text-gray-200">claude_desktop_config.json</code>:</p>
                            <div className="relative">
                              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-300 overflow-x-auto text-[11px]">
                                {claudeConfig}
                              </pre>
                              <button
                                onClick={() => copyText(claudeConfig, 'claude')}
                                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-[10px] transition-colors flex items-center gap-1"
                              >
                                {copied === 'claude' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                Copy
                              </button>
                            </div>
                            <a
                              href="https://modelcontextprotocol.io/quickstart/user"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                            >
                              Claude Desktop MCP setup guide <ExternalLink className="w-3 h-3" />
                            </a>
                          </>
                        )}
                        {type === 'cursor' && (
                          <>
                            <p>In Cursor Settings → MCP, add a new server:</p>
                            <ul className="space-y-1 list-disc pl-4">
                              <li><span className="text-gray-300">Name:</span> outsystems-canvas</li>
                              <li><span className="text-gray-300">Type:</span> HTTP</li>
                              <li><span className="text-gray-300">URL:</span> <code className="text-gray-200 break-all">{mcpUrl}</code></li>
                            </ul>
                          </>
                        )}
                        {type === 'custom' && (
                          <>
                            <p>Use any MCP-compatible HTTP client. Send a POST request:</p>
                            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-300 overflow-x-auto text-[11px]">
{`POST ${mcpUrl}
Content-Type: application/json

{ "jsonrpc":"2.0","id":1,"method":"tools/list","params":{} }`}
                            </pre>
                            <p>The server supports <strong className="text-gray-300">MCP Streamable HTTP</strong> transport (2025 spec).</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Disconnect */}
              <div className="pt-1">
                <button
                  onClick={handleDisconnect}
                  className="w-full border border-gray-600 hover:border-red-500/50 hover:bg-red-500/10 text-gray-400 hover:text-red-400 px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <WifiOff className="w-4 h-4" />
                  Disconnect Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 bg-gray-800/30">
          <p className="text-xs text-gray-500 text-center">
            Your AI agent brings its own LLM credentials. This server only exposes canvas operations — no AI calls are made here.
          </p>
        </div>
      </div>
    </div>
  );
}
