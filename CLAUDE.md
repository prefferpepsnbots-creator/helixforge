@AGENTS.md

## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel (Next.js native, auto-deploy on push to main)
- Production URL: Not yet deployed (run `vercel link` first to create project)
- Deploy workflow: auto-deploy on push to main via Vercel GitHub integration
- Merge method: squash (Vercel default for Next.js)
- Project type: web app (Next.js 15 App Router)
- Post-deploy health check: GET / (root returns 200 when healthy)

### Custom deploy hooks
- Pre-merge: `npm run build` (already verified passing on main)
- Deploy trigger: automatic on push to main via Vercel
- Deploy status: poll production URL until HTTP 200
- Health check: GET https://{project}.vercel.app returns 200

### First-time setup (do once)
1. `vercel login` — authenticate Vercel CLI (not yet done)
2. `vercel link` — link this repo to a Vercel project
3. `vercel env pull .env.local` — sync env vars from Vercel to local
4. Add env vars in Vercel dashboard (mark as sensitive except NEXT_PUBLIC_ vars):
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   - CLERK_SECRET_KEY
   - NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   - NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   - NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   - NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - STRIPE_PRICE_PROTOCOL (Stripe Price ID for $297 protocol)
   - STRIPE_PRICE_COACHING (Stripe Price ID for $97/mo coaching)
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - SIGNAL_KIT_API_KEY
   - SIGNAL_KIT_API_URL
   - OPENAI_API_KEY
   - NEXT_PUBLIC_APP_URL=https://helixforge.com (your domain)
   - RESEND_API_KEY
   - EMAIL_FROM=noreply@helixforge.com
   - ADMIN_USER_IDS (Clerk user IDs of admins, comma-separated)
5. Push to GitHub and connect repo in Vercel dashboard for auto-deploy
