import type { AnalysisResult } from '../domain'

const DATABASE_NAME = 'worksheet-generator'
const DATABASE_VERSION = 1
const ANALYSIS_STORE = 'analysis-results'
const IMAGE_STORE = 'images'

export interface CachedImage {
  key: string
  data: Blob
  mimeType: string
  createdAt: string
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(ANALYSIS_STORE)) {
        database.createObjectStore(ANALYSIS_STORE)
      }
      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase()
  try {
    return await requestResult(operation(database.transaction(storeName, mode).objectStore(storeName)))
  } finally {
    database.close()
  }
}

export async function getAnalysisCache(hash: string): Promise<AnalysisResult | null> {
  const value = await withStore<AnalysisResult | undefined>(
    ANALYSIS_STORE,
    'readonly',
    (store) => store.get(hash),
  )
  return value ?? null
}

export async function putAnalysisCache(hash: string, analysis: AnalysisResult): Promise<void> {
  await withStore(ANALYSIS_STORE, 'readwrite', (store) => store.put(analysis, hash))
}

export async function deleteAnalysisCache(hash: string): Promise<void> {
  await withStore(ANALYSIS_STORE, 'readwrite', (store) => store.delete(hash))
}

export async function clearAnalysisCache(): Promise<void> {
  await withStore(ANALYSIS_STORE, 'readwrite', (store) => store.clear())
}

export async function getImageCache(key: string): Promise<CachedImage | null> {
  const value = await withStore<CachedImage | undefined>(IMAGE_STORE, 'readonly', (store) =>
    store.get(key),
  )
  return value ?? null
}

export async function putImageCache(image: CachedImage): Promise<void> {
  await withStore(IMAGE_STORE, 'readwrite', (store) => store.put(image, image.key))
}

export async function deleteImageCache(key: string): Promise<void> {
  await withStore(IMAGE_STORE, 'readwrite', (store) => store.delete(key))
}

export async function clearImageCache(): Promise<void> {
  await withStore(IMAGE_STORE, 'readwrite', (store) => store.clear())
}
