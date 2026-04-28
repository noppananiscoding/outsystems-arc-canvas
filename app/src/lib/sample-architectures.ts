/**
 * Pre-built sample architectures for the OutSystems Architecture Canvas.
 *
 * BEST_PRACTICES_ARCHITECTURE — 12 modules, all valid, zero violations
 * ANTI_PATTERN_SHOWCASE      — 22 modules, demonstrates all 8 anti-patterns
 */

import { ArchitectureFile, Module, Dependency, ModuleSuffix } from '@/types/architecture';
import { deriveLayerAndTrack } from '@/lib/module-utils';
import { isDependencyAllowed } from '@/lib/validation';
import { getDefaultChecklist } from '@/lib/checklist-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeModule(
  id: string,
  name: string,
  suffix: ModuleSuffix,
  x: number,
  y: number,
  description: string,
  ownedEntities: string[] = [],
  notes = '',
): Module {
  const { layer, track } = deriveLayerAndTrack(suffix, name);
  return {
    id,
    name,
    suffix,
    layer,
    track,
    description,
    ownedEntities,
    dependsOn: [],       // filled in by buildDeps
    notes,
    position: { x, y },
    checklistItems: getDefaultChecklist(suffix),
  };
}

/**
 * Build Dependency objects from [sourceId, targetId] pairs.
 * Also updates `module.dependsOn` so both arrays stay in sync.
 */
function buildDeps(
  modules: Module[],
  pairs: [string, string][],
  idPrefix: string,
): Dependency[] {
  const byId = new Map(modules.map(m => [m.id, m]));
  const result: Dependency[] = [];

  for (const [srcId, tgtId] of pairs) {
    const source = byId.get(srcId);
    const target = byId.get(tgtId);
    if (!source || !target) continue;

    const check = isDependencyAllowed(source, target);
    result.push({
      id: `${idPrefix}-${srcId}-${tgtId}`,
      sourceId: srcId,
      targetId: tgtId,
      isValid: check.allowed,
      violationReason: check.reason,
    });

    // Keep dependsOn in sync (modules are plain objects we just built)
    source.dependsOn.push(tgtId);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Architecture 1: Best Practices Reference
// ---------------------------------------------------------------------------
// 12 modules — all correctly named, all dependencies valid, 0 ERRORs / 0 WARNs
// Mirrors the default sample data built in architecture-store.ts

const BP = {
  PORTAL_WEB:        'bp-portal-web',
  ADMIN_WEB:         'bp-admin-web',
  USERMGMT_CS:       'bp-usermgmt-cs',
  NOTIFICATIONS_CS:  'bp-notifications-cs',
  CONTENTMGMT_CS:    'bp-contentmgmt-cs',
  ANALYTICS_CS:      'bp-analytics-cs',
  USERMGMT_UI:       'bp-usermgmt-ui',
  NOTIFICATIONS_UI:  'bp-notifications-ui',
  IDENTITY_IS:       'bp-identity-is',
  INTEGRATION_IS:    'bp-integration-is',
  SHAREDLIB_IS:      'bp-sharedlib-is',
  STYLEGUIDE_UI:     'bp-styleguide-ui',
};

function buildBestPractices(): ArchitectureFile {
  const modules: Module[] = [
    // End-User layer
    makeModule(BP.PORTAL_WEB,       'Portal_Web',        'Web', 100,  50,  'Customer-facing web portal', []),
    makeModule(BP.ADMIN_WEB,        'Admin_Web',         'Web', 440,  50,  'Administration and back-office portal', []),

    // Core layer — Service track
    makeModule(BP.USERMGMT_CS,      'UserMgmt_CS',       'CS',  100, 300, 'User management core service', ['User', 'UserProfile', 'UserRole']),
    makeModule(BP.NOTIFICATIONS_CS, 'Notifications_CS',  'CS',  400, 300, 'Notification core service', ['Notification', 'NotificationTemplate']),
    makeModule(BP.CONTENTMGMT_CS,   'ContentMgmt_CS',    'CS',  700, 300, 'Content management core service', ['Content', 'ContentCategory', 'ContentTag']),
    makeModule(BP.ANALYTICS_CS,     'Analytics_CS',      'CS', 1000, 300, 'Analytics and reporting core service — supports pagination on all list actions', ['AnalyticsEvent', 'Report']),

    // Core layer — UI track
    makeModule(BP.USERMGMT_UI,      'UserMgmt_UI',       'UI',  100, 500, 'User management UI reusable blocks', []),
    makeModule(BP.NOTIFICATIONS_UI, 'Notifications_UI',  'UI',  380, 500, 'Notification UI reusable blocks', []),

    // Foundation layer — Service track
    makeModule(BP.IDENTITY_IS,      'Identity_IS',       'IS',  100, 700, 'Identity provider integration (OAuth2/OIDC)', []),
    makeModule(BP.INTEGRATION_IS,   'Integration_IS',    'IS',  400, 700, 'External system integration connector', []),
    makeModule(BP.SHAREDLIB_IS,     'SharedLib_IS',      'IS',  700, 700, 'Shared libraries, utilities and cross-cutting concerns', []),

    // Foundation layer — UI track (special name → foundation by module-utils)
    makeModule(BP.STYLEGUIDE_UI,    'StyleGuide_UI',     'UI',  100, 900, 'Design system, tokens and style guide', []),
  ];

  const depPairs: [string, string][] = [
    // Portal_Web dependencies
    [BP.PORTAL_WEB,       BP.USERMGMT_CS],
    [BP.PORTAL_WEB,       BP.NOTIFICATIONS_CS],
    [BP.PORTAL_WEB,       BP.CONTENTMGMT_CS],
    [BP.PORTAL_WEB,       BP.STYLEGUIDE_UI],
    [BP.PORTAL_WEB,       BP.USERMGMT_UI],
    // Admin_Web dependencies
    [BP.ADMIN_WEB,        BP.USERMGMT_CS],
    [BP.ADMIN_WEB,        BP.CONTENTMGMT_CS],
    [BP.ADMIN_WEB,        BP.ANALYTICS_CS],
    [BP.ADMIN_WEB,        BP.STYLEGUIDE_UI],
    // Core CS dependencies (downward to Foundation only)
    [BP.USERMGMT_CS,      BP.IDENTITY_IS],
    [BP.USERMGMT_CS,      BP.SHAREDLIB_IS],
    [BP.NOTIFICATIONS_CS, BP.SHAREDLIB_IS],
    [BP.NOTIFICATIONS_CS, BP.INTEGRATION_IS],
    [BP.CONTENTMGMT_CS,   BP.SHAREDLIB_IS],
    [BP.ANALYTICS_CS,     BP.SHAREDLIB_IS],
    // Core UI dependencies
    [BP.USERMGMT_UI,      BP.USERMGMT_CS],
    [BP.USERMGMT_UI,      BP.STYLEGUIDE_UI],
    [BP.NOTIFICATIONS_UI, BP.NOTIFICATIONS_CS],
    [BP.NOTIFICATIONS_UI, BP.STYLEGUIDE_UI],
    // Foundation internal
    [BP.INTEGRATION_IS,   BP.SHAREDLIB_IS],
  ];

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projectName: 'Best Practices Reference',
    modules,
    dependencies: buildDeps(modules, depPairs, 'bp'),
  };
}

// ---------------------------------------------------------------------------
// Architecture 2: Anti-Pattern Showcase
// ---------------------------------------------------------------------------
// 22 modules — intentionally broken to demonstrate all 8 anti-patterns:
//
// ERRORs (from runValidation / isDependencyAllowed):
//   1. UPWARD_DEP      : SharedData_CS → Portal_Web (core→end-user)
//   2. END_USER_HORIZ  : Portal_Web → Admin_Web (end-user→end-user)
//   3. CS_TO_CS (×2)   : Orders_CS → UserMgmt_CS, Orders_CS → Inventory_CS
//
// WARNs (from detectAntiPatterns):
//   4. GOD_MODULE         : MainApp_CS owns 10 entities (>8)
//   5. MISSING_FOUNDATION : Inventory_CS has no foundation dependency
//   6. GOD_CANVAS         : 22 modules (>20)
//
// INFOs (from detectAntiPatterns):
//   7. BYPASSING_CORE  : Portal_Web → Integration_IS (end-user→foundation service)
//   8. EMPTY_MODULE    : Quick_CS has no description, entities, or dependencies

const AP = {
  PORTAL_WEB:      'ap-portal-web',
  ADMIN_WEB:       'ap-admin-web',
  BACKOFFICE_WEB:  'ap-backoffice-web',
  MOBILE_APP:      'ap-mobile-app',

  MAINAPP_CS:      'ap-mainapp-cs',
  ORDERS_CS:       'ap-orders-cs',
  INVENTORY_CS:    'ap-inventory-cs',
  USERMGMT_CS:     'ap-usermgmt-cs',
  PAYMENTS_CS:     'ap-payments-cs',
  SHIPPING_CS:     'ap-shipping-cs',
  REPORTS_CS:      'ap-reports-cs',
  CRM_CS:          'ap-crm-cs',
  QUICK_CS:        'ap-quick-cs',
  SHAREDDATA_CS:   'ap-shareddata-cs',

  USERMGMT_UI:     'ap-usermgmt-ui',
  DASHBOARD_UI:    'ap-dashboard-ui',
  FORMS_UI:        'ap-forms-ui',

  IDENTITY_IS:     'ap-identity-is',
  INTEGRATION_IS:  'ap-integration-is',
  SHAREDLIB_IS:    'ap-sharedlib-is',
  EMAILSVC_IS:     'ap-emailsvc-is',

  STYLEGUIDE_UI:   'ap-styleguide-ui',
};

function buildAntiPatternShowcase(): ArchitectureFile {
  const modules: Module[] = [
    // ── End-User layer ────────────────────────────────────────────────────
    makeModule(AP.PORTAL_WEB,     'Portal_Web',     'Web',  100,  50,  'Customer portal — has forbidden horizontal & bypass deps'),
    makeModule(AP.ADMIN_WEB,      'Admin_Web',       'Web',  440,  50,  'Admin portal'),
    makeModule(AP.BACKOFFICE_WEB, 'BackOffice_Web',  'Web',  780,  50,  'Back-office operations portal'),
    makeModule(AP.MOBILE_APP,     'Mobile_App',      'App', 1120,  50,  'Mobile application'),

    // ── Core layer — Service track ─────────────────────────────────────────
    // GOD_MODULE: 10 owned entities (>8 → WARN)
    makeModule(AP.MAINAPP_CS,   'MainApp_CS',   'CS',  100, 300,
      'Monolithic core service owning way too many domains',
      ['Customer', 'Order', 'Product', 'Invoice', 'Payment', 'Shipment', 'Category', 'Supplier', 'Review', 'Wishlist'],
    ),
    // CS-to-CS violations (Orders_CS → UserMgmt_CS and Inventory_CS → ERROR)
    makeModule(AP.ORDERS_CS,    'Orders_CS',    'CS',  430, 300,
      'Order management — incorrectly depends on sibling CS modules',
      ['OrderLine', 'OrderStatus'],
    ),
    // MISSING_FOUNDATION_DEP: no foundation dep (WARN) + UNBOUNDED_QUERIES (INFO)
    makeModule(AP.INVENTORY_CS, 'Inventory_CS', 'CS',  760, 300,
      'Inventory tracking — missing required Foundation dependency',
      ['Product', 'StockLevel', 'Warehouse'],
    ),
    makeModule(AP.USERMGMT_CS,  'UserMgmt_CS',  'CS', 1090, 300,
      'User management core service',
      ['User', 'UserProfile', 'UserRole'],
    ),
    makeModule(AP.PAYMENTS_CS,  'Payments_CS',  'CS',  100, 480,
      'Payment processing core service',
      ['Payment', 'PaymentMethod'],
    ),
    makeModule(AP.SHIPPING_CS,  'Shipping_CS',  'CS',  380, 480,
      'Shipping and logistics core service',
      ['Shipment', 'ShipmentTracking'],
    ),
    makeModule(AP.REPORTS_CS,   'Reports_CS',   'CS',  660, 480,
      'Reporting and analytics core service',
      ['ReportDefinition', 'ReportExecution'],
    ),
    makeModule(AP.CRM_CS,       'CRM_CS',       'CS',  940, 480,
      'Customer relationship management core service',
      ['Lead', 'Opportunity', 'Contact'],
    ),
    // EMPTY_MODULE: no description, no entities, no deps (INFO)
    makeModule(AP.QUICK_CS,     'Quick_CS',     'CS', 1220, 480,
      '',  // intentionally blank → EMPTY_MODULE
      [],
    ),
    // UPWARD_DEP: will depend on Portal_Web (core→end-user → ERROR)
    makeModule(AP.SHAREDDATA_CS,'SharedData_CS','CS',  220, 480,
      'Shared data service — incorrectly depends upward on end-user layer',
      ['SharedConfig'],
    ),

    // ── Core layer — UI track ──────────────────────────────────────────────
    makeModule(AP.USERMGMT_UI,   'UserMgmt_UI',   'UI',  100, 660, 'User management UI blocks'),
    makeModule(AP.DASHBOARD_UI,  'Dashboard_UI',  'UI',  380, 660, 'Dashboard UI blocks'),
    makeModule(AP.FORMS_UI,      'Forms_UI',      'UI',  660, 660, 'Reusable form UI blocks'),

    // ── Foundation layer — Service track ──────────────────────────────────
    makeModule(AP.IDENTITY_IS,    'Identity_IS',    'IS',  100, 860, 'Identity provider integration'),
    makeModule(AP.INTEGRATION_IS, 'Integration_IS', 'IS',  380, 860, 'External integration connector'),
    makeModule(AP.SHAREDLIB_IS,   'SharedLib_IS',   'IS',  660, 860, 'Shared libraries and utilities'),
    makeModule(AP.EMAILSVC_IS,    'EmailSvc_IS',    'IS',  940, 860, 'Email delivery service integration'),

    // ── Foundation layer — UI track (special name → foundation) ───────────
    makeModule(AP.STYLEGUIDE_UI,  'StyleGuide_UI',  'UI',  100, 1040, 'Design system and style guide'),
  ];

  const depPairs: [string, string][] = [
    // ── End-User valid deps ────────────────────────────────────────────────
    [AP.PORTAL_WEB,     AP.USERMGMT_CS],      // valid: end-user → core
    [AP.PORTAL_WEB,     AP.MAINAPP_CS],        // valid: end-user → core
    [AP.PORTAL_WEB,     AP.USERMGMT_UI],       // valid: end-user → core UI

    // ANTI-PATTERN #2: End-user → End-user horizontal (ERROR)
    [AP.PORTAL_WEB,     AP.ADMIN_WEB],

    // ANTI-PATTERN #7: End-user → Foundation service bypass (INFO)
    [AP.PORTAL_WEB,     AP.INTEGRATION_IS],

    [AP.ADMIN_WEB,      AP.USERMGMT_CS],       // valid
    [AP.ADMIN_WEB,      AP.REPORTS_CS],         // valid
    [AP.ADMIN_WEB,      AP.STYLEGUIDE_UI],      // valid
    [AP.BACKOFFICE_WEB, AP.MAINAPP_CS],         // valid
    [AP.BACKOFFICE_WEB, AP.ORDERS_CS],          // valid
    [AP.BACKOFFICE_WEB, AP.STYLEGUIDE_UI],      // valid
    [AP.MOBILE_APP,     AP.USERMGMT_CS],        // valid
    [AP.MOBILE_APP,     AP.ORDERS_CS],          // valid

    // ── Core CS valid deps ─────────────────────────────────────────────────
    [AP.MAINAPP_CS,   AP.SHAREDLIB_IS],         // valid: core → foundation
    [AP.MAINAPP_CS,   AP.IDENTITY_IS],           // valid

    // ANTI-PATTERN #3a: CS-to-CS horizontal (ERROR)
    [AP.ORDERS_CS,    AP.USERMGMT_CS],

    // ANTI-PATTERN #3b: CS-to-CS horizontal (ERROR)
    [AP.ORDERS_CS,    AP.INVENTORY_CS],

    // Inventory_CS: intentionally NO foundation dep → MISSING_FOUNDATION_DEP (WARN)
    // (no pairs added for Inventory_CS → foundation)

    [AP.USERMGMT_CS,  AP.IDENTITY_IS],          // valid
    [AP.USERMGMT_CS,  AP.SHAREDLIB_IS],         // valid
    [AP.PAYMENTS_CS,  AP.SHAREDLIB_IS],         // valid
    [AP.SHIPPING_CS,  AP.SHAREDLIB_IS],         // valid
    [AP.REPORTS_CS,   AP.SHAREDLIB_IS],         // valid
    [AP.CRM_CS,       AP.SHAREDLIB_IS],         // valid

    // ANTI-PATTERN #1: Upward dep — core → end-user (ERROR)
    [AP.SHAREDDATA_CS, AP.PORTAL_WEB],

    // ── Core UI deps ───────────────────────────────────────────────────────
    [AP.USERMGMT_UI,  AP.USERMGMT_CS],          // valid
    [AP.USERMGMT_UI,  AP.STYLEGUIDE_UI],        // valid
    [AP.DASHBOARD_UI, AP.MAINAPP_CS],           // valid
    [AP.DASHBOARD_UI, AP.STYLEGUIDE_UI],        // valid
    [AP.FORMS_UI,     AP.STYLEGUIDE_UI],        // valid

    // ── Foundation internal ────────────────────────────────────────────────
    [AP.IDENTITY_IS,    AP.SHAREDLIB_IS],       // valid
    [AP.INTEGRATION_IS, AP.SHAREDLIB_IS],       // valid
    [AP.EMAILSVC_IS,    AP.SHAREDLIB_IS],       // valid
  ];

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projectName: 'Anti-Pattern Showcase',
    modules,
    dependencies: buildDeps(modules, depPairs, 'ap'),
  };
}

// ---------------------------------------------------------------------------
// Exported constants — built once at module load time
// ---------------------------------------------------------------------------

export const BEST_PRACTICES_ARCHITECTURE: ArchitectureFile = buildBestPractices();
export const ANTI_PATTERN_SHOWCASE: ArchitectureFile = buildAntiPatternShowcase();
