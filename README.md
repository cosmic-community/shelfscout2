# ShelfScout

![ShelfScout Banner](https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=300&fit=crop&auto=format)

ShelfScout transforms your bookshelf into personalized reading recommendations. Upload a photo or paste book titles, and let Cosmic AI recommend your next three perfect reads with one-click Amazon links.

## ✨ Features

- **📸 Smart Photo Analysis**: Upload bookshelf photos for automatic book detection using Cosmic AI vision OCR
- **✍️ Manual Entry Fallback**: Type book titles directly if you don't have a photo handy
- **🤖 AI-Powered Recommendations**: Get three carefully selected book recommendations based on your reading preferences
- **🔄 Alternate Suggestions**: Swap any recommendation for a different option instantly
- **🛒 One-Click Amazon Links**: Direct affiliate links to purchase recommended books
- **🔒 Privacy-First**: Images automatically deleted after 24 hours, no personal data stored
- **📱 Mobile Optimized**: Responsive design with camera capture, drag-drop, and touch controls
- **⚡ Real-Time Processing**: Watch the AI agent work through visual progress indicators
- **📊 Analytics Tracking**: Monitor click-through rates and recommendation effectiveness
- **♿ Fully Accessible**: WCAG compliant with keyboard navigation and screen reader support

## Clone this Project

## Clone this Project

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Project](https://img.shields.io/badge/Clone%20this%20Project-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmicjs.com/projects/new?clone_bucket=68ee7ee89c329a49d870ee0d&clone_repository=68ee804f9c329a49d870ee1d)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> Project Name: ShelfScout
> 
> Goal:
> Launch a polished web app where users upload a photo of their bookshelf or paste a few titles. The Cosmic AI Agent extracts owned books, normalizes metadata, infers reading preferences, and returns three new book recommendations with short reasons. Each pick links to Amazon with the configured Associates tag. Mobile first. Fast. Delightful.
> 
> Primary Principle:
> Cosmic AI is the agent. All AI steps run through a single Cosmic AI Agent with tool access. The web app only coordinates user input, displays results, and stores structured content in Cosmic.

### Code Generation Prompt

> Based on the content model I created for the ShelfScout project, now build a complete web application that showcases this content. Include a modern, responsive design with proper navigation, content display, and user-friendly interface.

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## 🛠️ Technologies

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **CMS**: Cosmic
- **AI**: Cosmic AI Agent for vision OCR, metadata normalization, and recommendations
- **Language**: TypeScript
- **Image Processing**: imgix via Cosmic
- **Runtime**: Bun
- **Deployment**: Vercel-ready

## 🚀 Getting Started

### Prerequisites

- Bun installed on your system
- A Cosmic account with bucket credentials
- Amazon Associates account for affiliate links

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd shelfscout
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
COSMIC_BUCKET_SLUG=your-bucket-slug
COSMIC_READ_KEY=your-read-key
COSMIC_WRITE_KEY=your-write-key
AMAZON_ASSOCIATES_TAG=yourtaghere-20
IMAGE_MAX_MB=8
RATE_LIMIT_IP=60
SALT_SECRET=your-secret-salt-for-ip-hashing
```

4. **Configure your Settings object in Cosmic**

In your Cosmic dashboard, update the Settings singleton with:
- Amazon Associates tag
- Hero title and subtitle
- Sample book titles
- Privacy policy content
- About page content

5. **Run the development server**
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 📖 Cosmic SDK Examples

### Fetching Settings

```typescript
import { cosmic } from '@/lib/cosmic'

export async function getSettings() {
  try {
    const response = await cosmic.objects.findOne({
      type: 'settings',
      slug: 'shelfscout-settings'
    })
    return response.object as Settings
  } catch (error) {
    throw new Error('Failed to fetch settings')
  }
}
```

### Creating an Upload

```typescript
export async function createUpload(data: {
  ipHash: string
  sourceImage?: string
}) {
  const response = await cosmic.objects.insertOne({
    type: 'uploads',
    title: `Upload ${Date.now()}`,
    metadata: {
      status: 'pending',
      source_image: data.sourceImage || '',
      ip_hash: data.ipHash,
      parsed_titles: [],
      owned_books: [],
      notes: ''
    }
  })
  return response.object
}
```

### Updating Upload Status

```typescript
export async function updateUploadStatus(
  uploadId: string,
  status: 'pending' | 'analyzed' | 'failed',
  parsedTitles: any[],
  ownedBooks: any[]
) {
  await cosmic.objects.updateOne(uploadId, {
    metadata: {
      status,
      parsed_titles: parsedTitles,
      owned_books: ownedBooks
    }
  })
}
```

### Creating a Recommendation

```typescript
export async function createRecommendation(
  uploadId: string,
  picks: BookPick[]
) {
  const response = await cosmic.objects.insertOne({
    type: 'recommendations',
    title: `Recommendations ${Date.now()}`,
    metadata: {
      upload: uploadId,
      picks
    }
  })
  return response.object
}
```

### Recording a Click

```typescript
export async function recordClick(
  recId: string,
  slotIndex: number,
  url: string,
  userAgent: string
) {
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
```

## 🎨 Cosmic CMS Integration

ShelfScout uses four content models in Cosmic:

### 1. Settings (Singleton)
- **site_name**: Application name
- **amazon_tag**: Amazon Associates tracking ID
- **hero_title**: Homepage headline
- **hero_subtitle**: Homepage description
- **sample_titles**: Example book titles for users
- **legal_privacy**: Privacy policy HTML
- **about_body**: About page HTML

### 2. Uploads
- **status**: Processing state (pending, analyzed, failed)
- **source_image**: Original bookshelf photo (auto-deleted after 24h)
- **parsed_titles**: Raw OCR results with confidence scores
- **owned_books**: Normalized book metadata from APIs
- **notes**: Internal processing notes
- **ip_hash**: Salted hash for rate limiting

### 3. Recommendations
- **upload**: Reference to source upload object
- **picks**: Array of 3 book recommendations with:
  - title, author, reason (≤25 words)
  - isbn13, genres
  - amazon_url
  - alt: alternate pick with same structure

### 4. Clicks
- **rec_id**: Reference to recommendation object
- **slot_index**: Which pick was clicked (0-2)
- **url**: Amazon affiliate link
- **user_agent**: Browser info
- **ts**: Click timestamp

## 🚀 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Import to Vercel**
   - Connect your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure environment variables**
   
   Add these in the Vercel dashboard:
   ```
   COSMIC_BUCKET_SLUG
   COSMIC_READ_KEY
   COSMIC_WRITE_KEY
   AMAZON_ASSOCIATES_TAG
   IMAGE_MAX_MB
   RATE_LIMIT_IP
   SALT_SECRET
   ```

4. **Deploy**
   - Vercel will build and deploy automatically
   - Your app will be live at `https://your-project.vercel.app`

### Environment Variables

- `COSMIC_BUCKET_SLUG`: Your Cosmic bucket slug
- `COSMIC_READ_KEY`: Cosmic read API key
- `COSMIC_WRITE_KEY`: Cosmic write API key
- `AMAZON_ASSOCIATES_TAG`: Your Amazon affiliate ID
- `IMAGE_MAX_MB`: Max upload size (default: 8)
- `RATE_LIMIT_IP`: API calls per hour per IP (default: 60)
- `SALT_SECRET`: Secret for IP hashing (generate a secure random string)

## 📱 Usage

1. **Homepage**: Upload a bookshelf photo or click "Type titles instead" to enter books manually
2. **Analysis**: The Cosmic AI agent processes your input, extracting titles and analyzing preferences
3. **Results**: View three personalized book recommendations with reasons
4. **Swap**: Click "Swap" on any recommendation to get an alternate suggestion
5. **Purchase**: Click "Buy on Amazon" to purchase through your affiliate link
6. **Share**: Use the share button to send recommendations to friends

## 🔒 Privacy & Data

- Bookshelf photos are automatically deleted after 24 hours
- Only salted IP hashes stored for rate limiting (no raw IPs)
- No personal information collected or stored
- Click analytics track only recommendation performance
- "Delete my data" link available on results page

## 📄 License

Built with Cosmic CMS. All rights reserved.

<!-- README_END -->