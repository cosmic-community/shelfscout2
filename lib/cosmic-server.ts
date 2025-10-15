import { cosmic } from './cosmic'
import {
  Settings,
  Upload,
  Recommendation,
  BookPick,
  hasStatus,
  UploadStatus,
  ParsedTitle,
  OwnedBook,
} from '@/types'

// Fetch settings singleton
export async function getSettings(): Promise<Settings> {
  try {
    const response = await cosmic.objects.findOne({
      type: 'settings',
      slug: 'shelfscout-settings'
    })
    return response.object as Settings
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      throw new Error('Settings not configured')
    }
    throw new Error('Failed to fetch settings')
  }
}

// Create a new upload
export async function createUpload(data: {
  ipHash: string
  uploadSource?: string
  sourceImageId?: string
  sourceImageUrl?: string
}): Promise<Upload> {
  console.log('Creating upload with data:', {
    ipHash: data.ipHash,
    uploadSource: data.uploadSource,
    hasSourceImage: !!(data.sourceImageId && data.sourceImageUrl),
    sourceImageId: data.sourceImageId
  })

  const metadata: any = {
    status: 'pending',
    ip_hash: data.ipHash,
    parsed_titles: [],
    owned_books: [],
    notes: ''
  }

  // Add upload source if provided
  if (data.uploadSource) {
    metadata.upload_source = data.uploadSource
  }

  // Add source_image as a proper reference if provided
  if (data.sourceImageId && data.sourceImageUrl) {
    metadata.source_image = {
      id: data.sourceImageId,
      url: data.sourceImageUrl,
      imgix_url: data.sourceImageUrl
    }
  }

  console.log('Creating upload object with metadata:', JSON.stringify(metadata, null, 2))

  const response = await cosmic.objects.insertOne({
    type: 'uploads',
    title: `Upload ${Date.now()}`,
    metadata
  })
  
  console.log('Upload object created:', response.object.id)
  return response.object as Upload
}

// Get upload by ID
export async function getUpload(uploadId: string): Promise<Upload | null> {
  try {
    const response = await cosmic.objects.findOne({
      type: 'uploads',
      id: uploadId
    }).depth(0)
    return response.object as Upload
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null
    }
    throw error
  }
}

// Update upload status and data
export async function updateUpload(
  uploadId: string,
  data: {
    status?: UploadStatus
    parsed_titles?: ParsedTitle[]
    owned_books?: OwnedBook[]
    notes?: string
  }
): Promise<void> {
  await cosmic.objects.updateOne(uploadId, {
    metadata: data
  })
}

// Create a recommendation
export async function createRecommendation(
  uploadId: string,
  picks: BookPick[]
): Promise<Recommendation> {
  const response = await cosmic.objects.insertOne({
    type: 'recommendations',
    title: `Recommendations ${Date.now()}`,
    metadata: {
      upload: uploadId,
      picks
    }
  })
  return response.object as Recommendation
}

// Get recommendation by ID
export async function getRecommendation(
  recId: string
): Promise<Recommendation | null> {
  try {
    const response = await cosmic.objects.findOne({
      type: 'recommendations',
      id: recId
    }).depth(1)
    return response.object as Recommendation
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null
    }
    throw error
  }
}

// Update recommendation picks
export async function updateRecommendationPicks(
  recId: string,
  picks: BookPick[]
): Promise<void> {
  await cosmic.objects.updateOne(recId, {
    metadata: {
      picks
    }
  })
}

// Record a click
export async function recordClick(
  recId: string,
  slotIndex: number,
  url: string,
  userAgent: string
): Promise<void> {
  await cosmic.objects.insertOne({
    type: 'clicks',
    title: `Click ${Date.now()}`,
    metadata: {
      rec_id: recId,
      slot_index: slotIndex,
      url,
      user_agent: userAgent,
      ts: new Date().toISOString()
    }
  })
}

// Delete upload and associated data
export async function deleteUpload(uploadId: string): Promise<void> {
  await cosmic.objects.deleteOne(uploadId)
}