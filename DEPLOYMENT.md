# Deployment

## Vercel

GitHub repository: `https://github.com/audxor37/MoIja`

Project settings:

- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave empty

Environment variables for Production:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nawamujopepbpewmjdvl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9tnK4nh8HRVFEqzFD4AlZA_DzdSHdO_
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_9tnK4nh8HRVFEqzFD4AlZA_DzdSHdO_
NEXT_PUBLIC_SITE_URL=https://mo-ija.vercel.app
```

`NEXT_PUBLIC_SITE_URL` must be a public MoIja service URL that users can open
without Vercel authentication. Do not set it to a Vercel preview deployment or
leave it as `https://your-vercel-domain.vercel.app`.

For local development, keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
For Vercel preview deployments, omit `NEXT_PUBLIC_SITE_URL` unless that preview
is intentionally public and allowed in Supabase redirect settings.

## Auth Redirects

Add these URLs in Supabase Auth and the Kakao developer console:

- Site URL: `https://mo-ija.vercel.app`
- Redirect URL: `https://mo-ija.vercel.app/auth/callback`

If users see a Vercel login screen during Kakao login, check that the redirect
URL points to the public production domain and that Vercel Deployment Protection
is not enabled for the URL users are sent to.

## CLI

```bash
npx vercel login
npx vercel link
npx vercel --prod
```
