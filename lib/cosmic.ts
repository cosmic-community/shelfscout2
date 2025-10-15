import { createBucketClient } from '@cosmicjs/sdk'

// Extended type definition for Cosmic SDK with AI agent support
type CosmicClientWithAI = ReturnType<typeof createBucketClient> & {
  ai: {
    agent: (options: {
      messages: Array<{ role: string; content: string }>
      tools?: Array<{ type: string; [key: string]: any }>
      model?: string
    }) => Promise<{
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }>
  }
}

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
}) as CosmicClientWithAI