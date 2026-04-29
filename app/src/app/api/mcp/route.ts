import { NextRequest, NextResponse } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  getSession,
  upsertSession,
} from '@/lib/session-store';
import {
  listModules,
  getArchitecture,
  addModule,
  updateModule,
  deleteModule,
  addDependency,
  deleteDependency,
  validateArchitecture,
  getViolations,
  setProjectName,
  clearCanvas,
  getArchitectureSummary,
} from '@/lib/mcp-tools';

// Persisted transports keyed by MCP session ID
declare global {
  // eslint-disable-next-line no-var
  var __mcpTransports: Map<string, WebStandardStreamableHTTPServerTransport> | undefined;
}
function getTransportStore(): Map<string, WebStandardStreamableHTTPServerTransport> {
  if (!global.__mcpTransports) global.__mcpTransports = new Map();
  return global.__mcpTransports;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, Accept',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function buildServer(arcSessionId: string): McpServer {
  const server = new McpServer({
    name: 'outsystems-architecture-canvas',
    version: '1.0.0',
  });

  // ─── Tools ───────────────────────────────────────────────────────────────

  server.registerTool('list_modules', {
    description: 'List all modules in the current architecture canvas.',
    inputSchema: {},
  }, async () => {
    const result = listModules(arcSessionId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('get_architecture', {
    description: 'Get the full architecture state including modules, dependencies, and violations.',
    inputSchema: {},
  }, async () => {
    const result = getArchitecture(arcSessionId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('add_module', {
    description: 'Add a new module to the architecture canvas. Name must follow pattern {PascalCase}_{Suffix} where suffix is one of: Web, App, CS, UI, IS, BL.',
    inputSchema: {
      name: z.string().describe('Module name e.g. UserMgmt_CS, Portal_Web'),
      description: z.string().optional().default('').describe('Brief description of the module'),
      ownedEntities: z.array(z.string()).optional().default([]).describe('Entity names owned by this module (for CS modules)'),
      notes: z.string().optional().default('').describe('Additional notes'),
    },
  }, async ({ name, description, ownedEntities, notes }) => {
    const result = addModule(arcSessionId, name, description ?? '', ownedEntities ?? [], notes ?? '');
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('update_module', {
    description: 'Update an existing module\'s description, entities, or notes. Use list_modules to find the module ID.',
    inputSchema: {
      moduleId: z.string().describe('The UUID of the module to update'),
      description: z.string().optional().describe('New description'),
      ownedEntities: z.array(z.string()).optional().describe('Updated list of owned entities'),
      notes: z.string().optional().describe('Updated notes'),
    },
  }, async ({ moduleId, description, ownedEntities, notes }) => {
    const updates: Record<string, unknown> = {};
    if (description !== undefined) updates.description = description;
    if (ownedEntities !== undefined) updates.ownedEntities = ownedEntities;
    if (notes !== undefined) updates.notes = notes;
    const result = updateModule(arcSessionId, moduleId, updates);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('delete_module', {
    description: 'Delete a module and all its dependencies from the canvas.',
    inputSchema: {
      moduleId: z.string().describe('The UUID of the module to delete'),
    },
  }, async ({ moduleId }) => {
    const result = deleteModule(arcSessionId, moduleId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('add_dependency', {
    description: 'Add a dependency between two modules by name. Returns a warning if the dependency violates canvas rules.',
    inputSchema: {
      sourceName: z.string().describe('Name of the source module (the one that depends on the other)'),
      targetName: z.string().describe('Name of the target module (the dependency)'),
    },
  }, async ({ sourceName, targetName }) => {
    const result = addDependency(arcSessionId, sourceName, targetName);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('delete_dependency', {
    description: 'Remove a dependency between modules. Use get_architecture to find dependency IDs.',
    inputSchema: {
      dependencyId: z.string().describe('The UUID of the dependency to remove'),
    },
  }, async ({ dependencyId }) => {
    const result = deleteDependency(arcSessionId, dependencyId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('validate_architecture', {
    description: 'Run full validation on the architecture and return all violations, an architecture score, and a breakdown of errors vs warnings.',
    inputSchema: {},
  }, async () => {
    const result = validateArchitecture(arcSessionId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('get_violations', {
    description: 'Get current architecture violations without running re-validation.',
    inputSchema: {},
  }, async () => {
    const result = getViolations(arcSessionId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('set_project_name', {
    description: 'Set the project name for the architecture.',
    inputSchema: {
      name: z.string().describe('New project name'),
    },
  }, async ({ name }) => {
    const result = setProjectName(arcSessionId, name);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('clear_canvas', {
    description: 'Remove all modules and dependencies from the canvas. This is destructive — confirm with the user before calling.',
    inputSchema: {},
  }, async () => {
    const result = clearCanvas(arcSessionId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  // ─── Resources ───────────────────────────────────────────────────────────

  server.registerResource(
    'architecture-state',
    'architecture://state',
    { description: 'Full architecture state as JSON', mimeType: 'application/json' },
    async () => {
      const result = getArchitecture(arcSessionId);
      return { contents: [{ uri: 'architecture://state', text: JSON.stringify(result, null, 2), mimeType: 'application/json' }] };
    }
  );

  server.registerResource(
    'architecture-summary',
    'architecture://summary',
    { description: 'Human-readable architecture overview', mimeType: 'text/plain' },
    async () => {
      const text = getArchitectureSummary(arcSessionId);
      return { contents: [{ uri: 'architecture://summary', text, mimeType: 'text/plain' }] };
    }
  );

  server.registerResource(
    'architecture-violations',
    'architecture://violations',
    { description: 'Current architecture validation violations', mimeType: 'application/json' },
    async () => {
      const result = getViolations(arcSessionId);
      return { contents: [{ uri: 'architecture://violations', text: JSON.stringify(result, null, 2), mimeType: 'application/json' }] };
    }
  );

  return server;
}

async function getOrCreateTransport(
  arcSessionId: string,
  mcpSessionId: string | null,
): Promise<WebStandardStreamableHTTPServerTransport> {
  const transports = getTransportStore();

  if (mcpSessionId && transports.has(mcpSessionId)) {
    return transports.get(mcpSessionId)!;
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => uuidv4(),
    onsessioninitialized: (id) => {
      transports.set(id, transport);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) transports.delete(transport.sessionId);
  };

  const server = buildServer(arcSessionId);
  await server.connect(transport);
  return transport;
}

export async function POST(req: NextRequest) {
  const arcSessionId = req.nextUrl.searchParams.get('session');
  if (!arcSessionId) {
    return NextResponse.json({ error: 'Missing ?session= query parameter' }, { status: 400, headers: CORS_HEADERS });
  }

  // Ensure the architecture session exists
  const state = getSession(arcSessionId);
  if (!state) {
    return NextResponse.json({ error: 'Architecture session not found or expired. Create a session via /api/session/new first.' }, { status: 404, headers: CORS_HEADERS });
  }

  const mcpSessionId = req.headers.get('mcp-session-id');
  const transport = await getOrCreateTransport(arcSessionId, mcpSessionId);
  const response = await transport.handleRequest(req);

  // Attach CORS headers to response
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

export async function GET(req: NextRequest) {
  const arcSessionId = req.nextUrl.searchParams.get('session');
  if (!arcSessionId) {
    return NextResponse.json({ error: 'Missing ?session= query parameter' }, { status: 400, headers: CORS_HEADERS });
  }

  const mcpSessionId = req.headers.get('mcp-session-id');
  if (!mcpSessionId) {
    return NextResponse.json({ error: 'Missing Mcp-Session-Id header' }, { status: 400, headers: CORS_HEADERS });
  }

  const transport = getTransportStore().get(mcpSessionId);
  if (!transport) {
    return NextResponse.json({ error: 'MCP session not found' }, { status: 404, headers: CORS_HEADERS });
  }

  const response = await transport.handleRequest(req);
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

export async function DELETE(req: NextRequest) {
  const mcpSessionId = req.headers.get('mcp-session-id');
  if (mcpSessionId) {
    getTransportStore().delete(mcpSessionId);
  }
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
