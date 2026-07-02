# Monarch referral app (Vercel)

Staging/production shell for PHI routes on **`app.monarchcompetency.com`**.

**Status:** Route shell only — port `Code/Framer/*.tsx` components here next.

## Local dev

```bash
cd apps/referral-app
npm install
cp .env.example .env.local   # fill VITE_SUPABASE_*
npm run dev
```

Open http://localhost:5173

## Vercel — first import

1. [vercel.com](https://vercel.com) → **Team** (Pro) → **Add New → Project**
2. Import **`Armadallc/monarch`** from GitHub
3. **Root Directory:** `apps/referral-app`
4. Framework: **Vite** (auto-detected)
5. Build: `npm run build` · Output: `dist`
6. **Environment variables** (Preview + Production when ready):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy — you get a `*.vercel.app` preview URL

**Do not enable HIPAA BAA** until production sign-off (`docs/VERCEL_PHI_APP_SETUP.md`).

## Vercel project settings (reference)

| Setting | Value |
|---------|--------|
| Root Directory | `apps/referral-app` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js | 20.x |

## Routes (production target)

| Path | Framer source |
|------|----------------|
| `/login` | `AuthGateway.tsx` |
| `/admin` | `AuthGateway.tsx` |
| `/portal` | `ReferralSourcePortal.tsx` |
| `/dashboard` | `ReferralDashboard.tsx` |
| `/submit-referrals` | `ReferralForm.tsx` |
| `/submit-referrals/documents` | `DocumentUploadForm.tsx` |
| `/r?token=` | `ReferralSharePage.tsx` |

Full checklist: `docs/VERCEL_PHI_APP_SETUP.md`
