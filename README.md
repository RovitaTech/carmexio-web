# Carmexio web

Angular 22 (SSR, zoneless, signals) website for Carmexio — verified used cars in Mexico.
Plan: [`FRONTEND_PLAN.md`](FRONTEND_PLAN.md) · Backend contract: [`../carmexio/API_NEEDED.md`](../carmexio/API_NEEDED.md) · Mobile app: `../carmexio`.

## Run

```bash
npm install
npm start                 # http://localhost:4200 (dummy data)
npm run verify            # unit tests + production build (run before pushing)
npm run build && npm run serve:ssr:carmexio-web   # SSR server
```

Demo: `demo@carmexio.mx` / `carmexio123` · Staff portal: `staff@carmexio.mx` / `carmexio123` → `/staff`.

## What's in the scaffold

Every feature of the app has a working page on dummy data: home, search with URL filters,
car details (SEO + JSON-LD), inspection report with SVG body diagram, showrooms, sign in/up/reset,
sell wizard with 11 camera angles (upload on capture), my ads, favorites, chat with Carmexio
branches, profile/theme, staff review queue, how-it-works, 404.

Next steps are tracked in `FRONTEND_PLAN.md` (Supabase repositories, i18n, staff inspection editor, e2e tests).
