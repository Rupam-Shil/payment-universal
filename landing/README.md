# payment-universal — landing page

Single-page marketing site for the `payment-universal` SDK. Built with Vite + React + Tailwind. Deploys to Vercel.

This subdirectory is **self-contained** — it has its own `package.json`, `node_modules`, and build output. The main `payment-universal` package's `files` whitelist in root `package.json` excludes this folder from npm publishes automatically. No `.npmignore` needed.

## Develop

```bash
cd landing
npm install
npm run dev
```

## Build

```bash
npm run build
# output: landing/dist/
npm run preview   # local preview of the built site
```

## Deploy to Vercel

Either:

- **CLI:** `cd landing && vercel` (first time prompts for project link)
- **Git integration:** point Vercel at this repo, set the root directory to `landing/`, and the `vercel.json` here takes care of framework + build settings.
