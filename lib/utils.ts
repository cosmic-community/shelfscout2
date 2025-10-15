import crypto from 'crypto'

// Format file size from bytes to human-readable string
export function formatFileSize(bytes: number): string {
  const sizeInMB = bytes / (1024 * 1024)
  return `${sizeInMB.toFixed(1)} MB`
}

// Detect device type from user agent
export function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  // Check for mobile devices
  if (ua.includes('mobile') || ua.includes('android')) {
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    }
    return 'mobile'
  }
  
  // Check for tablets
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  }
  
  // Default to desktop
  return 'desktop'
}

// Hash IP address with salt for privacy
export function hashIp(ip: string, salt: string): string {
  return crypto.createHash('sha256').update(ip + salt).digest('hex')
}

// Validate image file type
export function isValidImageType(mimeType: string): boolean {
  return mimeType === 'image/jpeg' || mimeType === 'image/png'
}

// Convert megabytes to bytes
export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024
}

// Build Amazon affiliate link
export function buildAmazonLink(title: string, author: string, amazonTag: string): string {
  const query = encodeURIComponent(`${title} ${author}`)
  return `https://www.amazon.com/s?k=${query}&tag=${amazonTag}`
}