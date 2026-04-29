import { v4 as uuidv4 } from 'uuid';
import { Module, Dependency } from '@/types/architecture';

export interface SessionState {
  projectName: string;
  modules: Module[];
  dependencies: Dependency[];
  lastUpdatedAt: string;
  lastUpdatedBy: 'browser' | 'agent';
}

interface SessionEntry {
  state: SessionState;
  createdAt: number;
  expiresAt: number;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Module-level singleton (server-side only)
declare global {
  // eslint-disable-next-line no-var
  var __mcpSessionStore: Map<string, SessionEntry> | undefined;
}

function getStore(): Map<string, SessionEntry> {
  if (!global.__mcpSessionStore) {
    global.__mcpSessionStore = new Map();
  }
  return global.__mcpSessionStore;
}

function pruneExpired(): void {
  const store = getStore();
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(id);
  }
}

export function createSession(): string {
  pruneExpired();
  const id = uuidv4();
  const now = Date.now();
  getStore().set(id, {
    state: {
      projectName: 'My Architecture',
      modules: [],
      dependencies: [],
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedBy: 'browser',
    },
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  return id;
}

export function getSession(id: string): SessionState | null {
  pruneExpired();
  const entry = getStore().get(id);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.state;
}

export function putSession(id: string, state: SessionState): boolean {
  pruneExpired();
  const existing = getStore().get(id);
  if (!existing || existing.expiresAt < Date.now()) return false;
  existing.state = state;
  existing.expiresAt = Date.now() + SESSION_TTL_MS; // refresh TTL on activity
  return true;
}

export function upsertSession(id: string, state: SessionState): void {
  const now = Date.now();
  getStore().set(id, {
    state,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
}

export function deleteSession(id: string): void {
  getStore().delete(id);
}
