import { describe, expect, it } from 'vitest'
import { calculateOutputDimensions } from '../src/infrastructure/image-processing'
import {
  inspectUploadedPdf,
  processSelectedPdfPages,
  processUploadedImage,
} from '../src/services'

describe('image preprocessing', () => {
  it('calculates rotated and bounded output dimensions', () => {
    expect(
      calculateOutputDimensions(2400, 1200, {
        rotation: 90,
        maxWidth: 600,
        maxHeight: 900,
      }),
    ).toEqual({ width: 450, height: 900 })
  })

  it('returns an explicit error for unsupported image formats', async () => {
    const result = await processUploadedImage({
      file: new Blob(['gif'], { type: 'image/gif' }),
      fileName: 'material.gif',
    })

    expect(result).toMatchObject({
      ok: false,
      error: { type: 'validation', details: { code: 'UNSUPPORTED_IMAGE_TYPE' } },
    })
  })
})

describe('PDF selection', () => {
  it('returns an explicit error for unsupported document formats', async () => {
    const result = await inspectUploadedPdf({
      file: new Blob(['text'], { type: 'text/plain' }),
      fileName: 'material.txt',
    })

    expect(result).toMatchObject({
      ok: false,
      error: { type: 'validation', details: { code: 'UNSUPPORTED_PDF_TYPE' } },
    })
  })

  it('identifies a damaged PDF before page parsing', async () => {
    const result = await inspectUploadedPdf({
      file: new Blob(['not a pdf'], { type: 'application/pdf' }),
      fileName: 'damaged.pdf',
    })

    expect(result).toMatchObject({
      ok: false,
      error: { type: 'validation', details: { code: 'CORRUPTED_PDF' } },
    })
  })

  it('requires at least one selected page', async () => {
    const result = await processSelectedPdfPages({
      file: new Blob(['%PDF-'], { type: 'application/pdf' }),
      fileName: 'material.pdf',
      selectedPages: [],
    })

    expect(result).toMatchObject({
      ok: false,
      error: { type: 'validation', details: { code: 'NO_PDF_PAGES_SELECTED' } },
    })
  })
})
