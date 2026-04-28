export const GENERATE_JSON_SCHEMA = `{
  "modules": [
    {
      "name": "<PascalCase>_<Suffix>",
      "suffix": "Web" | "App" | "CS" | "UI" | "IS" | "BL",
      "description": "<one sentence describing the module's responsibility>",
      "ownedEntities": ["<Entity1>", "<Entity2>"],
      "notes": "<optional notes>"
    }
  ],
  "dependencies": [
    { "from": "<module name>", "to": "<module name>" }
  ]
}`;

const FEW_SHOT_EXAMPLE_ECOMMERCE = `
### Example 1 — E-Commerce Platform

User description: "E-commerce platform with product catalog, orders, payments, and customer portal"

Output:
{
  "modules": [
    { "name": "Portal_Web", "suffix": "Web", "description": "Customer-facing shopping portal", "ownedEntities": [], "notes": "" },
    { "name": "Admin_Web", "suffix": "Web", "description": "Admin and operations management portal", "ownedEntities": [], "notes": "" },
    { "name": "Catalog_CS", "suffix": "CS", "description": "Product catalog core service", "ownedEntities": ["Product", "Category", "ProductImage", "Inventory"], "notes": "" },
    { "name": "Orders_CS", "suffix": "CS", "description": "Order lifecycle management service", "ownedEntities": ["Order", "OrderItem", "OrderStatus", "Cart"], "notes": "" },
    { "name": "Payments_CS", "suffix": "CS", "description": "Payment processing and reconciliation service", "ownedEntities": ["Payment", "PaymentMethod", "Refund"], "notes": "" },
    { "name": "CustomerMgmt_CS", "suffix": "CS", "description": "Customer accounts and addresses", "ownedEntities": ["Customer", "Address", "WishList"], "notes": "" },
    { "name": "Catalog_UI", "suffix": "UI", "description": "Reusable product display and search UI components", "ownedEntities": [], "notes": "" },
    { "name": "StyleGuide_UI", "suffix": "UI", "description": "Design system, shared styles and base components", "ownedEntities": [], "notes": "" },
    { "name": "Payment_IS", "suffix": "IS", "description": "Payment gateway (Stripe/Braintree) integration connector", "ownedEntities": [], "notes": "" },
    { "name": "Email_IS", "suffix": "IS", "description": "Transactional email service integration", "ownedEntities": [], "notes": "" },
    { "name": "TaxCalc_BL", "suffix": "BL", "description": "Tax calculation and jurisdiction logic library", "ownedEntities": [], "notes": "" }
  ],
  "dependencies": [
    { "from": "Portal_Web", "to": "Catalog_CS" },
    { "from": "Portal_Web", "to": "Orders_CS" },
    { "from": "Portal_Web", "to": "Payments_CS" },
    { "from": "Portal_Web", "to": "CustomerMgmt_CS" },
    { "from": "Portal_Web", "to": "Catalog_UI" },
    { "from": "Portal_Web", "to": "StyleGuide_UI" },
    { "from": "Admin_Web", "to": "Catalog_CS" },
    { "from": "Admin_Web", "to": "Orders_CS" },
    { "from": "Admin_Web", "to": "StyleGuide_UI" },
    { "from": "Orders_CS", "to": "Email_IS" },
    { "from": "Orders_CS", "to": "TaxCalc_BL" },
    { "from": "Payments_CS", "to": "Payment_IS" },
    { "from": "Catalog_UI", "to": "Catalog_CS" },
    { "from": "Catalog_UI", "to": "StyleGuide_UI" }
  ]
}`;

const FEW_SHOT_EXAMPLE_HR = `
### Example 2 — HR Management System

User description: "HR management system with employee profiles, payroll, and leave management"

Output:
{
  "modules": [
    { "name": "HR_Web", "suffix": "Web", "description": "HR portal for employees and managers", "ownedEntities": [], "notes": "" },
    { "name": "Employee_CS", "suffix": "CS", "description": "Employee profiles and organisational structure", "ownedEntities": ["Employee", "Department", "Position", "OrgUnit"], "notes": "" },
    { "name": "Payroll_CS", "suffix": "CS", "description": "Payroll calculation and payslip management", "ownedEntities": ["PayrollRecord", "PaySlip", "Deduction", "Allowance"], "notes": "" },
    { "name": "Leave_CS", "suffix": "CS", "description": "Leave requests, balances and approval workflow", "ownedEntities": ["LeaveRequest", "LeaveBalance", "LeaveType", "LeaveApproval"], "notes": "" },
    { "name": "HR_UI", "suffix": "UI", "description": "Shared HR UI components — employee cards, org chart", "ownedEntities": [], "notes": "" },
    { "name": "StyleGuide_UI", "suffix": "UI", "description": "Design system and shared styles", "ownedEntities": [], "notes": "" },
    { "name": "Identity_IS", "suffix": "IS", "description": "Identity provider integration (LDAP / Active Directory)", "ownedEntities": [], "notes": "" },
    { "name": "Email_IS", "suffix": "IS", "description": "Email notification service integration", "ownedEntities": [], "notes": "" },
    { "name": "DateCalc_BL", "suffix": "BL", "description": "Date, time and working-day calculation utilities", "ownedEntities": [], "notes": "" }
  ],
  "dependencies": [
    { "from": "HR_Web", "to": "Employee_CS" },
    { "from": "HR_Web", "to": "Payroll_CS" },
    { "from": "HR_Web", "to": "Leave_CS" },
    { "from": "HR_Web", "to": "HR_UI" },
    { "from": "HR_Web", "to": "StyleGuide_UI" },
    { "from": "Employee_CS", "to": "Identity_IS" },
    { "from": "Payroll_CS", "to": "Email_IS" },
    { "from": "Payroll_CS", "to": "DateCalc_BL" },
    { "from": "Leave_CS", "to": "Email_IS" },
    { "from": "Leave_CS", "to": "DateCalc_BL" },
    { "from": "HR_UI", "to": "Employee_CS" },
    { "from": "HR_UI", "to": "StyleGuide_UI" }
  ]
}`;

const OUTSYSTEMS_RULES = `
## OutSystems Architecture Canvas Rules

### Module Naming — STRICT
Pattern: \`{PascalCaseDomain}_{Suffix}\` — e.g. UserMgmt_CS, Portal_Web, Identity_IS
Regex: /^[A-Z][a-zA-Z0-9]*_(Web|App|CS|UI|IS|BL)$/
NEVER output a module name that does not match this pattern.

### Module Types
- _Web — End-User Reactive Web App (UI only, no business logic)
- _App — End-User Mobile App (UI only, no business logic)
- _CS  — Core Service (owns entities + business logic, one clear domain)
- _UI  — Reusable UI Component Library (no entities)
- _IS  — Integration / Foundation Service (external system connectors)
- _BL  — Business Logic Library (pure logic, no DB, no UI)

### Dependency Rules — STRICTLY ENFORCED
✅ ALLOWED:
- End-User (_Web/_App) → Core (_CS/_UI)
- End-User (_Web/_App) → Foundation (_IS/_BL)
- Core Service (_CS) → Foundation (_IS/_BL)
- Core UI (_UI) → Core Service (_CS)
- Core UI (_UI) → Foundation (_IS/_BL)

❌ FORBIDDEN — NEVER include these:
- _CS → _CS (no horizontal Core Service coupling!)
- _Web/_App → _Web/_App (no horizontal End-User coupling!)
- Foundation → Core (no upward dependency!)
- Foundation → End-User (no upward dependency!)
- Core → End-User (no upward dependency!)

### Design Principles
1. Each _CS module owns ONE business domain — do not create "god" modules with >8 entities
2. End-User modules must NOT own any entities (ownedEntities must be empty)
3. _BL and _UI modules must NOT own any entities (ownedEntities must be empty)
4. Always include StyleGuide_UI for the design system
5. Maximum 25 modules total
`.trim();

export function buildGeneratePrompt(description: string): string {
  return `You are a senior OutSystems Solution Architect. Your task is to generate a well-structured OutSystems Architecture Canvas from a plain-English system description.

${OUTSYSTEMS_RULES}

---

## Few-Shot Examples (follow these patterns exactly)
${FEW_SHOT_EXAMPLE_ECOMMERCE}

---
${FEW_SHOT_EXAMPLE_HR}

---

## Your Task

Generate an OutSystems architecture for:
"${description}"

Respond with ONLY a valid JSON object matching this EXACT schema. No markdown code fences, no explanation, no text before or after — just raw JSON:

${GENERATE_JSON_SCHEMA}

Checklist before responding:
- All module names match the regex /^[A-Z][a-zA-Z0-9]*_(Web|App|CS|UI|IS|BL)$/
- No _CS → _CS dependencies
- No _Web/_App → _Web/_App dependencies
- No upward dependencies (Foundation→Core, Foundation→End-User, Core→End-User)
- End-User and UI modules have empty ownedEntities arrays
- At most 25 modules total
- StyleGuide_UI is included`;
}
