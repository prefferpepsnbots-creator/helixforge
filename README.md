# HelixForge Wellness

AI-powered, DNA-driven 90-day peptide optimization protocols. Users upload their genetic data, receive a personalized protocol, and get ongoing AI coaching — all while their licensed physician remains the prescribing authority.

> **We never sell, compound, or prescribe peptides.** Education, genetic blueprints, training/nutrition plans, and AI coaching only.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS v4 + shadcn/ui |
| Auth | Clerk 7.x |
| Database | Supabase (Postgres + Storage + Service Role) |
| Payments | Stripe ($297 protocol + $97/mo coaching) |
| AI | OpenAI GPT-4o-mini (streaming) |
| DNA | Sequencing.com Signal Kit API (270K+ gene-peptide-pathway connections) |
| Email | Resend |
| Hosting | Vercel |

## Routes

```
/                          Landing page (conversion-focused)
/checkout                  Stripe Checkout flow
/sign-in, /sign-up         Clerk auth pages
/dashboard                 Overview + protocol summary
/dashboard/protocol        90-day phase display + task checklist
/dashboard/dna             DNA file upload + Signal Kit analysis
/dashboard/training        Exercise library by protocol phase
/dashboard/nutrition       Macro targets + meal suggestions
/dashboard/coaching        AI coaching chat (OpenAI streaming)
/dashboard/settings        Profile + plan management
/dashboard/admin           Platform metrics (admin-only)
/api/stripe/webhook        Payment fulfillment + onboarding trigger
/api/coaching/chat         AI coaching endpoint
/api/signal-kit/analyze    DNA analysis (Sequencing.com RTP path)
/api/dna/upload            DNA file upload to Supabase Storage
/api/admin/metrics         Aggregated platform metrics
```

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/prefferpepsnbots-creator/helixforge.git
cd helixforge
pnpm install
```

### 2. Copy env vars

```bash
cp .env.example .env.local
```

Fill in all variables (see [.env.example](./.env.example) for full documentation with sources).

### 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema migrations in `supabase/migrations/`
3. Enable **Row Level Security (RLS)** on all tables
4. Create a `dna-files` storage bucket (private, no public access)
5. Add your service role key to `SUPABASE_SERVICE_ROLE_KEY`

### 4. Clerk setup

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy publishable key + secret key
3. Set redirect URLs: `/sign-in`, `/sign-up`, `/dashboard`
4. Copy user IDs of admin users to `ADMIN_USER_IDS` (comma-separated)

### 5. Stripe setup

1. Create products: "Protocol" ($297 one-time) + "Coaching" ($97/mo subscription)
2. Copy Price IDs to `STRIPE_PRICE_PROTOCOL` + `STRIPE_PRICE_COACHING`
3. Set `STRIPE_WEBHOOK_SECRET` from `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### 6. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## DNA File Support

The parser handles these formats natively:

| Provider | Format | Extension |
|---|---|---|
| 23andMe | rsID per line | `.txt` |
| AncestryDNA | rsID + chromosome | `.txt` |
| FTDNA | CSV export | `.csv` |
| Nebula Genomics | CSV | `.csv` |
| MyHeritage | ZIP (contains txt) | `.zip` |

Max file size: **100 MB**. Files are stored in Supabase Storage under the user's ID with a 48-hour auto-expiry signed URL.

## Security Notes

- Clerk JWT is verified server-side on every protected API call
- Supabase reads use Clerk-user-scoped queries; writes use service role (never expose service role to client)
- DNA files are private, stored under authenticated user prefixes with RLS
- Stripe webhook signature is verified before processing any events
- Admin routes are gated by `ADMIN_USER_IDS` allowlist (Clerk user IDs)
- Health/physician disclaimer is surfaced on every AI coaching response

## Deploy

See [CLAUDE.md](./CLAUDE.md) for the full Vercel deploy checklist.

## License

Proprietary — HelixForge Wellness Inc.
