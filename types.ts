// src/lib/types.ts
// Core types and constants for the CatalogPilot Chrome Extension.

export interface ProfileData {
  brand: string;
  hsn_code: string;
  gst_percent: string;
  manufacturer_details: string;
  packer_details: string;
  importer_details: string;
  country_of_origin: string;
  material: string;
  description: string;
  bullet_points: string[];
  dispatch_time: string;
  return_policy: string;
  care_instructions: string;
  package_details: string;
}

/** Fields that change per catalog and are NOT auto-filled. */
export const NON_FILLABLE_FIELDS = [
  'product_images',
  'product_title',
  'selling_price',
  'color',
  'size',
  'stock_quantity',
] as const;

export type NonFillableField = (typeof NON_FILLABLE_FIELDS)[number];

export interface ListingProfile {
  id: string;
  user_id: string;
  name: string;
  profile_data: ProfileData;
  folder: string | null;
  is_favorite: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export type VariantStatus = 'draft' | 'ready' | 'published' | 'archived';

export interface CatalogVariant {
  id: string;
  user_id: string;
  profile_id: string | null;
  profile_name: string;
  color: string;
  size: string;
  selling_price: number;
  mrp: number;
  stock_quantity: number;
  images: string[];
  variant_data: Record<string, unknown>;
  status: VariantStatus;
  platform_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExtensionSettings {
  autoFillEnabled: boolean;
  autoSaveLastUsed: boolean;
  manualFillOnly: boolean;
  askBeforeOverwrite: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  autoFillEnabled: true,
  autoSaveLastUsed: true,
  manualFillOnly: false,
  askBeforeOverwrite: true,
};

export interface SessionState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userEmail: string;
  userId: string;
}

/** CSS selectors for each reusable Meesho form field. Tried in order. */
export const MEESHO_FIELD_SELECTORS: Record<keyof ProfileData, string[]> = {
  brand: [
    'input[name="brand"]',
    'input[placeholder*="Brand" i]',
    'input[placeholder*="brand" i]',
    'input[data-testid="brand"]',
    '#brand',
    'input[aria-label*="Brand" i]',
  ],
  hsn_code: [
    'input[name="hsn_code"]',
    'input[name="hsn"]',
    'input[placeholder*="HSN" i]',
    'input[data-testid="hsn_code"]',
    '#hsn_code',
    'input[aria-label*="HSN" i]',
  ],
  gst_percent: [
    'input[name="gst_percent"]',
    'input[name="gst"]',
    'select[name="gst_percent"]',
    'select[placeholder*="GST" i]',
    '#gst_percent',
    'input[data-testid="gst_percent"]',
  ],
  manufacturer_details: [
    'input[name="manufacturer_details"]',
    'input[name="manufacturer"]',
    'textarea[name="manufacturer_details"]',
    'input[placeholder*="Manufacturer" i]',
    '#manufacturer_details',
    'input[aria-label*="Manufacturer" i]',
  ],
  packer_details: [
    'input[name="packer_details"]',
    'input[name="packer"]',
    'textarea[name="packer_details"]',
    'input[placeholder*="Packer" i]',
    '#packer_details',
    'input[aria-label*="Packer" i]',
  ],
  importer_details: [
    'input[name="importer_details"]',
    'input[name="importer"]',
    'textarea[name="importer_details"]',
    'input[placeholder*="Importer" i]',
    '#importer_details',
    'input[aria-label*="Importer" i]',
  ],
  country_of_origin: [
    'select[name="country_of_origin"]',
    'select[name="country"]',
    'input[name="country_of_origin"]',
    'select[data-testid="country_of_origin"]',
    '#country_of_origin',
    'input[aria-label*="Country" i]',
  ],
  material: [
    'input[name="material"]',
    'select[name="material"]',
    'input[placeholder*="Material" i]',
    'input[data-testid="material"]',
    '#material',
    'input[aria-label*="Material" i]',
  ],
  description: [
    'textarea[name="description"]',
    'textarea[placeholder*="Description" i]',
    'div[contenteditable="true"][data-testid="description"]',
    '#description',
    'textarea[aria-label*="Description" i]',
    'div[role="textbox"][aria-label*="Description" i]',
  ],
  bullet_points: [
    'textarea[name="bullet_points"]',
    'textarea[name="bullets"]',
    'input[name="bullet_points"]',
    'textarea[placeholder*="Bullet" i]',
    '#bullet_points',
    'input[data-testid="bullet_points"]',
  ],
  dispatch_time: [
    'select[name="dispatch_time"]',
    'input[name="dispatch_time"]',
    'select[placeholder*="Dispatch" i]',
    'input[data-testid="dispatch_time"]',
    '#dispatch_time',
    'input[aria-label*="Dispatch" i]',
  ],
  return_policy: [
    'select[name="return_policy"]',
    'input[name="return_policy"]',
    'select[placeholder*="Return" i]',
    'input[data-testid="return_policy"]',
    '#return_policy',
    'input[aria-label*="Return" i]',
  ],
  care_instructions: [
    'textarea[name="care_instructions"]',
    'input[name="care_instructions"]',
    'textarea[placeholder*="Care" i]',
    '#care_instructions',
    'input[data-testid="care_instructions"]',
    'input[aria-label*="Care" i]',
  ],
  package_details: [
    'textarea[name="package_details"]',
    'input[name="package_details"]',
    'textarea[placeholder*="Package" i]',
    '#package_details',
    'input[data-testid="package_details"]',
    'input[aria-label*="Package" i]',
  ],
};

// ----- Message types -----

export const MessageTypes = {
  FILL_FORM: 'FILL_FORM',
  FILL_FORM_WITH_PROGRESS: 'FILL_FORM_WITH_PROGRESS',
  EXTRACT_FORM: 'EXTRACT_FORM',
  GET_PROFILES: 'GET_PROFILES',
  SYNC_PROFILES: 'SYNC_PROFILES',
  GET_SETTINGS: 'GET_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS',
  GET_SESSION: 'GET_SESSION',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  HEARTBEAT: 'HEARTBEAT',
  FILL_VARIANT: 'FILL_VARIANT',
} as const;

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];

export type FillStatus = 'filled' | 'skipped' | 'not_found' | 'overwritten';

export interface FillProgress {
  field: keyof ProfileData;
  status: FillStatus;
  selector?: string;
  message?: string;
}

export interface FillResult {
  total: number;
  filled: number;
  skipped: number;
  notFound: number;
  overwritten: number;
  progress: FillProgress[];
}

// ----- Message payloads -----

export interface FillFormMessage {
  type: typeof MessageTypes.FILL_FORM;
  profileData: ProfileData;
  askBeforeOverwrite?: boolean;
}

export interface FillFormWithProgressMessage {
  type: typeof MessageTypes.FILL_FORM_WITH_PROGRESS;
  profileData: ProfileData;
  askBeforeOverwrite?: boolean;
}

export interface FillVariantMessage {
  type: typeof MessageTypes.FILL_VARIANT;
  profileData: ProfileData;
  variantData: Record<string, unknown>;
  askBeforeOverwrite?: boolean;
}

export interface ExtractFormMessage {
  type: typeof MessageTypes.EXTRACT_FORM;
}

export interface GetProfilesMessage {
  type: typeof MessageTypes.GET_PROFILES;
}

export interface SyncProfilesMessage {
  type: typeof MessageTypes.SYNC_PROFILES;
}

export interface GetSettingsMessage {
  type: typeof MessageTypes.GET_SETTINGS;
}

export interface SaveSettingsMessage {
  type: typeof MessageTypes.SAVE_SETTINGS;
  settings: ExtensionSettings;
}

export interface GetSessionMessage {
  type: typeof MessageTypes.GET_SESSION;
}

export interface LoginMessage {
  type: typeof MessageTypes.LOGIN;
  email: string;
  password: string;
}

export interface LogoutMessage {
  type: typeof MessageTypes.LOGOUT;
}

export interface HeartbeatMessage {
  type: typeof MessageTypes.HEARTBEAT;
}

export type ExtensionMessage =
  | FillFormMessage
  | FillFormWithProgressMessage
  | FillVariantMessage
  | ExtractFormMessage
  | GetProfilesMessage
  | SyncProfilesMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | GetSessionMessage
  | LoginMessage
  | LogoutMessage
  | HeartbeatMessage;

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
