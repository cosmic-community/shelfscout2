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
- **AI**: Cosmic AI Agent API for vision OCR, metadata normalization, and recommendations
- **Language**: TypeScript
- **Image Processing**: imgix via Cosmic
- **Runtime**: Bun
- **Deployment**: Vercel-ready

## 🚀 Getting Started

### Prerequisites

- Bun installed on your system
- A Cosmic account with bucket credentials
- Cosmic AI Agent API access enabled on your bucket
- Amazon Associates account for affiliate links

### Installation

1. **Clone the repository**