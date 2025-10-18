# WhatsApp CRM - Lead Management & Bulk Messaging

A comprehensive WhatsApp CRM system built with Next.js and Supabase, designed for lead capture, live chat management, and bulk messaging campaigns.

## Features

- 🔐 **Multi-user Authentication** - Secure user management with Supabase Auth
- 📱 **WhatsApp Business API Integration** - Send and receive messages via WhatsApp
- 👥 **Lead Management** - Capture, track, and manage leads from WhatsApp conversations
- 💬 **Live Chat Interface** - Modern chat UI for managing conversations
- 📊 **Analytics Dashboard** - Track performance metrics and insights
- 📢 **Bulk Campaigns** - Send targeted messages to multiple contacts
- ⚙️ **User Settings** - Per-user WhatsApp API credentials configuration
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI, Lucide React icons
- **WhatsApp Integration**: WhatsApp Business API

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or later)
2. **npm** or **yarn**
3. **Supabase account** - [Create one here](https://supabase.com)
4. **WhatsApp Business API access** - [Meta for Developers](https://developers.facebook.com)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd WaCRM
npm install
```

### 2. Supabase Setup

1. Create a new project in [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **Settings > API** and copy your project URL and anon key
3. Go to **SQL Editor** and run the schema from `supabase-schema.sql`
4. Enable Row Level Security (RLS) policies as defined in the schema

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. WhatsApp Business API Setup

1. **Create a Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com)
   - Create a new app and add WhatsApp Business API
   - Get your App ID, Access Token, Phone Number ID, and Business Account ID

2. **Configure Webhook**:
   - Set webhook URL to: `https://your-domain.com/api/webhook`
   - Use the `WEBHOOK_VERIFY_TOKEN` from your environment variables
   - Subscribe to `messages` and `message_deliveries` events

3. **Add Credentials**:
   - Sign up/login to the CRM
   - Go to Settings and add your WhatsApp API credentials
   - Test the connection

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles (extends Supabase auth.users)
- **whatsapp_credentials** - Per-user WhatsApp API credentials
- **contacts** - Lead/contact information
- **conversations** - Chat conversations
- **messages** - Individual messages
- **campaigns** - Bulk messaging campaigns
- **campaign_messages** - Campaign message tracking
- **webhook_events** - WhatsApp webhook event logs

## API Endpoints

- `POST /api/webhook` - WhatsApp webhook for incoming messages
- `POST /api/send-message` - Send messages via WhatsApp
- `GET /api/webhook` - Webhook verification

## Usage

### 1. User Registration
- Users can sign up with email/password
- Each user gets their own isolated workspace

### 2. WhatsApp Configuration
- Go to Settings and add your WhatsApp Business API credentials
- The system will validate and store your credentials securely

### 3. Lead Management
- Leads are automatically created when someone messages your WhatsApp number
- View and manage leads in the Leads section
- Update lead status, add notes, and track interactions

### 4. Conversations
- View all active conversations
- Send and receive messages in real-time
- Track conversation history and status

### 5. Bulk Campaigns
- Create targeted messaging campaigns
- Select contacts and compose messages
- Schedule and track campaign performance

### 6. Analytics
- View performance metrics
- Track conversion rates
- Monitor response times and engagement

## Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Encrypted Credentials** - WhatsApp API credentials are stored securely
- **Webhook Verification** - Incoming webhooks are verified
- **Authentication Required** - All API endpoints require authentication

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Webhook Configuration

For production deployment:

1. Update your WhatsApp webhook URL to point to your deployed app
2. Ensure your webhook endpoint is accessible via HTTPS
3. Test webhook delivery using WhatsApp's webhook test tool

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the Supabase and WhatsApp Business API documentation

## Roadmap

- [ ] Real-time message updates with WebSockets
- [ ] Advanced message templates
- [ ] File upload and media management
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] API rate limiting and optimization
- [ ] Mobile app (React Native)
- [ ] Integration with other CRM systems

---

Built with ❤️ using Next.js and Supabase