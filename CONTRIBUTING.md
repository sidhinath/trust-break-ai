# Contributing to TrustBreak AI

Thank you for your interest in contributing to **TrustBreak AI**! Whether you are participating in a hackathon, submitting bug fixes, adding new detection heuristics, or expanding threat intelligence feeds, we welcome your contributions.

This guide outlines our development workflow, coding standards, and quality gate requirements to ensure TrustBreak AI remains fast, reliable, and secure.

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment. All contributors and participants are expected to adhere to the standard [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Be respectful, collaborative, and constructive.

---

## 2. Getting Started & Local Setup

### 2.1 Prerequisites
- **Node.js:** `v20.x` or higher (LTS recommended)
- **Package Manager:** `npm` (v10+)
- **Git:** Latest stable version
- **Operating System:** Windows, macOS, or Linux

### 2.2 Clone the Repository
```bash
git clone https://github.com/ImperialCoder01/GhostNet.git
cd GhostNet
```

### 2.3 Install Dependencies
```bash
npm install
```

### 2.4 Environment Variables Setup
Copy the provided `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:
```ini
# Supabase Configuration (Required for live threat feeds & telemetry)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Serverless Edge Environment (Required for backend AI inference)
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=AIzaSy_your_gemini_api_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CRON_SECRET=your_cron_secret_token

# Feature Flags
VITE_ENABLE_QR_SCANNER=true
VITE_ENABLE_VOICE_SCANNER=true
VITE_ENABLE_PRE_CLICK_INTERCEPTOR=true
```

> [!NOTE]
> **Guest Demo Mode:** TrustBreak AI includes a zero-friction guest demo mode. If Supabase or AI keys are omitted locally, the app gracefully defaults to the built-in deterministic heuristic engine.

### 2.5 Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 3. Architecture & Core Invariants

Before modifying code, understand these non-negotiable architectural rules:

1. **Deterministic Reason Codes:**
   All scam classifications must map to the 10 canonical reason codes defined in `src/lib/constants.js`. Do **NOT** invent arbitrary reason codes without updating the central schema, parser, and test suite.
   - `URGENCY_SCARE_TACTICS`
   - `REQUEST_OTP_PASSWORD`
   - `PAYMENT_REDIRECT`
   - `SUSPICIOUS_DOMAIN`
   - `IMPERSONATION_BRAND`
   - `MALICIOUS_ATTACHMENT`
   - `UNSOLICITED_CONTACT`
   - `POOR_GRAMMAR_FORMAT`
   - `REWARD_BAIT`
   - `THREAT_BLACKMAIL`

2. **Supabase Key Privilege Separation:**
   - Client code (`src/**`) and read-only endpoints must **only** use `VITE_SUPABASE_ANON_KEY`.
   - `SUPABASE_SERVICE_ROLE_KEY` must **never** be bundled into the client build or referenced in client components. It is strictly reserved for write operations in serverless edge functions (`api/**`).

3. **In-Memory Audio Privacy:**
   - Raw audio samples processed by the Voice Deepfake Analyzer must **never** be saved to disk, uploaded to object storage, or written to PostgreSQL. Processing must remain strictly ephemeral in volatile memory.

4. **Vercel Hobby Cron Frequency:**
   - On Vercel's Hobby plan, cron jobs cannot run more frequently than once per day. The schedule in `vercel.json` must remain `"0 0 * * *"`.

---

## 4. Git Workflow & Branching Strategy

We follow a structured Git feature-branch workflow:

1. **Main Branch:** `main` is production-locked and continuously deployed to [Vercel](https://ghost-net-zeta.vercel.app).
2. **Branch Naming Conventions:**
   - `feat/feature-name` — New feature or scanner capability
   - `fix/bug-description` — Bug fix or error resolution
   - `docs/topic-name` — Documentation improvements
   - `perf/optimization` — Performance and latency enhancements
   - `test/suite-name` — Adding or updating test cases

### 4.1 Conventional Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
<type>(<scope>): <short summary>

[optional body]
```
**Allowed types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or correcting tests
- `chore`: Build tasks, dependency updates, configuration

**Examples:**
- `feat(qr): add live camera HUD reticle overlay`
- `fix(voice): prevent buffer overflow on empty audio recording`
- `docs(prd): add competitive analysis and business model`

---

## 5. Quality Gates & Verification

All contributions must pass all quality gates before being merged:

### 5.1 Run Automated Tests
```bash
npm test
```
*Expected: 40/40 tests passing across all 15 test suites in `tests/scanner.test.js`.*

### 5.2 Linting & Code Style
```bash
npm run lint
```
*Expected: 0 ESLint errors and warnings.*

### 5.3 TypeScript Compilation Check
```bash
npm run typecheck
```
*Expected: 0 type errors.*

### 5.4 Production Build Verification
```bash
npm run build
```
*Expected: Clean Vite production build with bundle chunks strictly under 460kB.*

### 5.5 Git Diff Whitespace Check
```bash
git diff --check
```
*Expected: Clean output with zero trailing whitespace or carriage return anomalies.*

---

## 6. Pull Request (PR) Checklist

Before submitting a Pull Request, verify:
- [ ] PR branch is rebased on latest `origin/main`.
- [ ] `npm test` passes with 40/40 tests.
- [ ] `npm run lint` and `npm run typecheck` pass with zero errors.
- [ ] `npm run build` succeeds without bundle size warnings.
- [ ] No API keys, secrets, or `.env` files are committed.
- [ ] Any new feature is accompanied by automated test coverage in `tests/scanner.test.js`.
- [ ] Documentation is updated in `docs/` to reflect any behavioral changes.

---

## 7. Reporting Vulnerabilities & Security Issues

Security is our core mission. If you discover a security vulnerability or bypass in TrustBreak AI:
- **Do NOT** open a public GitHub issue.
- Email the security team directly at `security@trustbreak.ai` (or via private repository security advisory).
- Provide detailed reproduction steps, payload examples, and your recommended mitigation.
- We will acknowledge receipt within 24 hours and coordinate a responsible disclosure timeline.

---

Thank you for helping make the internet safer for everyone with **TrustBreak AI**!
