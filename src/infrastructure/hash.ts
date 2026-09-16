export type HashInput = Blob | ArrayBuffer | ArrayBufferView | string

export async function calculateInputHash(input: HashInput): Promise<string> {
  let bytes: Uint8Array<ArrayBuffer>

  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input)
  } else if (input instanceof Blob) {
    bytes = new Uint8Array(await input.arrayBuffer())
  } else if (ArrayBuffer.isView(input)) {
    bytes = new Uint8Array(input.byteLength)
    bytes.set(new Uint8Array(input.buffer, input.byteOffset, input.byteLength))
  } else {
    bytes = new Uint8Array(input)
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
