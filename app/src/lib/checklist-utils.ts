import { ChecklistItem, ModuleSuffix } from '@/types/architecture';
import { v4 as uuidv4 } from 'uuid';

export function getDefaultChecklist(suffix: ModuleSuffix): ChecklistItem[] {
  switch (suffix) {
    case 'CS':
      return [
        { id: uuidv4(), label: 'Module has a single, clearly defined business domain', checked: false, category: 'cs' },
        { id: uuidv4(), label: 'All entities are owned exclusively by this module', checked: false, category: 'cs' },
        { id: uuidv4(), label: 'All entities have indexes on FK and filter columns', checked: false, category: 'cs' },
        { id: uuidv4(), label: 'All entities implement soft delete (IsDeleted, DeletedOn)', checked: false, category: 'cs' },
        { id: uuidv4(), label: 'All list-returning actions support pagination', checked: false, category: 'cs' },
        { id: uuidv4(), label: 'All write actions return standard output structure', checked: false, category: 'cs' },
        { id: uuidv4(), label: 'All write actions perform role permission check', checked: false, category: 'cs' },
        { id: uuidv4(), label: 'All write actions write to audit log', checked: false, category: 'cs' },
        { id: uuidv4(), label: 'No direct REST/HTTP calls (all via Integration_IS)', checked: false, category: 'cs' },
        { id: uuidv4(), label: 'No hardcoded URLs, credentials, or configuration values', checked: false, category: 'cs' },
      ];

    case 'Web':
    case 'App':
      return [
        { id: uuidv4(), label: 'No business logic in screen Preparation actions', checked: false, category: 'end-user' },
        { id: uuidv4(), label: 'No direct aggregates on Core Service entities', checked: false, category: 'end-user' },
        { id: uuidv4(), label: 'All data fetched via Core Service Server Actions', checked: false, category: 'end-user' },
        { id: uuidv4(), label: 'Role-based screen/menu visibility enforced', checked: false, category: 'end-user' },
        { id: uuidv4(), label: 'All user-facing error messages are human-readable', checked: false, category: 'end-user' },
        { id: uuidv4(), label: 'All destructive actions require confirmation dialog', checked: false, category: 'end-user' },
        { id: uuidv4(), label: 'Loading states implemented for all async data fetches', checked: false, category: 'end-user' },
        { id: uuidv4(), label: 'Pagination implemented on all list screens', checked: false, category: 'end-user' },
      ];

    case 'IS':
      return [
        { id: uuidv4(), label: 'Timeout configured per connector', checked: false, category: 'integration' },
        { id: uuidv4(), label: 'Retry logic implemented (max 3 retries with backoff)', checked: false, category: 'integration' },
        { id: uuidv4(), label: 'Circuit breaker logic implemented', checked: false, category: 'integration' },
        { id: uuidv4(), label: 'All calls logged to IntegrationLog', checked: false, category: 'integration' },
        { id: uuidv4(), label: 'Credentials stored encrypted, never hardcoded', checked: false, category: 'integration' },
        { id: uuidv4(), label: 'Data transformation tested with real payloads', checked: false, category: 'integration' },
      ];

    case 'BL':
      return [
        { id: 'bl-1', label: 'Module has a single, clearly defined logic domain', checked: false, category: 'cs' },
        { id: 'bl-2', label: 'No database entities owned (pure logic only)', checked: false, category: 'cs' },
        { id: 'bl-3', label: 'No UI components or screens', checked: false, category: 'cs' },
        { id: 'bl-4', label: 'All functions are stateless and reusable', checked: false, category: 'cs' },
        { id: 'bl-5', label: 'No hardcoded configuration values', checked: false, category: 'cs' },
        { id: 'bl-6', label: 'Input validation performed on all public actions', checked: false, category: 'cs' },
      ];

    case 'UI':
      return [
        { id: 'ui-1', label: 'Module exposes only reusable UI blocks (no screens)', checked: false, category: 'end-user' },
        { id: 'ui-2', label: 'No business logic — UI display and user interaction only', checked: false, category: 'end-user' },
        { id: 'ui-3', label: 'All blocks fetch their own data via CS Server Actions', checked: false, category: 'end-user' },
        { id: 'ui-4', label: 'Accessible (WCAG 2.1 AA) — keyboard navigable, ARIA labels', checked: false, category: 'end-user' },
        { id: 'ui-5', label: 'Loading states implemented for async data blocks', checked: false, category: 'end-user' },
        { id: 'ui-6', label: 'Depends on StyleGuide_UI for base styling', checked: false, category: 'end-user' },
      ];

    default:
      return [];
  }
}
