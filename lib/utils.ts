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