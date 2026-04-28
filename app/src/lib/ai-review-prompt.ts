import { Module, ValidationViolation } from '@/types/architecture';
import { serializeCanvasContext } from './ai-context';

export interface ReviewReport {
  score: number;
  summary: string;
  strengths: string[];
  risks: string[];
  moduleRecommendations: {
    moduleName: string;
    recommendation: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  overallRecommendations: string[];
}

const REVIEW_JSON_SCHEMA = `{
  "score": <integer 0-100>,
  "summary": "<1-2 sentences — overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "moduleRecommendations": [
    { "moduleName": "<exact module name>", "recommendation": "<specific advice>", "severity": "high" | "medium" | "low" }
  ],
  "overallRecommendations": ["<step 1>", "<step 2>", "<step 3>"]
}`;

const OUTSYSTEMS_RULES = `
## OutSystems Architecture Canvas Rules

### Layers (dependencies flow downward only)
1. **End-User** — _Web (Reactive Web App), _App (Mobile App). No business logic.
2. **Core** — _CS (Core Service, owns entities + logic), _UI (Reusable UI components).
3. **Foundation** — _IS (Integration/external services), _BL (Business Logic, no DB).

### Naming Convention
Pattern: \`{PascalCaseDomain}_{Suffix}\`
Regex: \`/^[A-Z][a-zA-Z0-9]*_(Web|App|CS|UI|IS|BL)$/\`

### Allowed Dependencies (✅)
- End-User → Core Service
- End-User → Core UI
- End-User → Foundation (_IS, _BL)
- Core Service → Foundation
- Core UI → Core Service
- Core UI → Foundation UI

### Forbidden Dependencies (❌)
- Foundation → Core or End-User (upward)
- Core → End-User (upward)
- Core CS A → Core CS B (horizontal CS coupling)
- End-User A → End-User B (horizontal coupling)

### 8 Anti-Patterns
1. God Module — One _CS owns >8 entity types
2. Bypassing Core Services — End-User directly aggregates Core entities
3. Upward Dependencies — Foundation/Core references higher layers
4. Unbounded Queries — List actions without pagination
5. Hardcoded Configuration — Config values not in SystemConfig/FeatureFlag
6. Synchronous Notifications — Blocking notification in main flow
7. Logic in Screen Preparation — Business logic inside Preparation actions
8. Direct Inter-CS Entity Sharing — One _CS references entities owned by another _CS
`.trim();

export function buildReviewPrompt(
  modules: Module[],
  violations: ValidationViolation[],
  projectName: string
): string {
  const canvasContext = serializeCanvasContext(modules, violations, projectName);

  return `You are a senior OutSystems Solution Architect performing a formal architecture review.

${OUTSYSTEMS_RULES}

---

## Architecture Under Review

${canvasContext}

---

## Scoring Guide
- 90–100: Excellent — clean, well-structured, follows all rules, no anti-patterns
- 70–89: Good — minor issues only, mostly correct layer structure
- 50–69: Fair — several violations or anti-patterns present
- 0–49: Poor — fundamental architectural problems requiring redesign

## Instructions

Analyze the architecture above and respond with ONLY a valid JSON object matching this EXACT schema. No markdown code fences, no explanatory text before or after — just the raw JSON object:

${REVIEW_JSON_SCHEMA}

Rules for the JSON output:
- "score": an integer from 0 to 100 based on the scoring guide above
- "summary": 1–2 sentences capturing the overall health
- "strengths": exactly 3–5 items describing what is done well
- "risks": exactly 3–5 items describing risks BEYOND the already-listed violations (e.g. scalability, maintainability, testability concerns)
- "moduleRecommendations": one entry per module that has a concrete improvement opportunity; omit modules that are fine
- "overallRecommendations": exactly 3–5 actionable next steps the architect should take`;
}
