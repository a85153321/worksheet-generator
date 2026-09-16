import { z } from 'zod'

export const supportedImageMimeTypeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const cropRectSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
})

export const imageProcessingOptionsSchema = z.object({
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).default(0),
  crop: cropRectSchema.optional(),
  maxWidth: z.number().int().positive().default(2000),
  maxHeight: z.number().int().positive().default(2000),
  outputMimeType: supportedImageMimeTypeSchema.default('image/jpeg'),
  quality: z.number().min(0.1).max(1).default(0.82),
})

export const processedImageSchema = z.object({
  blob: z.instanceof(Blob),
  fileName: z.string().min(1),
  mimeType: supportedImageMimeTypeSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  originalWidth: z.number().int().positive(),
  originalHeight: z.number().int().positive(),
})

export const pdfPageInfoSchema = z.object({
  pageNumber: z.number().int().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number(),
})

export const pdfDocumentInfoSchema = z.object({
  fileName: z.string().min(1),
  pageCount: z.number().int().positive(),
  pages: z.array(pdfPageInfoSchema),
})

export const processedPdfPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  image: processedImageSchema,
})

export const processedPdfSelectionSchema = z.object({
  fileName: z.string().min(1),
  pages: z.array(processedPdfPageSchema).min(1),
})

export type SupportedImageMimeType = z.infer<typeof supportedImageMimeTypeSchema>
export type CropRect = z.infer<typeof cropRectSchema>
export type ImageProcessingOptions = z.input<typeof imageProcessingOptionsSchema>
export type NormalizedImageProcessingOptions = z.output<typeof imageProcessingOptionsSchema>
export type ProcessedImage = z.infer<typeof processedImageSchema>
export type PdfPageInfo = z.infer<typeof pdfPageInfoSchema>
export type PdfDocumentInfo = z.infer<typeof pdfDocumentInfoSchema>
export type ProcessedPdfPage = z.infer<typeof processedPdfPageSchema>
export type ProcessedPdfSelection = z.infer<typeof processedPdfSelectionSchema>
