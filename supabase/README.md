# Supabase Setup

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **API keys** from Settings > API

## 2. Run the Schema

Open **Supabase SQL Editor** (Database > SQL Editor) and run the contents of `schema.sql` in full.

This creates:
- `profiles` — extends Clerk users (stores Stripe info, plan type)
- `protocols` — user's 90-day protocol (phase, status, genetic data)
- `protocol_phases` — phase-specific training and nutrition plans
- `coaching_sessions` — AI chat history
- `user_tasks` — checklist items

## 3. Get Your API Keys

From **Settings > API**, copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 4. Add to Vercel

Add these env vars in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 5. Profile Creation Flow

Profiles are created when a user completes Stripe checkout. The Stripe webhook (`/api/stripe/webhook`) creates the profile automatically on `checkout.session.completed`.

For development, you can manually create a profile:
```sql
INSERT INTO profiles (id, email, plan)
VALUES ('your-clerk-user-id', 'test@example.com', 'protocol');
```
