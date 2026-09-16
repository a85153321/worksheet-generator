import {
  clearGeminiApiKey,
  hasGeminiApiKey,
  saveGeminiApiKey,
} from '../infrastructure'

export function saveApiKey(apiKey: string): void {
  saveGeminiApiKey(apiKey)
}

export function clearApiKey(): void {
  clearGeminiApiKey()
}

export function isApiKeyConfigured(): boolean {
  return hasGeminiApiKey()
}
