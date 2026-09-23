# CLAUDE.md — Carmexio web (Angular 22)

Website for **Carmexio**, a used-car dealer in Mexico with branches (CDMX,
Guadalajara, Querétaro, Tijuana). Public marketplace + staff portal.

- **Work plan:** `FRONTEND_PLAN.md` (checklists, design refs, milestones). Tick items as you finish them.
- **Backend contract:** `../carmexio/API_NEEDED.md` (Supabase, shared with the Flutter app).
- **Reference implementation:** `../carmexio` (Flutter) — same rules, entities and demo data.

## Business rules (must match the app + DB)

- Every listing belongs to a Carmexio branch (`location_id`); owners are private.
- Selling needs sign-in + **11 mandatory photo angles** (`PHOTO_ANGLES`); each uploads on capture, then the slot is greyed with a check.
- New/edited ads are `pending` until staff approve (`active`) or reject (`rejected` + `rejection_reason`).
- Buyers contact **Carmexio** (chat/WhatsApp/call the branch) — never the owner.
- Inspection report: category checklists (ok/attention/fail → %) + body diagram (15 panels, codes P A1 A2 A3 U1 B2 S1 •).
- UI language **es-MX**; prices MXN (`$459,900`).

## Architecture

```
src/app/
  domain/        framework-free: models.ts (entities, enums, labels, AppError),
                 repositories.ts (interfaces + InjectionTokens), inspection-template.ts
  data/          mappers.ts (snake_case rows ↔ entities), providers.ts
                 (provideDummyData / provideSupabaseData — the ONE switch, in app.config.ts)
    supabase/    client factory, *Repository impls, error mapping, listing-query builder
    dummy/       DELETE WHEN LIVE — DummyDb seeded from seed.json (exported from the Flutter app)
  core/          config (APP_CONFIG), auth (SessionStore, guards), state (FavoritesStore,
                 ChatInboxStore — app-wide), seo (SeoService: meta/canonical/JSON-LD/status),
                 theme, ui (ToastStore), utils (format, errors, resource helpers)
  shared/ui/     feature-agnostic components: car-card, logo, state views (empty/error/
                 skeleton/score ring), status-pill, toast-outlet, body-diagram (SVG)
  layout/        shell (header, mobile tab bar, footer), route progress bar
  features/      home, search, car-details, inspection, showrooms, auth, sell, my-ads,
                 favorites, chat, profile, staff (own routes + StaffScope), static
src/server/      Express-only code (sitemap.xml); src/server.ts wires it
```

Dependency direction (enforced by `no-restricted-imports` in `eslint.config.js`):
`features → shared/core/domain`, `layout → shared/core/domain`, `shared → core/domain`,
`core → domain`, `data → domain/core`. Features never import `data/` or another feature;
only `data/supabase` imports `@supabase/*`; `data/dummy` stays deletable on its own.

Patterns:
- Page component (view) + signal store / `resource()` (ViewModel) + repositories injected
  by token. Cross-feature state lives in `core/state`.
- Repositories reject only with `AppError` (es-MX message + kind). Show it with
  `ToastStore.error(e)` for actions and `<cx-error-state>` for failed primary content.
- `resource().value()` **throws** in error state: read with `valueOr(res, fallback)` in code,
  guard with `@if (res.error())` first in templates. Secondary sections load through
  `optional(promise, [])` so their failure never breaks the page.
- Public SSR resources get an `id` (e.g. `'home:featured'`) so hydration reuses the server
  data via TransferState. Never set `id` on user-specific data.
- Reads have no side effects: counters (`recordView`) run in the browser only.
- Pages call `SeoService.set()` (title, description, canonical, `noindex` for private
  pages) and `setStatus(404)` for missing content.
- Providers are factories so each SSR request gets its own instances.

## Rules

- Brand tokens only (`src/styles/_tokens.scss`: `--cx-*`), font Urbanist, logo in `public/images`.
  Text/fill colours must use the AA roles: `--cx-primary-text`, `--cx-primary-fill`,
  `--cx-{success,warning,error}-text`, `--cx-{success,error}-fill`; plain `--cx-primary` is
  for borders, icons and focus rings only.
- Files < 400 lines; split components instead.
- SSR-safe: no `window`/`localStorage` at module or constructor level (guard with `isPlatformBrowser`).
- Render modes live in `app.routes.server.ts` (public = SSR/prerender, signed-in = client).
- Layout must not scroll horizontally at 360px: grid tracks that hold scrollers use `minmax(0, 1fr)`.
- `src/app/a11y.spec.ts` runs axe on every page — add new routes to it.
- Before pushing: `npm run verify` (lint + tests + production build). Enable the hook once:
  `git config core.hooksPath .githooks`.
- Refresh demo data from the app: `cd ../carmexio && dart run tool/export_dummy_seed.dart ../carmexio-web/src/app/data/dummy/seed.json`.
- Demo logins: `demo@carmexio.mx` / `carmexio123` (user), `staff@carmexio.mx` / `carmexio123` (admin → /staff).
- Local production server: `NG_ALLOWED_HOSTS=localhost npm run serve:ssr:carmexio-web`
  (production hosts are listed in `angular.json` → `security.allowedHosts`).

## Going live (Supabase)

1. Fill `src/environments/environment.ts` (`supabase.url`, `supabase.publishableKey`) — or
   generate it at build time from host env vars. Publishable key only, never the secret key.
2. `app.config.ts`: `provideDummyData()` → `provideSupabaseData()`.
3. `src/server.ts`: sitemap source → `SupabaseListingRepository` (marked `DUMMY`).
4. Stop shipping `src/app/data/dummy/`: specs use it as an in-memory fake, so either keep it
   test-only (no imports from app code) or replace it with slimmer fakes, then delete it.

---

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
