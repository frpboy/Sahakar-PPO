# Vercel Deployment for Sahakar PPO

## Project Configuration
- **Project Name**: `sahakar-ppo`
- **Framework**: Next.js
- **Build Output**: `.next`

## Environment Variables Required

Add these environment variables in your Vercel project settings:

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### API Configuration
```
NEXT_PUBLIC_API_URL=https://your-api-url.com
```

## Deployment Commands

### Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

### Link Project
```bash
cd d:\K4NN4N\Sahakar-PPO
vercel link
```

### Deploy to Production
```bash
vercel --prod
```

### Deploy to Preview
```bash
vercel
```

## Build Configuration
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Notes
- The project uses a monorepo structure with `apps/web` containing the Next.js frontend
- Ensure all Firebase environment variables are properly configured in Vercel dashboard
- API URL should point to your deployed NestJS backend (e.g., Cloud Run)
