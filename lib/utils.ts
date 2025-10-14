import crypto from 'crypto'

// Hash IP address with salt
export function hashIp(ip: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex')
}

// Build Amazon affiliate link
export function buildAmazonLink(
  title: string,
  author: string,
  associatesTag: string
): string {
  const query = encodeURIComponent(`${title} ${author}`)
  return `https://www.amazon.com/s?k=${query}&tag=${associatesTag}`
}

// Validate image file
export function isValidImageType(contentType: string): boolean {
  return contentType === 'image/jpeg' || contentType === 'image/png'
}

// Convert MB to bytes
export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024
}

// Format date for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}