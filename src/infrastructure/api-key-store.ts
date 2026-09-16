const API_KEY_STORAGE_KEY = 'worksheet-generator.gemini-api-key'

export function saveGeminiApiKey(apiKey: string): void {
  const normalized = apiKey.trim()
  if (!normalized) throw new Error('API Key 不可為空')
  localStorage.setItem(API_KEY_STORAGE_KEY, normalized)
}

export function getGeminiApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY)
}

export function clearGeminiApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY)
}

export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey() !== null
}
