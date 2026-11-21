export type LimitedBodyResult =
  | { tooLarge: true }
  | { tooLarge: false; text: string };

export type LimitedBytesResult =
  | { tooLarge: true }
  | { tooLarge: false; bytes: Uint8Array };

export async function readLimitedBytes(
  request: Request,
  maxBytes: number,
): Promise<LimitedBytesResult> {
  if (!request.body) return { tooLarge: false, bytes: new Uint8Array() };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { tooLarge: true };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { tooLarge: false, bytes: body };
}

export async function readLimitedBody(
  request: Request,
  maxBytes: number,
): Promise<LimitedBodyResult> {
  const result = await readLimitedBytes(request, maxBytes);
  return result.tooLarge
    ? result
    : { tooLarge: false, text: new TextDecoder().decode(result.bytes) };
}
