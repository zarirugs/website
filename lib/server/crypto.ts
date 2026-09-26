const encoder = new TextEncoder();

type SubtleWithTimingSafeEqual = SubtleCrypto & {
  timingSafeEqual?: (a: ArrayBuffer | ArrayBufferView, b: ArrayBuffer | ArrayBufferView) => boolean;
};

export function stringToBytes(value: string) {
  return encoder.encode(value);
}

export function bytesToBase64(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function bytesToBase64Url(value: Uint8Array) {
  return bytesToBase64(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", stringToBytes(value));
  return bytesToBase64(new Uint8Array(digest));
}

/** Uses the Worker runtime's constant-time comparison when available. */
export function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  const subtle = crypto.subtle as SubtleWithTimingSafeEqual;
  if (subtle.timingSafeEqual) {
    if (left.byteLength !== right.byteLength) {
      subtle.timingSafeEqual(left, left);
      return false;
    }
    return subtle.timingSafeEqual(left, right);
  }

  // Local Next.js development does not expose Cloudflare's extension. Keep the
  // comparison constant-work for this fallback without using string equality.
  const longest = Math.max(left.byteLength, right.byteLength);
  let difference = left.byteLength ^ right.byteLength;
  for (let index = 0; index < longest; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}
