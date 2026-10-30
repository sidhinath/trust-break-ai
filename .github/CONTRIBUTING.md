# Contributing to GhostNet AI

Thank you for your interest in contributing to GhostNet AI! We welcome contributions from developers, security researchers, and designers.

---

## 1. Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please maintain a respectful and collaborative environment.

---

## 2. Getting Started

1. **Fork the Repository** to your GitHub account.
2. **Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/GhostNet.git
   cd GhostNet/GhostNet-app/GhostNet-app
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Setup Environment**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials and AI API keys (`GROQ_API_KEY`, `GEMINI_API_KEY`).
5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

---

## 3. Branching & Commit Conventions

* **Branch Naming:**
  * `feat/feature-name` for new capabilities
  * `fix/bug-description` for bug fixes
  * `docs/documentation-update` for documentation changes
  * `test/test-suite` for adding or improving test coverage

* **Commit Messages (Conventional Commits):**
  * `feat: add typosquatting distance calculation`
  * `fix: prevent theme specificity clash on selected cards`
  * `docs: update AI architecture explanation`
  * `test: add unit coverage for attack chain reconstruction`

---

## 4. Testing & Verification

Before submitting a Pull Request, ensure that all tests and builds pass cleanly:

```bash
# Run unit test suite
npm test

# Verify production build compilation
npm run build

# Run linter
npm run lint
```

---

## 5. Pull Request Guidelines

1. Open a PR against the `main` branch.
2. Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely.
3. Include screenshots or terminal logs for UI changes and new features.
4. Ensure no secrets, personal machine paths, or temporary build files are included.
