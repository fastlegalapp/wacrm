# WhatsApp CRM Setup Guide

## Quick Start

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your project URL and keys
3. Go to **SQL Editor** and run the SQL from `supabase-schema.sql`
4. Enable Row Level Security (RLS) policies

### 3. WhatsApp Business API Setup

1. Create a Meta app at [developers.facebook.com](https://developers.facebook.com)
2. Add WhatsApp Business API to your app
3. Get your credentials:
   - App ID
   - Access Token
   - Phone Number ID
   - Business Account ID

### 4. Run the Application

```bash
npm install
npm run dev
```

### 5. Configure WhatsApp Credentials

1. Open [http://localhost:3000](http://localhost:3000)
2. Sign up for a new account
3. Go to Settings and add your WhatsApp API credentials
4. Test the connection

### 6. Webhook Setup (Production)

1. Deploy your app to Vercel/Netlify
2. Set webhook URL to: `https://your-domain.com/api/webhook`
3. Use your `WEBHOOK_VERIFY_TOKEN` for verification
4. Subscribe to `messages` and `message_deliveries` events

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## Features Overview

- ✅ Multi-user authentication
- ✅ WhatsApp Business API integration
- ✅ Lead management system
- ✅ Live chat interface
- ✅ Analytics dashboard
- ✅ Bulk messaging campaigns
- ✅ Per-user API credentials
- ✅ Modern responsive UI

## Support

For issues and questions, please check the main README.md file or create an issue in the repository.
