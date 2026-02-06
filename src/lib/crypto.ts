// Simple base64 encoding/decoding for ID obfuscation
// Note: This is NOT secure encryption, just obfuscation for URL readability

export async function encryptId(id: string): Promise<string> {
  // Add a prefix to make it less obvious
  const payload = `id:${id}:${Date.now()}`
  // Base64 encode
  return btoa(payload)
}

export async function decryptId(token: string): Promise<string> {
  try {
    // Decode from URL encoding first
    const decoded = decodeURIComponent(token)
    // Base64 decode
    const payload = atob(decoded)
    // Extract the id from the payload
    const parts = payload.split(':')
    if (parts.length >= 2 && parts[0] === 'id') {
      return parts[1]
    }
    throw new Error('Invalid token format')
  } catch {
    throw new Error('Failed to decrypt token')
  }
}
