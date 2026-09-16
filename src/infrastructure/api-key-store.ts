const API_KEY_STORAGE_KEY = 'worksheet-generator.gemini-api-key'
const LEGACY_API_KEY_STORAGE_KEY = 'ws_gemini_api_key'

export function saveGeminiApiKey(apiKey: string): void {
  const normalized = apiKey.trim()
  if (!normalized) throw new Error('API Key 不可為空')
  localStorage.setItem(API_KEY_STORAGE_KEY, normalized)
  localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY)
}

export function getGeminiApiKey(): string | null {
  const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
  if (stored) return stored

  const legacy = localStorage.getItem(LEGACY_API_KEY_STORAGE_KEY)?.trim()
  if (!legacy) return null
  localStorage.setItem(API_KEY_STORAGE_KEY, legacy)
  localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY)
  return legacy
}

export function clearGeminiApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY)
  localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY)
}

export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey() !== null
}
