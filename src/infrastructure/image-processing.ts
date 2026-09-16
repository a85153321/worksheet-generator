import {
  imageProcessingOptionsSchema,
  processedImageSchema,
  supportedImageMimeTypeSchema,
} from '../domain'
import type {
  AppError,
  ImageProcessingOptions,
  NormalizedImageProcessingOptions,
  ProcessedImage,
  Result,
  SupportedImageMimeType,
} from '../domain'

function error(message: string, code: string): Result<never, AppError> {
  return {
    ok: false,
    error: { type: 'validation', message, retryable: false, details: { code } },
  }
}

function outputFileName(fileName: string, mimeType: SupportedImageMimeType): string {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'processed-image'
  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1]
  return `${baseName}.${extension}`
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: SupportedImageMimeType,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality))
}

export function calculateOutputDimensions(
  cropWidth: number,
  cropHeight: number,
  options: Pick<NormalizedImageProcessingOptions, 'rotation' | 'maxWidth' | 'maxHeight'>,
): { width: number; height: number } {
  const rotated = options.rotation === 90 || options.rotation === 270
  const orientedWidth = rotated ? cropHeight : cropWidth
  const orientedHeight = rotated ? cropWidth : cropHeight
  const scale = Math.min(1, options.maxWidth / orientedWidth, options.maxHeight / orientedHeight)
  return {
    width: Math.max(1, Math.round(orientedWidth * scale)),
    height: Math.max(1, Math.round(orientedHeight * scale)),
  }
}

export async function preprocessImage(
  data: Blob,
  fileName: string,
  options: ImageProcessingOptions = {},
): Promise<Result<ProcessedImage, AppError>> {
  const mimeType = supportedImageMimeTypeSchema.safeParse(data.type)
  if (!mimeType.success) {
    return error('不支援此圖片格式，請使用 JPG、PNG 或 WebP。', 'UNSUPPORTED_IMAGE_TYPE')
  }

  const parsedOptions = imageProcessingOptionsSchema.safeParse(options)
  if (!parsedOptions.success) {
    return error('圖片處理選項無效，請檢查裁切、旋轉、尺寸與品質設定。', 'INVALID_IMAGE_OPTIONS')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(data)
  } catch {
    return error('無法讀取圖片，檔案可能已損毀。', 'CORRUPTED_IMAGE')
  }

  try {
    const settings = parsedOptions.data
    const crop = settings.crop ?? {
      x: 0,
      y: 0,
      width: bitmap.width,
      height: bitmap.height,
    }
    if (crop.x + crop.width > bitmap.width || crop.y + crop.height > bitmap.height) {
      return error('裁切範圍超出圖片邊界。', 'CROP_OUT_OF_BOUNDS')
    }

    const dimensions = calculateOutputDimensions(crop.width, crop.height, settings)
    const canvas = document.createElement('canvas')
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    const context = canvas.getContext('2d')
    if (!context) return error('瀏覽器無法建立圖片處理畫布。', 'CANVAS_UNAVAILABLE')

    const rotated = settings.rotation === 90 || settings.rotation === 270
    const drawnWidth = rotated ? dimensions.height : dimensions.width
    const drawnHeight = rotated ? dimensions.width : dimensions.height
    context.translate(dimensions.width / 2, dimensions.height / 2)
    context.rotate((settings.rotation * Math.PI) / 180)
    context.drawImage(
      bitmap,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      -drawnWidth / 2,
      -drawnHeight / 2,
      drawnWidth,
      drawnHeight,
    )

    const output = await canvasToBlob(
      canvas,
      settings.outputMimeType,
      settings.outputMimeType === 'image/png' ? 1 : settings.quality,
    )
    if (!output) return error('瀏覽器無法輸出處理後的圖片。', 'IMAGE_ENCODING_FAILED')

    const result = processedImageSchema.safeParse({
      blob: output,
      fileName: outputFileName(fileName, settings.outputMimeType),
      mimeType: settings.outputMimeType,
      width: dimensions.width,
      height: dimensions.height,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
    })
    return result.success
      ? { ok: true, value: result.data }
      : error('處理後圖片未通過資料驗證。', 'INVALID_PROCESSED_IMAGE')
  } finally {
    bitmap.close()
  }
}
