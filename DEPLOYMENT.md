# Deployment

## Vercel

GitHub repository: `https://github.com/audxor37/MoIja`

Project settings:

- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave empty

Environment variables for Production, Preview, and Development:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nawamujopepbpewmjdvl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9tnK4nh8HRVFEqzFD4AlZA_DzdSHdO_
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_9tnK4nh8HRVFEqzFD4AlZA_DzdSHdO_
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

After the first deployment, replace `NEXT_PUBLIC_SITE_URL` with the real
production domain.

## Auth Redirects

Add these URLs in Supabase Auth and the Kakao developer console:

- Site URL: `https://your-vercel-domain.vercel.app`
- Redirect URL: `https://your-vercel-domain.vercel.app/auth/callback`

## CLI

```bash
npx vercel login
npx vercel link
npx vercel --prod
```
