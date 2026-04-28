# OutSystems Architecture Canvas — Enterprise Reference Architecture

> **Document Type:** Solution Architecture Reference  
> **Platform:** OutSystems O11 (Reactive Web)  
> **Target Scale:** Medium–Large Enterprise (500–50,000 users)  
> **Audience:** Solution Architects, Tech Leads, Developer Teams  
> **Last Updated:** April 2026  

---

## Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [Architecture Canvas Overview](#2-architecture-canvas-overview)
3. [Layer-by-Layer Module Design](#3-layer-by-layer-module-design)
   - 3.1 [End-User Layer](#31-end-user-layer)
   - 3.2 [Core Layer](#32-core-layer)
   - 3.3 [Foundation Layer](#33-foundation-layer)
4. [Module Dependency Rules](#4-module-dependency-rules)
5. [Naming Conventions](#5-naming-conventions)
6. [Data Architecture](#6-data-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Integration Architecture](#8-integration-architecture)
9. [Performance & Caching Strategy](#9-performance--caching-strategy)
10. [Error Handling & Logging](#10-error-handling--logging)
11. [CI/CD & Deployment Strategy](#11-cicd--deployment-strategy)
12. [Anti-Patterns to Avoid](#12-anti-patterns-to-avoid)
13. [Module Inventory Checklist](#13-module-inventory-checklist)

---

## 1. Architecture Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Loose Coupling** | Modules communicate through well-defined service APIs, never via direct database sharing |
| **High Cohesion** | Each module owns a single business domain — no mixed responsibilities |
| **Dependency Direction** | Dependencies always flow **downward**: End-User → Core → Foundation. Never upward. Never sideways at the same layer (except UI themes) |
| **Isolation by Domain** | Business logic, data, and UI are separated into distinct modules per domain |
| **Reusability First** | Every piece of shared logic must live in Core or Foundation — never duplicated across End-User modules |
| **Security by Design** | Authentication, authorization, and data visibility rules are enforced at the Core Service layer |

### The Golden Rule

> **One module = One responsibility.**  
> If you cannot describe a module's purpose in one sentence, it is doing too much.

---

## 2. Architecture Canvas Overview

The OutSystems Architecture Canvas organizes modules into **3 horizontal layers** and **2 vertical tracks** (UI and Services/Logic).

```
╔══════════════════════════════════════════════════════════════════════╗
║                        ARCHITECTURE CANVAS                          ║
╠══════════════╦══════════════════════════════╦════════════════════════╣
║    LAYER     ║     UI MODULES (Reactive)    ║   SERVICE/LOGIC MODULES ║
╠══════════════╬══════════════════════════════╬════════════════════════╣
║              ║  Portal_Web                  ║                        ║
║  END-USER    ║  Admin_Web                   ║  (No service modules   ║
║  LAYER       ║  Mobile_App                  ║   at this layer)       ║
║              ║  [Orchestration only]        ║                        ║
╠══════════════╬══════════════════════════════╬════════════════════════╣
║              ║  UserMgmt_UI                 ║  UserMgmt_CS           ║
║  CORE        ║  Notifications_UI            ║  Notifications_CS      ║
║  LAYER       ║  [Domain UI Components]      ║  ContentMgmt_CS        ║
║              ║                              ║  Analytics_CS          ║
╠══════════════╬══════════════════════════════╬════════════════════════╣
║              ║  StyleGuide_UI               ║  Identity_IS           ║
║  FOUNDATION  ║  [Shared Design System]      ║  Integration_IS        ║
║  LAYER       ║                              ║  SharedLib_IS          ║
║              ║                              ║  [Reusable Utilities]  ║
╚══════════════╩══════════════════════════════╩════════════════════════╝
```

**Module Suffix Convention:**
- `_Web` — End-User Reactive Web application
- `_App` — End-User Mobile application
- `_CS` — Core Service (business logic + data ownership)
- `_UI` — Reusable UI components (blocks, screens)
- `_IS` — Integration Service or shared infrastructure library
- `_BL` — Business Logic library (logic-only, no DB entities)

---

## 3. Layer-by-Layer Module Design

### 3.1 End-User Layer

**Purpose:** Orchestrates user experience. Contains screens, navigation, and page-level logic. **No business logic here.**

#### Modules

---

##### `Portal_Web` — Main Employee Portal

| Attribute | Value |
|-----------|-------|
| **Type** | Reactive Web App |
| **Owns Entities** | None |
| **Depends On** | UserMgmt_CS, Notifications_CS, ContentMgmt_CS, StyleGuide_UI, UserMgmt_UI |

**Responsibility:**
- Homepage / dashboard shell
- Navigation menu (role-driven)
- Routing to feature sections
- Page layout composition using Core UI blocks

**Screens (examples):**
- `Home` — Personalized dashboard with widgets
- `MyProfile` — Employee self-service profile
- `Announcements` — Content feed from ContentMgmt_CS
- `NotificationCenter` — Notification inbox

**Rules:**
- ❌ No direct aggregate queries on Core entities from screen logic
- ❌ No business rule validation in screen Preparation actions
- ✅ All data is fetched via Server Actions exposed by Core Services
- ✅ Role-based menu visibility is driven by `Identity_IS` role checks

---

##### `Admin_Web` — Administration Back-Office

| Attribute | Value |
|-----------|-------|
| **Type** | Reactive Web App |
| **Owns Entities** | None |
| **Depends On** | UserMgmt_CS, ContentMgmt_CS, Analytics_CS, StyleGuide_UI |

**Responsibility:**
- User management (create, disable, assign roles)
- Content publishing and moderation
- System configuration and audit log viewing
- Reporting dashboards

**Rules:**
- ❌ Not accessible to regular employees — role-gated at Identity layer
- ✅ All write operations go through Core Service Server Actions, never direct entity CRUDs

---

### 3.2 Core Layer

**Purpose:** Business domain ownership. Each Core Service owns its entities, enforces business rules, and exposes a clean API to the layers above.

#### 3.2.1 Core Services (Business Logic + Data)

---

##### `UserMgmt_CS` — User Management Core Service

| Attribute | Value |
|-----------|-------|
| **Type** | Service Module (CS) |
| **Owns Entities** | `User`, `UserProfile`, `UserRole`, `Department`, `UserPreference` |
| **Depends On** | Identity_IS, SharedLib_IS |

**Exposed Public API (Server Actions):**

| Action | Description |
|--------|-------------|
| `User_Get` | Get user by Id |
| `User_GetList` | Paginated user listing with filters |
| `User_Create` | Create user with validation |
| `User_Update` | Update user profile |
| `User_Disable` | Soft-disable a user |
| `UserRole_Assign` | Assign role to user |
| `UserRole_Revoke` | Remove role from user |
| `UserPreference_Save` | Save user-specific settings |

**Business Rules Enforced:**
- Email must be unique across the system
- At least one role must be assigned before activation
- Disabled users cannot authenticate
- Department assignment is mandatory for full profile

**Entities Design:**

```
User
├── Id (AutoNumber)
├── Username (Text, 100) [Unique Index]
├── Email (Text, 200) [Unique Index]
├── IsActive (Boolean, Default: True)
├── CreatedOn (DateTime)
└── LastLoginOn (DateTime)

UserProfile
├── Id (AutoNumber)
├── UserId (FK → User.Id) [Index]
├── FirstName (Text, 100)
├── LastName (Text, 100)
├── DepartmentId (FK → Department.Id) [Index]
├── JobTitle (Text, 200)
└── AvatarURL (Text, 500)

UserRole
├── Id (AutoNumber)
├── UserId (FK → User.Id) [Index]
├── RoleName (Text, 100) [Index]
└── AssignedOn (DateTime)
```

---

##### `Notifications_CS` — Notifications Core Service

| Attribute | Value |
|-----------|-------|
| **Type** | Service Module (CS) |
| **Owns Entities** | `Notification`, `NotificationTemplate`, `NotificationRecipient` |
| **Depends On** | SharedLib_IS, Integration_IS |

**Exposed Public API:**

| Action | Description |
|--------|-------------|
| `Notification_Send` | Trigger notification to one or many users |
| `Notification_GetInbox` | Get paginated inbox for a user |
| `Notification_MarkRead` | Mark notification(s) as read |
| `Notification_GetUnreadCount` | Count unread notifications (for badge) |
| `Template_Get` | Fetch a notification template by key |

**Design Decisions:**
- Notifications are stored asynchronously via **OutSystems Processes** (BPT) or **Timers** — never block the main request thread
- Templates support variable substitution (e.g., `{UserName}`, `{DueDate}`)
- Supports channels: **In-App**, **Email** — channel routing is configurable per template
- Email delivery delegates to `Integration_IS` (SMTP or SendGrid connector)

---

##### `ContentMgmt_CS` — Content Management Core Service

| Attribute | Value |
|-----------|-------|
| **Type** | Service Module (CS) |
| **Owns Entities** | `Article`, `Category`, `Tag`, `ArticleTag`, `ContentVersion` |
| **Depends On** | UserMgmt_CS (author reference), SharedLib_IS |

**Exposed Public API:**

| Action | Description |
|--------|-------------|
| `Article_GetList` | Paginated, filterable article listing |
| `Article_GetById` | Full article content by Id |
| `Article_Publish` | Publish a draft article |
| `Article_Archive` | Archive published content |
| `Article_Create` | Create new draft |
| `Article_Update` | Update existing draft |
| `Category_GetAll` | Retrieve all active categories |

**Design Decisions:**
- Content versioning: every save creates a `ContentVersion` record (audit trail)
- Published vs Draft state machine: `Draft → Review → Published → Archived`
- Full-text search enabled on `Article.Title` and `Article.Summary` columns
- Categories use a **self-referencing parent-child** pattern for hierarchy (max 2 levels)

---

##### `Analytics_CS` — Analytics & Reporting Core Service

| Attribute | Value |
|-----------|-------|
| **Type** | Service Module (CS) |
| **Owns Entities** | `AuditLog`, `UserActivityEvent`, `ReportConfig` |
| **Depends On** | SharedLib_IS |

**Exposed Public API:**

| Action | Description |
|--------|-------------|
| `AuditLog_Write` | Append an audit event (called by other CS modules) |
| `AuditLog_GetList` | Paginated audit log for Admin |
| `UserActivity_Track` | Record a user interaction event |
| `Report_GetDashboardData` | Pre-aggregated dashboard metrics |

**Design Decisions:**
- `AuditLog_Write` is a **fire-and-forget** async action — never blocks business flows
- Audit log is **append-only** — no Update or Delete exposed
- Dashboard metrics are pre-computed by a **nightly Timer** and stored in `ReportConfig` to avoid runtime aggregation on large datasets

---

#### 3.2.2 Core UI Modules (Reusable Domain UI Components)

---

##### `UserMgmt_UI` — User Management UI Components

| Attribute | Value |
|-----------|-------|
| **Type** | UI Library Module |
| **Owns Entities** | None |
| **Depends On** | UserMgmt_CS, StyleGuide_UI |

**Exposes:**
- `Block_UserCard` — Avatar + Name + Department chip
- `Block_UserSearchDropdown` — Searchable user picker
- `Block_UserRoleBadge` — Visual role indicator chip
- `Block_MyProfileWidget` — Profile summary panel

---

##### `Notifications_UI` — Notification UI Components

| Attribute | Value |
|-----------|-------|
| **Type** | UI Library Module |
| **Owns Entities** | None |
| **Depends On** | Notifications_CS, StyleGuide_UI |

**Exposes:**
- `Block_NotificationBell` — Header bell icon with unread badge (uses polling or WebSocket)
- `Block_NotificationToast` — Slide-in toast notification
- `Block_NotificationInboxPanel` — Full inbox drawer/panel

---

### 3.3 Foundation Layer

**Purpose:** Platform-wide utilities, integrations with external systems, and the shared design system. No business logic. No domain entities.

---

##### `Identity_IS` — Identity & Authentication Foundation Service

| Attribute | Value |
|-----------|-------|
| **Type** | Integration/Foundation Service |
| **Owns Entities** | `OAuthSession`, `SSOMapping` |
| **Depends On** | None (lowest layer) |

**Responsibility:**
- SAML 2.0 / OIDC integration with external IdP (Okta, Auth0, Azure AD)
- Token validation and session management
- Role claim mapping from IdP assertions to OutSystems roles
- JWT parsing utilities

**Exposed API:**

| Action | Description |
|--------|-------------|
| `Identity_ValidateToken` | Validate JWT/SAML token |
| `Identity_GetCurrentUser` | Return authenticated user context |
| `Role_HasPermission` | Check if current user has a given role |
| `SSO_InitiateLogin` | Redirect to IdP login page |
| `SSO_HandleCallback` | Process IdP callback and establish session |

**SSO Flow:**
```
User Browser → Portal_Web → Identity_IS.SSO_InitiateLogin
    → Redirect to Okta/Auth0
    → Okta authenticates user
    → Callback to Identity_IS.SSO_HandleCallback
    → Validate assertion, map roles
    → Create OutSystems session
    → Redirect to Portal homepage
```

---

##### `Integration_IS` — External Systems Integration Foundation Service

| Attribute | Value |
|-----------|-------|
| **Type** | Integration Service |
| **Owns Entities** | `IntegrationLog`, `IntegrationConfig` |
| **Depends On** | SharedLib_IS |

**Responsibility:**
- Abstraction layer for ALL external system calls (ERP, HR, CRM, internal APIs)
- Connection configuration management (endpoints, credentials, timeouts)
- Request/response logging
- Retry logic, circuit breaker pattern
- Transformation of external data models to internal structures

**Connectors maintained here:**
- `HRMS_Connector` — REST/SOAP adapter for HR system
- `ERP_Connector` — SAP / legacy ERP adapter
- `Email_Connector` — SMTP or SendGrid integration
- `InternalAPI_Connector` — Internal microservices REST client

**Circuit Breaker Pattern:**
```
Integration_IS.CallExternal(SystemName, Action, Payload)
  → Check IntegrationConfig.IsCircuitOpen
  → If open: return cached/fallback data, log warning
  → If closed: execute call with timeout (default: 10s)
  → On failure: increment failure counter
  → If failures > threshold (3): open circuit, start cooldown (60s)
  → Log all attempts to IntegrationLog
```

---

##### `SharedLib_IS` — Shared Utilities Foundation Library

| Attribute | Value |
|-----------|-------|
| **Type** | Foundation Library |
| **Owns Entities** | `SystemConfig`, `FeatureFlag` |
| **Depends On** | None |

**Exposes:**

| Component | Description |
|-----------|-------------|
| `Util_DateFormat` | Standardized date/time formatting functions |
| `Util_Pagination` | Pagination structure records and helpers |
| `Util_Encryption` | AES-256 encrypt/decrypt for sensitive fields |
| `Util_TextSanitize` | XSS-safe text sanitization |
| `Util_JsonHelper` | JSON serialization/deserialization helpers |
| `SystemConfig_Get` | Read runtime configuration by key |
| `FeatureFlag_IsEnabled` | Feature toggle check by flag name |
| `Util_GUID` | GUID generator |
| `Util_Validation` | Common validation patterns (email, phone, NIF) |

---

##### `StyleGuide_UI` — Design System Foundation UI

| Attribute | Value |
|-----------|-------|
| **Type** | UI Theme + Component Library |
| **Owns Entities** | None |
| **Depends On** | None |

**Responsibility:**
- Base CSS theme (colors, typography, spacing tokens)
- Atomic UI building blocks used across ALL UI modules
- Accessibility (WCAG 2.1 AA compliance)

**Exposes:**

| Block | Description |
|-------|-------------|
| `Block_Button` | Primary/Secondary/Danger button variants |
| `Block_Modal` | Standard modal dialog |
| `Block_DataTable` | Sortable, paginated data table |
| `Block_FormField` | Label + Input + Validation message |
| `Block_PageHeader` | Consistent page title + breadcrumb |
| `Block_LoadingSpinner` | Global loading state indicator |
| `Block_EmptyState` | Empty results illustration + CTA |
| `Block_Badge` | Status/role chip |
| `Block_Alert` | Info/Success/Warning/Error banners |
| `Block_SideNav` | Collapsible side navigation |

---

## 4. Module Dependency Rules

### Allowed Dependencies (✅)

```
End-User  →  Core Service     ✅
End-User  →  Core UI          ✅
End-User  →  Foundation       ✅
Core Service → Foundation     ✅
Core UI   →  Core Service     ✅
Core UI   →  Foundation UI    ✅
```

### Forbidden Dependencies (❌)

```
Foundation  →  Core            ❌  (upward reference — violates canvas)
Foundation  →  End-User        ❌  (upward reference — violates canvas)
Core        →  End-User        ❌  (upward reference — violates canvas)
Core CS A   →  Core CS B       ❌  (horizontal reference — creates coupling)
End-User A  →  End-User B      ❌  (horizontal reference — creates coupling)
```

### When Core Services Need to Communicate

Use the **Event / Service Action pattern** via Foundation:

```
UserMgmt_CS needs Notification_CS → WRONG: direct dependency
Correct approach:
  1. UserMgmt_CS calls Notifications_CS.Notification_Send (acceptable if CS A is a consumer of CS B's service)
  2. Or: UserMgmt_CS raises a BPT Event; Notifications_CS listens
```

> **Rule:** CS-to-CS dependency is allowed **only top-down** (consuming a service API), never for data sharing or entity access.

---

## 5. Naming Conventions

### Module Naming

| Pattern | Example | Rule |
|---------|---------|------|
| `{Domain}_Web` | `Portal_Web`, `Admin_Web` | End-User Reactive Web apps |
| `{Domain}_App` | `Field_App` | End-User Mobile apps |
| `{Domain}_CS` | `UserMgmt_CS`, `Orders_CS` | Core Service (owns data + logic) |
| `{Domain}_UI` | `UserMgmt_UI`, `Catalog_UI` | Reusable UI blocks (no data) |
| `{Domain}_IS` | `Identity_IS`, `SAP_IS` | Integration or Foundation service |
| `{Domain}_BL` | `Pricing_BL` | Logic-only library (no entities, no UI) |

### Entity Naming

- Use **PascalCase** singular nouns: `UserProfile`, `NotificationTemplate`
- Foreign keys: `{EntityName}Id` → `UserId`, `DepartmentId`
- Timestamps: `CreatedOn`, `UpdatedOn`, `DeletedOn`
- Soft delete: `IsDeleted` (Boolean, default False) + `DeletedOn`
- Status fields: use Text with constrained values OR linked static entity

### Action Naming

| Pattern | Example |
|---------|---------|
| `{Entity}_{Verb}` | `User_Create`, `User_Get`, `User_GetList` |
| `{Entity}_{Verb}By{Field}` | `User_GetByEmail` |
| `{Domain}_{Verb}` | `Auth_ValidateToken` |
| Utility prefix `Util_` | `Util_FormatDate`, `Util_Encrypt` |

### Screen Naming

| Pattern | Example |
|---------|---------|
| `{Entity}List` | `UserList`, `ArticleList` |
| `{Entity}Detail` | `UserDetail`, `ArticleDetail` |
| `{Entity}Form` | `UserForm`, `ArticleForm` |
| `{Feature}Dashboard` | `AnalyticsDashboard`, `AdminDashboard` |

### Variable & Parameter Naming

- Input parameters: `in_UserId`, `in_SearchTerm`
- Output parameters: `out_User`, `out_TotalCount`
- Local variables: `loc_FormattedDate`, `loc_IsValid`
- Screen variables: `sv_SelectedTab`, `sv_IsLoading`

---

## 6. Data Architecture

### Ownership Model

> **Each entity is owned by exactly one Core Service module. No other module accesses its tables directly.**

| Entity Group | Owning Module |
|-------------|---------------|
| User, UserProfile, Department | `UserMgmt_CS` |
| Notification, Template | `Notifications_CS` |
| Article, Category, Tag | `ContentMgmt_CS` |
| AuditLog, ActivityEvent | `Analytics_CS` |
| OAuthSession, SSOMapping | `Identity_IS` |
| IntegrationLog, Config | `Integration_IS` |
| SystemConfig, FeatureFlag | `SharedLib_IS` |

### Database Indexing Strategy

Every entity must have indexes on:
- All Foreign Key columns
- All columns used in WHERE clauses in aggregates
- All columns used in ORDER BY on large tables
- Unique constraints on natural keys (Email, Username)

```sql
-- Example index requirements for User entity
INDEX: User.Username (Unique)
INDEX: User.Email (Unique)
INDEX: User.IsActive
INDEX: UserProfile.UserId
INDEX: UserProfile.DepartmentId
INDEX: UserRole.UserId
INDEX: UserRole.RoleName
```

### Pagination

All list-returning Server Actions **must** use the standard pagination pattern:

```
Input Parameters:
  in_PageNumber   (Integer, Default: 1)
  in_PageSize     (Integer, Default: 20, Max: 100)

Output Parameters:
  out_Records     (List of RecordType)
  out_TotalCount  (Long Integer)
  out_TotalPages  (Integer)
  out_HasNextPage (Boolean)
```

Never use `StartIndex` / `LineCount` ad-hoc — always use the standard structure from `SharedLib_IS.Util_Pagination`.

### Soft Delete Pattern

All business entities implement soft delete:
- `IsDeleted` Boolean (default: False)
- `DeletedOn` DateTime (nullable)
- `DeletedBy` UserId reference

All aggregates **must** include `WHERE IsDeleted = False` as a mandatory filter.

---

## 7. Security Architecture

### Authentication Flow (SSO with Okta/Auth0)

```
1. User accesses Portal_Web
2. Portal_Web → Identity_IS.Identity_GetCurrentUser
3. If no valid session → Identity_IS.SSO_InitiateLogin → redirect to IdP
4. IdP authenticates user, returns SAML assertion / ID token
5. Identity_IS.SSO_HandleCallback:
   a. Validate token signature
   b. Extract user claims (email, name, groups)
   c. Map IdP groups → OutSystems roles (via SSOMapping table)
   d. Create/update User record in UserMgmt_CS
   e. Establish OutSystems session
6. Redirect user to originally requested page
```

### Role Model

| Role | Description | Module |
|------|-------------|--------|
| `Portal_User` | Basic authenticated employee access | Identity_IS |
| `Portal_ContentEditor` | Can create/edit content | Identity_IS |
| `Portal_ContentPublisher` | Can publish/archive content | Identity_IS |
| `Portal_Analyst` | Access to analytics dashboards | Identity_IS |
| `Portal_Admin` | Full system administration | Identity_IS |
| `Portal_SuperAdmin` | Platform-level configuration | Identity_IS |

**Role Hierarchy:**
```
Portal_SuperAdmin
  └─ Portal_Admin
       ├─ Portal_Analyst
       ├─ Portal_ContentPublisher
       │    └─ Portal_ContentEditor
       └─ Portal_User (base)
```

### Data Visibility Rules

- Users can only see their own `UserPreference` records
- Content visibility is controlled by `Article.IsPublished` and `Category.IsVisible`
- Audit logs are accessible **only** to `Portal_Admin` and above
- Integration configurations are accessible **only** to `Portal_SuperAdmin`

### Security Checklist per Module

For every Core Service, implement:
- [ ] Role check at the start of every write Server Action (`Identity_IS.Role_HasPermission`)
- [ ] Input sanitization via `SharedLib_IS.Util_TextSanitize` before any DB write
- [ ] SQL injection prevention: use Aggregates or Server Actions only — no raw SQL
- [ ] Sensitive fields (SSN, tokens) encrypted with `SharedLib_IS.Util_Encryption`
- [ ] All external calls proxied through `Integration_IS` (no direct REST calls from CS modules)
- [ ] Audit log entry written for every create/update/delete operation

---

## 8. Integration Architecture

### Integration Topology

```
                    ┌──────────────────────┐
                    │    Integration_IS     │
                    │  (Single gateway for  │
                    │   all external calls) │
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
  ┌──────▼──────┐    ┌─────────▼───────┐   ┌────────▼───────┐
  │ HRMS_Connector│  │  ERP_Connector  │   │ Email_Connector │
  │ (Workday REST)│  │  (SAP SOAP/RFC) │   │ (SendGrid REST) │
  └─────────────┘   └─────────────────┘   └────────────────┘
```

### Integration Design Patterns

#### Pattern 1: Synchronous REST Integration

Use for: real-time lookups (org chart, employee existence check)

```
Core Service (UserMgmt_CS)
  → Integration_IS.HRMS_Connector.Employee_Get(EmployeeId)
    → HTTP GET /api/employees/{id}
    → Transform response to internal Employee structure
    → Return to caller
```

**Configuration in `IntegrationConfig` entity:**

| Key | Value |
|-----|-------|
| `HRMS_BaseURL` | `https://api.hrms.company.com` |
| `HRMS_ApiKey` | `[encrypted]` |
| `HRMS_TimeoutMs` | `10000` |
| `HRMS_RetryCount` | `3` |

#### Pattern 2: Asynchronous Sync (Scheduled)

Use for: bulk data synchronization (departments, org hierarchy)

```
Timer: SyncDepartments (runs nightly 02:00)
  → Integration_IS.HRMS_Connector.Department_GetAll
  → For each department: UserMgmt_CS.Department_Upsert
  → Log results to IntegrationLog
```

#### Pattern 3: Outbound Event / Webhook

Use for: notifying external systems of changes

```
UserMgmt_CS.User_Create
  → (after commit) → Integration_IS.ERP_Connector.User_Notify(NewUser)
  → POST /api/webhooks/users with payload
  → Log to IntegrationLog
  → On failure: queue for retry via BPT
```

### Integration Resilience Rules

| Rule | Implementation |
|------|----------------|
| All external calls have a **timeout** | `IntegrationConfig.TimeoutMs` (default: 10,000ms) |
| All external calls have **retry logic** | Max 3 retries with exponential backoff (1s, 2s, 4s) |
| All external calls are **logged** | `IntegrationLog` with request/response/duration/status |
| Circuit breaker is **mandatory** | Open after 3 consecutive failures; recover after 60s |
| External credentials are **never hardcoded** | Always stored in `IntegrationConfig` (encrypted) |

---

## 9. Performance & Caching Strategy

### Caching Rules

| Data Type | Cache Location | TTL | Invalidation |
|-----------|---------------|-----|--------------|
| Navigation menu items | Client-Side (session storage) | 10 min | Role change, logout |
| System configuration | Server-Side (Application cache) | 60 min | Config save action |
| Feature flags | Server-Side (Application cache) | 15 min | Flag update action |
| Department list | Server-Side (Application cache) | 30 min | Department sync Timer |
| Unread notification count | Client-Side (screen variable) | 30 sec | Periodic refresh |
| Dashboard metrics | Pre-computed (DB table) | 24 hr | Nightly Timer |
| User profile | Server-Side (session cache) | Session | Logout, profile update |

### Query Optimization Rules

1. **All aggregates must be paginated** — no unbounded result sets
2. **Max aggregate complexity:** 3 joined entities per aggregate; split if more are needed
3. **Avoid COUNT on large tables** in real-time — use pre-computed counters or nightly aggregation
4. **Use Indexes** on all filter columns (see Data Architecture section)
5. **Lazy-load** heavy content (article body, images) — list views use summary fields only
6. **Avoid N+1 queries** — never call a Server Action inside a For Each loop; batch instead

### Frontend Performance

| Rule | Detail |
|------|--------|
| **Images** | Max 200KB per image; use CDN URLs; lazy-load below fold |
| **On Initialize** | Only fetch data visible above the fold; defer rest to OnReady |
| **Blocks** | Blocks fetch their own data — do not pass large datasets as parameters |
| **Screen Variables** | Keep screen state minimal; avoid storing full record lists in SV |
| **Timers on Screen** | Maximum 1 polling timer per screen; default interval ≥ 30s |

---

## 10. Error Handling & Logging

### Error Handling Hierarchy

```
Screen / Client Action
  └─ Exception Handler → Show user-friendly toast (Block_Alert)
                       → Log via Server Action (fire-and-forget)

Server Action (Core Service)
  └─ Try/Catch
       ├─ Business Exception → Return structured error output
       │     (out_Success=False, out_ErrorCode, out_ErrorMessage)
       └─ System Exception → Analytics_CS.AuditLog_Write(error)
                           → Raise Application Exception to caller
```

### Standard Server Action Output Structure

Every write Server Action must return:

```
Output Parameters:
  out_Success      (Boolean)
  out_ErrorCode    (Text)     -- e.g. "USER_NOT_FOUND", "DUPLICATE_EMAIL"
  out_ErrorMessage (Text)     -- Human-readable message
  out_Data         (Record)   -- The created/updated record (on success)
```

### Error Code Convention

| Prefix | Meaning | Example |
|--------|---------|---------|
| `NOT_FOUND` | Entity does not exist | `USER_NOT_FOUND` |
| `DUPLICATE` | Unique constraint violation | `DUPLICATE_EMAIL` |
| `INVALID` | Validation failure | `INVALID_PHONE_FORMAT` |
| `FORBIDDEN` | Insufficient permission | `FORBIDDEN_ADMIN_ONLY` |
| `UNAVAILABLE` | External system down | `HRMS_UNAVAILABLE` |
| `UNEXPECTED` | Unhandled system error | `UNEXPECTED_ERROR` |

### What to Log

| Event | Level | Module |
|-------|-------|--------|
| User login / logout | INFO | Identity_IS |
| User created/updated/disabled | INFO | UserMgmt_CS → Analytics_CS |
| Content published/archived | INFO | ContentMgmt_CS → Analytics_CS |
| Role assigned/revoked | WARN | UserMgmt_CS → Analytics_CS |
| Integration call failure | WARN | Integration_IS |
| Integration circuit opened | ERROR | Integration_IS |
| Unhandled exception | ERROR | Any CS → Analytics_CS |
| Config change | WARN | SharedLib_IS → Analytics_CS |

---

## 11. CI/CD & Deployment Strategy

### Environment Pipeline

```
Developer Machine (Personal Environment)
        ↓  [1-click publish]
DEV Environment
        ↓  [LifeTime deployment plan — automated]
QA Environment       ← QA team performs testing
        ↓  [LifeTime deployment plan — gated by QA sign-off]
STAGING Environment  ← UAT / Performance testing
        ↓  [LifeTime deployment plan — Release Manager approval]
PRODUCTION
```

### Deployment Order (Module Dependencies)

Deploy in this strict order to avoid broken references:

```
Stage 1 (Foundation):
  SharedLib_IS → Identity_IS → Integration_IS → StyleGuide_UI

Stage 2 (Core Services):
  UserMgmt_CS → Notifications_CS → ContentMgmt_CS → Analytics_CS

Stage 3 (Core UI):
  UserMgmt_UI → Notifications_UI

Stage 4 (End-User Apps):
  Portal_Web → Admin_Web
```

### Deployment Rules

- [ ] **Never deploy directly to Production** — all changes go through the pipeline
- [ ] **Tag every production deployment** in LifeTime with version number and change ticket
- [ ] **Database migrations** are handled by OutSystems automatically — review entity changes before deploying to PROD
- [ ] **Integration configurations** (URLs, API keys) are set per-environment using Site Properties — never hardcoded
- [ ] **Feature flags** in `SharedLib_IS` allow dark launches — deploy code to PROD before enabling for users

### Site Properties per Environment

| Property | DEV | QA | STAGING | PROD |
|----------|-----|----|---------|------|
| `HRMS_BaseURL` | mock URL | test URL | staging URL | prod URL |
| `Debug_LogLevel` | VERBOSE | INFO | INFO | WARN |
| `FeatureFlag_NewDashboard` | True | True | False | False |
| `Auth_IdP_URL` | dev tenant | qa tenant | staging tenant | prod tenant |

---

## 12. Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: God Module

**Problem:** One module (`MainApp_CS`) contains all entities, all logic, all screens.  
**Consequence:** Impossible to maintain, scale, or deploy independently. One bug requires full regression.  
**Fix:** Split by business domain. Each domain = one CS module.

---

### ❌ Anti-Pattern 2: Bypassing Core Services

**Problem:** End-User module directly aggregates on `UserMgmt_CS` entities via reference.  
**Consequence:** Business rules are bypassed, data integrity is at risk, no central audit trail.  
**Fix:** Always go through Server Actions exposed by the Core Service.

---

### ❌ Anti-Pattern 3: Upward Dependencies

**Problem:** `SharedLib_IS` references `UserMgmt_CS` to get the current user.  
**Consequence:** Circular dependency risk; foundation becomes coupled to business domain.  
**Fix:** Pass user context as an input parameter. Foundation never knows about domain.

---

### ❌ Anti-Pattern 4: Unbounded Queries

**Problem:** `GetAllUsers` aggregate with no pagination, called on screen load.  
**Consequence:** Memory spike, slow screen, database full-scan, timeout at scale.  
**Fix:** Mandatory pagination on ALL list aggregates. Default `PageSize = 20`.

---

### ❌ Anti-Pattern 5: Hardcoded Configuration

**Problem:** `BaseURL = "https://api.hrms.company.com"` in action logic.  
**Consequence:** Cannot deploy to multiple environments without code changes.  
**Fix:** Store all config in `SystemConfig` entity (via `SharedLib_IS`) or Site Properties.

---

### ❌ Anti-Pattern 6: Synchronous Notification Sending

**Problem:** `User_Create` action waits for email confirmation before returning.  
**Consequence:** Screen blocks for 2–5 seconds per user creation; email failures break user creation.  
**Fix:** Decouple notification sending. Use BPT Event or Timer-based queue.

---

### ❌ Anti-Pattern 7: Logic in Screen Preparation

**Problem:** Preparation action contains `IF` business rules, calculations, validation logic.  
**Consequence:** Logic is untestable, unreusable, and leaks business concerns into UI.  
**Fix:** Preparation only calls a single Server Action per data section. Logic lives in CS.

---

### ❌ Anti-Pattern 8: Direct Inter-CS Entity Sharing

**Problem:** `ContentMgmt_CS` references `UserMgmt_CS` entities to join `Article.AuthorId` with `User.Name`.  
**Consequence:** Tight coupling; a schema change in UserMgmt breaks ContentMgmt.  
**Fix:** `ContentMgmt_CS` stores a denormalized `AuthorName` Text field, or calls `UserMgmt_CS.User_Get` to resolve names at display time.

---

## 13. Module Inventory Checklist

Use this as your **Definition of Done** checklist for every module.

### For Every Core Service Module (`_CS`)

- [ ] Module has a single, clearly defined business domain
- [ ] All entities are owned exclusively by this module
- [ ] All entities have indexes on FK and filter columns
- [ ] All entities implement soft delete (`IsDeleted`, `DeletedOn`)
- [ ] All list-returning actions support pagination
- [ ] All write actions return standard output structure (`out_Success`, `out_ErrorCode`)
- [ ] All write actions perform role permission check via `Identity_IS`
- [ ] All write actions write to audit log via `Analytics_CS.AuditLog_Write`
- [ ] No direct REST/HTTP calls — all external calls via `Integration_IS`
- [ ] No hardcoded URLs, credentials, or configuration values
- [ ] No direct reference to End-User modules
- [ ] No direct entity reference to other CS modules' entities

### For Every End-User Module (`_Web`, `_App`)

- [ ] No business logic in screen Preparation actions
- [ ] No direct aggregates on Core Service entities
- [ ] All data fetched via Core Service Server Actions
- [ ] Role-based screen/menu visibility enforced using `Identity_IS.Role_HasPermission`
- [ ] All user-facing error messages are human-readable (not exception stack traces)
- [ ] All destructive actions (delete, disable) require confirmation dialog
- [ ] Loading states implemented for all async data fetches
- [ ] Pagination implemented on all list screens

### For Every Integration Connector (in `Integration_IS`)

- [ ] Timeout configured per connector in `IntegrationConfig`
- [ ] Retry logic implemented (max 3 retries with backoff)
- [ ] Circuit breaker logic implemented
- [ ] All calls logged to `IntegrationLog` (request, response, duration, status)
- [ ] Credentials stored encrypted in `IntegrationConfig`, never hardcoded
- [ ] Data transformation tested with real payloads from external system

---

## Architecture Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| ADR-001 | SSO via Identity_IS Foundation | Isolates IdP logic, allows IdP swap without impacting business modules | Apr 2026 |
| ADR-002 | Soft delete over hard delete | Preserves audit trail; required for compliance | Apr 2026 |
| ADR-003 | Notifications async via BPT | Prevents user-facing slowdown from email delivery latency | Apr 2026 |
| ADR-004 | Pre-computed dashboard metrics | Avoids runtime aggregation on large datasets | Apr 2026 |
| ADR-005 | Single Integration_IS gateway | Centralized logging, circuit breaker, credential management | Apr 2026 |
| ADR-006 | Standard pagination structure from SharedLib_IS | Consistency across 100% of list APIs; enables future API exposure | Apr 2026 |

---

*This document is the authoritative architecture reference. Any deviation requires an Architecture Decision Record (ADR) entry and review by the Solution Architect before implementation.*
