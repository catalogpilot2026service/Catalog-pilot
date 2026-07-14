// src/content/index.ts
// THE SMART AUTO-FILL ENGINE
// Runs on Meesho pages. Finds form fields by CSS selector, sets values with React-compatible
// native value setters, dispatches input/change/blur events, and reports per-field progress.

import {
  MEESHO_FIELD_SELECTORS,
  MessageTypes,
  type ProfileData,
  type FillResult,
  type FillProgress,
  type ExtensionMessage,
  type MessageResponse,
} from '../lib/types';

// ---------------------------------------------------------------------------
// Field finding
// ---------------------------------------------------------------------------

function findField(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    try {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    } catch {
      // Invalid selector — skip
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Native value setter (React / Vue compatible)
// ---------------------------------------------------------------------------

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;

  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    (el as HTMLInputElement).value = value;
  }
}

function dispatchEvents(el: HTMLElement): void {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
}

// ---------------------------------------------------------------------------
// Field filling
// ---------------------------------------------------------------------------

function fillField(el: HTMLElement, value: string): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    setNativeValue(el, value);
    dispatchEvents(el);
    return true;
  }

  if (el instanceof HTMLSelectElement) {
    // Match by option text (case-insensitive contains)
    const lower = value.toLowerCase().trim();
    const options = Array.from(el.options);
    const match =
      options.find((o) => o.text.toLowerCase().trim() === lower) ??
      options.find((o) => o.text.toLowerCase().includes(lower));
    if (match) {
      el.value = match.value;
      // For React selects, set the selected property and dispatch
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    }
    // If no match, try setting raw value
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return false;
  }

  if (el.isContentEditable) {
    el.textContent = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Field reading
// ---------------------------------------------------------------------------

function getFieldValue(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    return el.value;
  }
  if (el.isContentEditable) {
    return el.textContent ?? '';
  }
  return '';
}

function hasExistingData(el: HTMLElement): boolean {
  const val = getFieldValue(el).trim();
  return val.length > 0;
}

// ---------------------------------------------------------------------------
// Form filling
// ---------------------------------------------------------------------------

function fillForm(profileData: ProfileData, askBeforeOverwrite: boolean): FillResult {
  const progress: FillProgress[] = [];
  let filled = 0;
  let skipped = 0;
  let notFound = 0;
  let overwritten = 0;
  let total = 0;

  const fields = Object.keys(MEESHO_FIELD_SELECTORS) as (keyof ProfileData)[];

  for (const field of fields) {
    const value = profileData[field];
    if (value === undefined || value === null) continue;

    // Handle arrays (bullet_points)
    const strValue = Array.isArray(value) ? value.join('\n') : String(value);
    if (!strValue.trim()) continue;

    total++;

    const selectors = MEESHO_FIELD_SELECTORS[field];
    const el = findField(selectors);

    if (!el) {
      notFound++;
      progress.push({ field, status: 'not_found', message: 'Field not found on page' });
      continue;
    }

    if (askBeforeOverwrite && hasExistingData(el)) {
      skipped++;
      progress.push({ field, status: 'skipped', selector: selectors[0], message: 'Field already has data' });
      continue;
    }

    const hadData = hasExistingData(el);
    const success = fillField(el, strValue);

    if (success) {
      if (hadData) {
        overwritten++;
        progress.push({ field, status: 'overwritten', selector: selectors[0] });
      } else {
        filled++;
        progress.push({ field, status: 'filled', selector: selectors[0] });
      }
    } else {
      notFound++;
      progress.push({ field, status: 'not_found', selector: selectors[0], message: 'Could not set value' });
    }
  }

  return { total, filled, skipped, notFound, overwritten, progress };
}

function fillFormWithProgress(
  profileData: ProfileData,
  askBeforeOverwrite: boolean,
  reportProgress: (p: FillProgress) => void,
): FillResult {
  const progress: FillProgress[] = [];
  let filled = 0;
  let skipped = 0;
  let notFound = 0;
  let overwritten = 0;
  let total = 0;

  const fields = Object.keys(MEESHO_FIELD_SELECTORS) as (keyof ProfileData)[];

  for (const field of fields) {
    const value = profileData[field];
    if (value === undefined || value === null) continue;

    const strValue = Array.isArray(value) ? value.join('\n') : String(value);
    if (!strValue.trim()) continue;

    total++;

    const selectors = MEESHO_FIELD_SELECTORS[field];
    const el = findField(selectors);

    let entry: FillProgress;

    if (!el) {
      notFound++;
      entry = { field, status: 'not_found', message: 'Field not found on page' };
    } else if (askBeforeOverwrite && hasExistingData(el)) {
      skipped++;
      entry = { field, status: 'skipped', selector: selectors[0], message: 'Field already has data' };
    } else {
      const hadData = hasExistingData(el);
      const success = fillField(el, strValue);
      if (success) {
        if (hadData) {
          overwritten++;
          entry = { field, status: 'overwritten', selector: selectors[0] };
        } else {
          filled++;
          entry = { field, status: 'filled', selector: selectors[0] };
        }
      } else {
        notFound++;
        entry = { field, status: 'not_found', selector: selectors[0], message: 'Could not set value' };
      }
    }

    progress.push(entry);
    reportProgress(entry);
  }

  return { total, filled, skipped, notFound, overwritten, progress };
}

// ---------------------------------------------------------------------------
// Form extraction
// ---------------------------------------------------------------------------

function extractForm(): ProfileData {
  const data: Partial<ProfileData> = {};

  const fields = Object.keys(MEESHO_FIELD_SELECTORS) as (keyof ProfileData)[];

  for (const field of fields) {
    const selectors = MEESHO_FIELD_SELECTORS[field];
    const el = findField(selectors);
    if (!el) {
      // Default empty
      (data as Record<string, unknown>)[field] = field === 'bullet_points' ? [] : '';
      continue;
    }

    const value = getFieldValue(el);

    if (field === 'bullet_points') {
      // Split by newline, filter empty
      (data as Record<string, unknown>)[field] = value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      (data as Record<string, unknown>)[field] = value.trim();
    }
  }

  return data as ProfileData;
}

// ---------------------------------------------------------------------------
// Variant filling (fills profile fields + variant-specific fields)
// ---------------------------------------------------------------------------

const VARIANT_SELECTORS: Record<string, string[]> = {
  color: [
    'input[name="color"]',
    'input[placeholder*="Color" i]',
    'select[name="color"]',
    '#color',
    'input[data-testid="color"]',
    'input[aria-label*="Color" i]',
  ],
  size: [
    'input[name="size"]',
    'input[placeholder*="Size" i]',
    'select[name="size"]',
    '#size',
    'input[data-testid="size"]',
    'input[aria-label*="Size" i]',
  ],
  selling_price: [
    'input[name="selling_price"]',
    'input[name="price"]',
    'input[placeholder*="Price" i]',
    'input[placeholder*="Selling" i]',
    '#selling_price',
    'input[data-testid="selling_price"]',
  ],
  stock_quantity: [
    'input[name="stock_quantity"]',
    'input[name="stock"]',
    'input[name="quantity"]',
    'input[placeholder*="Stock" i]',
    'input[placeholder*="Quantity" i]',
    '#stock_quantity',
  ],
};

function fillVariant(
  profileData: ProfileData,
  variantData: Record<string, unknown>,
  askBeforeOverwrite: boolean,
): FillResult {
  // First fill profile fields
  const result = fillForm(profileData, askBeforeOverwrite);

  // Then fill variant-specific fields
  for (const [field, selectors] of Object.entries(VARIANT_SELECTORS)) {
    const value = variantData[field];
    if (value === undefined || value === null) continue;
    const strValue = String(value);
    if (!strValue.trim()) continue;

    result.total++;
    const el = findField(selectors);

    if (!el) {
      result.notFound++;
      result.progress.push({ field: field as keyof ProfileData, status: 'not_found', message: 'Variant field not found' });
      continue;
    }

    if (askBeforeOverwrite && hasExistingData(el)) {
      result.skipped++;
      result.progress.push({ field: field as keyof ProfileData, status: 'skipped', selector: selectors[0] });
      continue;
    }

    const hadData = hasExistingData(el);
    const success = fillField(el, strValue);

    if (success) {
      if (hadData) {
        result.overwritten++;
        result.progress.push({ field: field as keyof ProfileData, status: 'overwritten', selector: selectors[0] });
      } else {
        result.filled++;
        result.progress.push({ field: field as keyof ProfileData, status: 'filled', selector: selectors[0] });
      }
    } else {
      result.notFound++;
      result.progress.push({ field: field as keyof ProfileData, status: 'not_found', selector: selectors[0] });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Message listener
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void,
  ) => {
    switch (message.type) {
      case MessageTypes.FILL_FORM: {
        try {
          const result = fillForm(message.profileData, message.askBeforeOverwrite ?? true);
          sendResponse({ success: true, data: result });
        } catch (err) {
          sendResponse({ success: false, error: err instanceof Error ? err.message : 'Fill failed' });
        }
        return false;
      }

      case MessageTypes.FILL_FORM_WITH_PROGRESS: {
        try {
          const result = fillFormWithProgress(
            message.profileData,
            message.askBeforeOverwrite ?? true,
            (p: FillProgress) => {
              // Report progress back to popup via runtime message
              void chrome.runtime.sendMessage({ type: 'FILL_PROGRESS', progress: p }).catch(() => {
                // Popup may not be listening — ignore
              });
            },
          );
          sendResponse({ success: true, data: result });
        } catch (err) {
          sendResponse({ success: false, error: err instanceof Error ? err.message : 'Fill failed' });
        }
        return false;
      }

      case MessageTypes.EXTRACT_FORM: {
        try {
          const data = extractForm();
          sendResponse({ success: true, data });
        } catch (err) {
          sendResponse({ success: false, error: err instanceof Error ? err.message : 'Extract failed' });
        }
        return false;
      }

      case MessageTypes.FILL_VARIANT: {
        try {
          const result = fillVariant(
            message.profileData,
            message.variantData,
            message.askBeforeOverwrite ?? true,
          );
          sendResponse({ success: true, data: result });
        } catch (err) {
          sendResponse({ success: false, error: err instanceof Error ? err.message : 'Variant fill failed' });
        }
        return false;
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
        return false;
    }
  },
);

// Signal that content script is ready
console.log('[CatalogPilot] Content script loaded on', window.location.href);
