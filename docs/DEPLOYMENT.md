# Production Deployment & Infrastructure Guide

This guide details the infrastructure, environment variable matrices, database migrations, and deployment procedures for **TrustBreak AI**.

---

## 1. Production Architecture Overview

TrustBreak AI is architected for zero-maintenance serverless scalability on **Vercel** coupled with **Supabase (PostgreSQL 15)**:

* **Frontend:** Vite 6 React single-page application distributed globally across Vercel Edge CDN nodes with HTTP caching.
* **Backend:** Node.js Serverless Functions deployed to edge regions (`/api/analyze`, `/api/analyze-voice`, `/api/blocklist-lite`, `/api/tinyfish/investigate`, `/api/health`, `/api/cron/sync-feeds`).
* **Database:** Supabase managed PostgreSQL 15 with connection pooling, Row-Level Security, and PostgREST upsert APIs.
* **Cron Infrastructure:** Vercel Cron runner executing daily synchronization at `00:00 UTC`.

---

## 2. Environment Variables Matrix

Configure these environment variables in your Vercel Project Dashboard (**Project Settings ➔ Environment Variables**):

| Variable Name | Required? | Exposure Scope | Purpose |
|:---|:---:|:---|:---|
| `VITE_SUPABASE_URL` | **Yes** | Client & Server | Supabase project API gateway endpoint. |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Client & Server | Public anonymous key for RLS-partitioned queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-Only Secret | Administrative secret for threat indicator upsertion & cron feed sync. **Never prefix with `VITE_`.** |
| `GROQ_API_KEY` | **Yes** | Server-Only Secret | Groq LPU inference key (`llama-3.3-70b-versatile` & `whisper-large-v3`). |
| `GEMINI_API_KEY` | **Yes** | Server-Only Secret | Google Gemini 2.5 Flash key for visual OCR and multimodal analysis. |
| `TINYFISH_API_KEY` | No | Server-Only Secret | TinyFish API key for live headless browser web investigation. |
| `OPENAI_API_KEY` | No | Server-Only Secret | Optional fallback LLM key (`gpt-4o-mini`). |
| `CRON_SECRET` | **Yes** | Server-Only Secret | Bearer authentication token protecting `/api/cron/sync-feeds`. |
| `ENABLE_VOICE_SCANNER` | **Yes** | Server-Only Flag | Feature flag activating `/api/analyze-voice` (`true`). |
| `ENABLE_PRE_CLICK_INTERCEPTOR`| **Yes** | Server-Only Flag | Feature flag activating `/api/blocklist-lite` (`true`). |

---

## 3. Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(self), microphone=(self), geolocation=()" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "crons": [
    {
      "path": "/api/cron/sync-feeds",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 4. Pre-Deployment Quality Checklist

Before deploying changes, verify that all local quality gates pass:

```bash
# 1. Run all 51 automated unit and integration tests
npm test

# 2. Check for ESLint errors
npm run lint

# 3. Verify TypeScript types
npm run typecheck

# 4. Verify production build output
npm run build
```

---

## 5. Database Schema Migration

Before triggering the first deployment, apply the PostgreSQL schema in Supabase:

### Method A: Automated CLI Script
```bash
npm run supabase:setup
```

### Method B: Consolidated SQL Editor
Open the **SQL Editor** in the Supabase Dashboard and execute the consolidated migration:
* [`supabase/006-consolidated-audit-repairs.sql`](file:///c:/Users/LENOVO%20USER/Downloads/TrustBreak%20AI/supabase/006-consolidated-audit-repairs.sql)

This idempotently sets up tables (`scans`, `reports`, `public_blocklist`, `threat_indicators`), indexes, and Row-Level Security policies.

---

## 6. Continuous Deployment Workflow

1. Commit changes to the `main` branch:
   ```bash
   git add .
   git commit -m "feat(security): update threat intelligence telemetry"
   git push origin main
   ```
2. Vercel automatically detects the push, initiates the build pipeline:
   * Runs `vite build`
   * Deploys edge serverless functions
   * Registers cron schedules
3. Monitor real-time status in GitHub commit checks or the Vercel Dashboard.
4. Verify live production at [https://trust-break-ai.vercel.app](https://trust-break-ai.vercel.app).
