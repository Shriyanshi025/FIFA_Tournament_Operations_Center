# FIFA World Cup TOC - Production Deployment Checklist

## Pre-Deployment Verification

Use this list to ensure the application compiles cleanly and satisfies all security, performance, and accessibility standards prior to launching onto production infrastructure.

---

## 1. Environment Variable Verification
Confirm that all necessary variables are populated inside the hosting environment (Cloud Run / Vercel). Do **NOT** commit raw secret values into the repository or `.env.example`.

* [ ] **`GEMINI_API_KEY`**: Set to a valid Gemini API key. Ensure the hosting environment injects this safely so that client-side scripts do not expose it to the browser.
* [ ] **`APP_URL`**: Populated with the production URL of the deployed container to support self-referential links and websocket secure connections.

---

## 2. Compilation and Build Checks
Execute the build script in the workspace root to verify bundle generation:

```bash
npm run build
```

* [ ] **Vite Asset Bundler:** Confirm that the output directory `dist/` contains all minified index files, chunks, and CSS assets.
* [ ] **Type Correctness:** Ensure `tsc --noEmit` runs successfully with zero warnings or structural mismatches.
* [ ] **Dependencies:** Validate that `package.json` contains no unresolved libraries or broken local symlinks.

---

## 3. Production Optimization
* [ ] **Asset Minification:** Verify that all Javascript and CSS files are processed by ESBuild to minimize client-side download latency.
* [ ] **Dead Code Elimination:** Ensure that all unused helper libraries or obsolete test components are deleted or pruned from the production bundle.
* [ ] **Font Caching:** Ensure Google fonts (`Inter` and `JetBrains Mono`) are declared with optimal pre-loading headers to prevent flashing during initial load.

---

## 4. UI Layout & Accessibility (WCAG 2.1)
The console must remain fully operational in fast-paced stadium control environments:

* [ ] **Contrast Verification:** Ensure all text passes WCAG 2.1 AA contrast ratios (minimum 4.5:1 ratio for normal text, 3:1 for headers).
* [ ] **Responsive Fluidity:** Test the workspace layout across multiple display sizes (fluid down to tablet portrait grids and up to widescreen video wall monitors).
* [ ] **Dense Mode support:** Verify that the "Dense Layout" toggle in the Settings sidebar correctly scales down card paddings and spacing.

---

## 5. Failure Recovery Controls
Before deploying, perform manual recovery drills using the **Diagnostics Lab** panel:

* [ ] Trigger a mock **Gemini Outage** and verify that operators can still resolve issues manually.
* [ ] Trigger a mock **RAG Index Lockout** and verify that fallback procedures retrieve cached local procedures correctly.
* [ ] Toggle the **Emergency Red** theme to confirm that critical alert states are visually stark and unmistakable.
