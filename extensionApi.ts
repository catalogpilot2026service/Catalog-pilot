import { supabase, API_URL } from './supabase'

export interface ProfileData {
  brand?: string
  hsn_code?: string
  gst_percent?: string
  manufacturer_details?: string
  packer_details?: string
  importer_details?: string
  country_of_origin?: string
  material?: string
  description?: string
  bullet_points?: string[]
  dispatch_time?: string
  return_policy?: string
  care_instructions?: string
  package_details?: string
}

export interface ListingProfile {
  id: string
  name: string
  profile_data: ProfileData
  folder: string
  is_favorite: boolean
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface CatalogVariant {
  id: string
  user_id: string
  profile_id: string | null
  profile_name: string
  color: string
  size: string
  selling_price: number
  mrp: number
  stock_quantity: number
  images: string[]
  variant_data: Record<string, unknown>
  status: 'draft' | 'ready' | 'published' | 'archived'
  platform_type: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  action: string
  status: string
  message: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ExtensionDevice {
  id: string
  device_id: string
  device_name: string
  browser: string
  platform: string
  extension_version: string
  platform_type: string
  is_active: boolean
  last_seen_at: string
  created_at: string
}

export interface ExtensionStatus {
  connected: boolean
  user: { id: string; email: string }
  platform_type: string
  devices: ExtensionDevice[]
  sync: { last_sync_at: string | null; sync_token: number; error_count: number; sync_error: string | null }
  profile_count: number
  variant_count: number
  draft_count: number
}

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Not authenticated')
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}`, ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// Profiles
export const getProfiles = () => apiCall<{ profiles: ListingProfile[] }>('/profiles')
export const saveProfile = (name: string, profileData: ProfileData, folder = 'Uncategorized') =>
  apiCall('/profiles', { method: 'POST', body: JSON.stringify({ name, profile_data: profileData, folder }) })
export const updateProfileApi = (id: string, updates: Record<string, unknown>) =>
  apiCall(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
export const deleteProfileApi = (id: string) => apiCall(`/profiles/${id}`, { method: 'DELETE' })
export const toggleFavorite = (id: string) => apiCall(`/profiles/${id}/favorite`, { method: 'PUT' })

// Variants
export const getVariants = (status?: string, profileId?: string) => {
  let path = '/variants'
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (profileId) params.set('profile_id', profileId)
  const qs = params.toString()
  if (qs) path += `?${qs}`
  return apiCall<{ variants: CatalogVariant[] }>(path)
}
export const createVariant = (data: Partial<CatalogVariant>) =>
  apiCall('/variants', { method: 'POST', body: JSON.stringify(data) })
export const bulkCreateVariants = (variants: Partial<CatalogVariant>[]) =>
  apiCall('/variants', { method: 'POST', body: JSON.stringify({ variants }) })
export const updateVariant = (id: string, updates: Partial<CatalogVariant>) =>
  apiCall(`/variants/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
export const deleteVariant = (id: string) => apiCall(`/variants/${id}`, { method: 'DELETE' })
export const duplicateVariant = (id: string) => apiCall(`/variants/${id}/duplicate`, { method: 'POST' })
export const bulkUpdateVariants = (ids: string[], updates: Record<string, unknown>) =>
  apiCall('/variants/bulk-update', { method: 'POST', body: JSON.stringify({ ids, ...updates }) })

// Status & Logs
export const getExtensionStatus = () => apiCall<ExtensionStatus>('/status')
export const getActivityLogs = (limit = 50) => apiCall<{ logs: ActivityLog[] }>(`/logs?limit=${limit}`)
export const getSyncStatus = () => apiCall('/sync-status')
export const syncAll = () => apiCall('/sync', { method: 'POST' })
