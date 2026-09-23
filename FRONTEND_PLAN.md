# FRONTEND_PLAN.md — Carmexio web (Angular)

Everything that must be built for the **Carmexio website** in Angular. Work
through the checklists top to bottom. Same brand as the Flutter app (colors,
font, logo), but a **web-first layout**, not a copy of the mobile UI.

- Mobile app (reference implementation of every feature + business rules):
  `../carmexio` (Flutter).
- **Backend contract (single source of truth for data):**
  `../carmexio/API_NEEDED.md` — both apps talk to the same Supabase project.
- This file lives in `../carmexio-web/FRONTEND_PLAN.md`.

---

## 1. Product in one paragraph

Carmexio is a used-car **dealer** in Mexico with branches (CDMX, Guadalajara,
Querétaro, Tijuana). Anyone can post their car, but it goes live only after
Carmexio verifies and inspects it. Buyers browse verified cars with a full
inspection report and contact **Carmexio** (chat / WhatsApp / call) — never
the owner. Carmexio arranges visits, test drives and the sale. The website has
two faces: the **public marketplace** and the **staff portal** that runs the
verification, inspection and chat operations.

### Business rules (must match the app and the database)

1. Every listing belongs to a branch (`location_id`); owners (`seller_id`) are private.
2. Selling requires sign-in and **11 mandatory photo angles**:
   `front, front_left, left_side, rear, rear_right, right_side, dashboard,
   front_seats, rear_seats, engine, trunk`. Each uploads as soon as it is added;
   the slot then turns grey with a check. Submit is disabled until all 11 +
   details + price + branch + description (≥ 20 chars) are done.
3. New/edited ads are `pending` → staff sets `active` or `rejected` (+ reason).
4. Chat = user ↔ branch. Staff reply with `sender_role = 'staff'`.
5. Inspection report = checklist categories (ok / attention / fail → %) + body
   diagram (15 panels, defect codes `P A1 A2 A3 U1 B2 S1 •`).
6. Prices in **MXN**, format `$459,900`; mileage `92,712 km`.

---

## 2. Tech stack (latest as of Sep 2026)

| Concern | Choice |
|---------|--------|
| Framework | **Angular 22**, standalone components, **signals**, zoneless change detection, new control flow (`@if`, `@for`, `@defer`) |
| Rendering | **SSR + hydration** (`@angular/ssr`) — listing and car pages must be crawlable. Prerender home, showrooms, how-it-works |
| Styling | SCSS + CSS custom properties (design tokens below), light/dark via `prefers-color-scheme` + manual toggle |
| UI primitives | Angular CDK (overlay, dialog, a11y, drag-drop, virtual scroll). No heavy UI kit — custom components match the brand |
| Data | `@supabase/supabase-js` v2 (Auth, PostgREST, Storage, Realtime) behind repository interfaces |
| State | Signal stores per feature (`*.store.ts` = ViewModel), `resource()` / `httpResource` for async, `linkedSignal` for derived state |
| Forms | Signal Forms (Angular 21+) or typed Reactive Forms |
| Images | `NgOptimizedImage`, Supabase image transformation for thumbnails |
| i18n | `@angular/localize`, **es-MX default** + en |
| Testing | Vitest (unit, default in Angular CLI), Angular Testing Library, **Playwright** (e2e) |
| Quality | ESLint (`angular-eslint`), Prettier, strict TS, husky pre-push = lint + test + build |
| Hosting | Vercel (SSR) — or Firebase App Hosting |

---

## 3. Brand & design tokens (copy from the Flutter app)

Source: `../carmexio/lib/core/theme/app_colors.dart`, `app_theme.dart`,
`app_spacing.dart`.

```scss
:root {
  --cx-primary: #0085FE;        --cx-primary-dark: #0066D6;
  --cx-primary-soft: #E6F2FF;   --cx-accent: #00C2FF;
  --cx-navy: #0A0F1C;           --cx-navy-soft: #0E2447;
  --cx-success: #12B76A; --cx-warning: #F79009; --cx-error: #F04438;
  --cx-gold: #FFB020;    --cx-whatsapp: #25D366;

  --cx-bg: #F5F7FB; --cx-surface: #FFFFFF; --cx-surface-alt: #EEF2F8;
  --cx-border: #E3E8F0; --cx-text: #0B1220; --cx-text-2: #5B6475; --cx-text-3: #98A2B3;

  --cx-gradient-primary: linear-gradient(135deg, #0085FE, #3D5AFE);
  --cx-gradient-hero: linear-gradient(135deg, #0A0F1C, #0E2447);

  --cx-radius-sm: 10px; --cx-radius-md: 14px; --cx-radius-lg: 20px; --cx-radius-xl: 28px;
  --cx-font: 'Urbanist', system-ui, sans-serif;
}
[data-theme='dark'] {
  --cx-bg: #0A0F1C; --cx-surface: #121A2B; --cx-surface-alt: #1A2438;
  --cx-border: #24304A; --cx-text: #F5F7FB; --cx-text-2: #A4AEC2; --cx-text-3: #6B7690;
  --cx-primary-soft: #0F2A4D;
}
```

- **Font:** Urbanist 400/500/600/700/800 (self-host the TTF/WOFF2 from
  `../carmexio/assets/fonts` or Google Fonts). Headlines 800, tight letter-spacing.
- **Logo:** `../carmexio/assets/images/logo_mark.png` (blue eagle),
  `logo_mark_white.png` (on navy), app icon `../carmexio/assets/icons/app_icon.png`
  → favicon + PWA icons. Wordmark: "CARMEXIO", Urbanist 800, wide tracking.
- **Visual language:** navy hero sections with blue gradient accents, big car
  photography, cards radius 20, pill chips, glass buttons over photos, shimmer
  skeletons, subtle fade/slide-in on scroll, lots of whitespace.
- **Breakpoints:** 360 / 768 / 1024 / 1280 / 1536. Max content width 1280.

---

## 4. Design references (Dribbble)

Use these for **layout and composition ideas only** — keep Carmexio's colors,
font and logo. Pick the best parts per page.

**Home / landing (dealer + marketplace)**
- https://dribbble.com/shots/27016418-Luxury-Car-Dealership-Website-UI-UX-React-Front-End
- https://dribbble.com/shots/19919529-CARDEAL-Car-Dealership-Website-Hero-Banner
- https://dribbble.com/shots/26143181-Premium-Park-Electric-Car-Dealership-Website
- https://dribbble.com/shots/26576231-Dark-Mode-Light-Mode-Car-Dealership-website-UI
- https://dribbble.com/shots/27741170-DriveX-Premium-Car-Marketplace-Website
- https://dribbble.com/shots/27508208-Drive-the-Future-Carlear-Premium-Car-Marketplace-Website
- https://dribbble.com/shots/27178714-Modern-Car-Marketplace-Landing-Page

**Search results / inventory grid + filters**
- https://dribbble.com/shots/21186998-Auto-Hunt-Car-Marketplace-Website
- https://dribbble.com/shots/27075583-Car-Marketplace-Website-Buy-Sell-Explore-Vehicles
- https://dribbble.com/shots/27394358-Automotive-Car-Inventory-Website-UI-UX-Design
- https://dribbble.com/shots/26977939-AutoDeal-Car-Dealer-Rental-Listing-Figma-Template
- https://dribbble.com/shots/21698510-Car-Dealership-Website-Vehicle-UI-kit-Car-Automobile

**Car details page**
- https://dribbble.com/shots/27706122-Modern-Car-Marketplace-Website-UI-UX
- https://dribbble.com/shots/27022086-Premium-Car-Marketplace-Website-UI-Automotive-Web-Design
- https://dribbble.com/shots/19455491-Autohive-Car-Dealership-Website
- https://dribbble.com/shots/27696222-Electric-Vehicle-Marketplace-Dealer-Experience

**Inspection report**
- https://dribbble.com/shots/6792515-Car-Inspection-Report
- https://dribbble.com/shots/19554622-Cars-Inspection-Report-Dashboard-Design
- https://dribbble.com/shots/24817099-Car-Inspection-AI-Dashboard

**Staff portal (review queue, inspections, chats)**
- https://dribbble.com/shots/27262274-Automotive-Dashboard-UI-Luxury-Car-Sales-Admin-Panel
- https://dribbble.com/shots/27613046-AutoPulse-Automotive-Dashboard
- https://dribbble.com/shots/25251171-AI-Car-Inspection-SaaS-Dashboard
- https://dribbble.com/shots/27004372-Dashboard-Design-For-a-Car-Rental-Service

**Booking / visit flow ideas**
- https://dribbble.com/shots/27696420-Car-Rental-Website-Design-Online-Vehicle-Booking-Platform
- https://dribbble.com/shots/26749575-Dream-Drive-Luxury-Car-Rental-Website

Also look at: PakWheels.com inspection report (body diagram legend),
Kavak.com (Mexican competitor — certified cars, financing UX).

---

## 5. Architecture

```
src/app/
  core/
    config/            environment tokens (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, USE_DUMMY_DATA)
    supabase/          SupabaseClient provider (browser + server-safe)
    auth/              session store (signal), authGuard, staffGuard, redirect-after-login
    http/              error mapping → Failure types, Result<T>
    seo/               Meta/Title service, JSON-LD builder, canonical
    theme/             theme toggle service
    utils/             formatters (MXN, km, relative dates), validators
  domain/              entities + repository interfaces (Car, DealerLocation,
                       InspectionReport, Conversation, ChatMessage, Brand, Banner,
                       CarFilter, PhotoAngle, ListingStatus…) — mirror Flutter entities
  data/
    models/            row ↔ entity mappers (snake_case, same keys as API_NEEDED.md)
    supabase/          *SupabaseRepository implementations
    dummy/             DELETE WHEN LIVE: in-memory repos seeded with the SAME
                       JSON as ../carmexio/lib/dummy/data (export it once to JSON)
  shared/ui/           button, chip, card, car-card, price, badge, skeleton,
                       empty-state, error-state, avatar, glass-icon-button,
                       gallery, body-diagram (SVG), dialog, toast, stepper
  features/
    home/  search/  car-details/  inspection/  showrooms/  sell/  my-ads/
    favorites/  chat/  profile/  auth/  static-pages/  staff/
  app.routes.ts        lazy routes per feature; /staff guarded by role
```

Pattern per feature: `feature.page.ts` (view, dumb template) +
`feature.store.ts` (signal store = ViewModel: state signals, computed, actions
calling repositories) + child components. Repositories are injected by
**interface tokens**, so `provideDummyData()` vs `provideSupabaseData()` is a
one-line switch in `app.config.ts` (same idea as `dummyOverrides()` in Flutter).

Rules: files < 400 lines, OnPush everywhere (default with signals), no
`any`, every route has a title + meta, every page has loading / empty / error
states.

---

## 6. Pages & features (public)

### 6.1 Layout shell
- [ ] Sticky header: logo, search box (desktop), nav (Buy, Sell, Showrooms, How it works), favorites, chats (unread badge), avatar menu / Sign in
- [ ] Mobile: compact header + bottom tab bar (Home, Search, **Sell**, Chats, Account) mirroring the app
- [ ] Footer: branches with hours, WhatsApp, Instagram, legal links, language + theme toggles
- [ ] Global toast, route progress bar, skip-to-content link

### 6.2 Home (`/`) — SSR + prerender
- [ ] Navy hero: headline "Encuentra tu próximo auto", search bar (make/model/version) + quick filters (body, budget, branch), hero car image
- [ ] Promo banners carousel (`banners` table, deep links)
- [ ] Body-type chips, top brands (sorted by stock)
- [ ] Featured / Carmexio Certified carousel
- [ ] "How Carmexio works" 4 steps (verify → inspect → live → we arrange the visit)
- [ ] Shop by budget tiles, "Just arrived" grid
- [ ] Our showrooms (4 cards with photo, hours, map link)
- [ ] Sell CTA band + app download badges
- [ ] Testimonials / Instagram highlights (optional)

### 6.3 Search (`/autos?…`) — SSR
- [ ] URL is the state: same query keys as the app deep links (`q, brand, body, fuel, transmission, city, minPrice, maxPrice, minYear, maxYear, maxKm, verified, featured, sort`)
- [ ] Desktop: left sticky filter panel; mobile: filter drawer with "Apply N filters"
- [ ] Price / year range sliders, mileage slider, chips for body/fuel/transmission/branch, certified toggle
- [ ] Active-filter chips with remove, sort dropdown, result count
- [ ] Grid / list toggle, infinite scroll or pagination (page size 12), skeletons
- [ ] Empty state with "clear filters", recent searches (localStorage)
- [ ] SEO landing variants: `/autos/pickup`, `/autos/toyota`, `/autos/cdmx`

### 6.4 Car details (`/autos/:id-:slug`) — SSR
- [ ] Gallery: hero + thumbnails of the **11 angles** labelled by angle, full-screen lightbox with zoom/keyboard
- [ ] Title, version, price (MXN), badges (Featured, Certified, Verified by Carmexio), views, posted time
- [ ] Key specs grid (year, km, fuel, transmission) + overview table + features chips + description
- [ ] **Inspection summary** card (score ring) → full report
- [ ] **Branch card** "Sold by Carmexio {branch}": address, hours, map, "Book a visit"
- [ ] Sticky contact box (desktop right column / mobile bottom bar): Chat with Carmexio, WhatsApp branch (prefilled message with ad id), Call branch
- [ ] Favorite + share (Web Share API, copy link), similar cars
- [ ] Owner view: status banner, Edit, Mark as sold, Chat with Carmexio about my ad
- [ ] JSON-LD `Car` / `Offer`, OG image = cover photo, canonical URL

### 6.5 Inspection report (`/autos/:id/inspeccion`)
- [ ] Header: overall score ring, summary, inspected date, branch, inspector
- [ ] **SVG exploded body diagram** (port `BodyDiagram` layout from `../carmexio/lib/features/listings/presentation/inspection/body_diagram.dart`): 15 panels, severity tint, codes on panels, hover/click → popover with defects; "Show minor marks" toggle
- [ ] Legend (P, A1, A2, A3, U1, B2, S1, •)
- [ ] Category accordions with % bar, item status icons, "Issues only" toggle
- [ ] Print-friendly / "Download PDF" (print stylesheet)

### 6.6 Showrooms (`/sucursales`, `/sucursales/:id`)
- [ ] Cards / map (Leaflet or Google Maps embed) of branches, hours, phone, WhatsApp, directions
- [ ] Branch page: inventory of that branch, chat with branch (general enquiry)

### 6.7 Auth (`/entrar`, `/registro`, `/recuperar`)
- [ ] Email + password, sign up with name + phone (+52), password reset, email confirmation screen
- [ ] Redirect back to the page that required auth (`?from=`)
- [ ] Future: Google / Apple / phone OTP

### 6.8 Sell (`/vender`, `/vender/:id/editar`) — auth required
- [ ] Stepper: **Details → Photos → Price & branch → Review**
- [ ] Details: brand/model pickers (from `brands.models`, custom model allowed), year, version, body, fuel, transmission, mileage, engine, color
- [ ] **Photos: 11 angle slots** with silhouette icon, label and instruction.
  - Mobile browsers: slot click opens the camera directly (`<input type="file" accept="image/*" capture="environment">`)
  - Desktop: click opens file dialog; drag & drop onto a slot
  - Client-side resize to 1920px / 80% JPEG (canvas) before upload
  - Upload immediately to `listing-images/<uid>/<ts>.jpg`; progress overlay; done → greyscale + check + "Retake"; error → retry
  - Progress bar `7 / 11`; Continue blocked until all done
- [ ] Price & branch: price (MXN), branch picker (address/hours shown), features multi-select, description (20–1500)
- [ ] Review: angle thumbnails, summary cards with Edit links, "What happens next" (4 steps) → **Submit for review**
- [ ] Edit mode: prefill, tagged angles keep their photo, missing angles must be re-shot; resubmission goes back to `pending`
- [ ] Draft autosave to localStorage

### 6.9 My ads (`/mis-anuncios`) — auth
- [ ] Tabs: Live / In review (pending + rejected) / Sold with counts
- [ ] Card: cover, title, price, status pill ("Under review by Carmexio", "Changes requested"), views/saves, rejection reason + "Fix and resubmit"
- [ ] Actions: edit, mark sold, relist (→ pending), delete (confirm)

### 6.10 Favorites (`/favoritos`) — auth
- [ ] Grid of saved cars, optimistic heart toggle everywhere, sign-in prompt for guests

### 6.11 Chats (`/mensajes`, `/mensajes/:id`) — auth
- [ ] Desktop two-pane (inbox left, thread right); mobile separate pages
- [ ] Inbox rows: Carmexio avatar, branch name, car title/price or "General enquiry", last message, time, unread badge
- [ ] Thread: car banner (link to ad), bubbles (user right / Carmexio left), day dividers, read ticks, quick replies ("Is it still available?", "I'd like to book a visit", "Test drive?", "Financing?")
- [ ] Supabase Realtime on `messages`, `mark_conversation_read`, unread count in header

### 6.12 Profile (`/cuenta`)
- [ ] Profile card, edit name/phone/city/avatar (upload to `avatars`), theme + language, sign out
- [ ] Links: showrooms, Instagram, support WhatsApp, terms, privacy

### 6.13 Static pages
- [ ] How it works (`/como-funciona`), About, FAQ, Terms, Privacy, Contact, 404, 500

---

## 7. Staff portal (`/staff`) — role `staff` | `admin`

- [ ] Staff shell: sidebar (Dashboard, Review queue, Listings, Inspections, Chats, Branches*, Banners*, Users*) — *admin only
- [ ] Dashboard: KPIs per branch (pending, live, sold this month, unread chats, avg review time) — see dashboard refs above
- [ ] **Review queue**: pending ads for my branch, oldest first; review page shows 11 angle photos side by side, details, owner contact (staff only); actions Approve → `active`, Reject with reason templates, Request re-shoot of specific angles
- [ ] **Inspection editor**: checklist form per category (ok/attention/fail + note), **click on SVG diagram panel → add defect code + note**, overall score, summary; saves `inspection_reports` (score syncs to listing); toggles Featured / Certified
- [ ] **Branch inbox**: all conversations for my branch, assign advisor, reply as staff, canned replies, link to listing, schedule visit (future `appointments` table)
- [ ] Listings admin: search all, change status, feature, edit
- [ ] Admin: CRUD locations, banners, brands/models, promote users to staff
- [ ] Audit: `reviewed_by`, `reviewed_at` shown on listings

---

## 8. SEO, performance, accessibility

- [ ] SSR for `/`, `/autos`, `/autos/:id-:slug`, `/sucursales`; prerender static pages
- [ ] Per-page `<title>`, description, OG/Twitter tags; JSON-LD (`AutoDealer` for branches, `Car` + `Offer` for listings, `BreadcrumbList`)
- [ ] `sitemap.xml` generated from active listings (Edge Function or build step), `robots.txt`
- [ ] Canonical slugs `/autos/<id>-toyota-hilux-2022`
- [ ] Core Web Vitals: LCP < 2.5s (hero image priority, `NgOptimizedImage`, AVIF/WebP), `@defer` below-the-fold sections, route-level code splitting
- [ ] WCAG 2.2 AA: contrast, focus rings, keyboard gallery & diagram, aria labels on icon buttons, reduced-motion support
- [ ] Analytics (Vercel Analytics / GA4) + error tracking (Sentry)

---

## 9. Data layer tasks

- [ ] Export the Flutter dummy seed to JSON (`../carmexio/lib/dummy/data/*`) → `src/app/data/dummy/*.json` so both clients show the same demo data
- [ ] Repositories (interfaces in `domain/`, Supabase + dummy impls): Auth, Listings (search, details, featured, recent, similar, my listings, create/update/status/delete, uploadPhoto), Locations, Brands, Banners, InspectionReports, Favorites, Chat (conversations, realtime messages, send, markRead, getOrCreate by listing/location), Profile, Staff (review queue, approve/reject, save report, admin CRUD)
- [ ] Mappers use the exact column names in API_NEEDED.md (`image_angles`, `location_id`, `rejection_reason`, `sender_role`, `user_unread_count`…)
- [ ] Error mapping identical to the app (`PGRST116` → NotFound, `42501` → Auth, network)
- [ ] Generate DB types: `supabase gen types typescript` → `src/app/data/supabase.types.ts`
- [ ] Environment: `src/environments/environment*.ts` (never commit real keys; use Vercel env vars)

---

## 10. Build order (suggested milestones)

1. **Foundation** — tokens, fonts, logo, shell, routing, theme toggle, dummy data provider, shared UI kit, formatters
2. **Browse** — home, search + filters, car details, inspection report, showrooms (SSR + SEO)
3. **Account** — auth, favorites, profile
4. **Sell** — angle photo capture/upload, stepper, my ads
5. **Chat** — inbox, thread, realtime, unread badge
6. **Staff portal** — review queue, inspection editor, branch inbox, admin
7. **Go live** — switch to Supabase, remove `data/dummy`, i18n es-MX, analytics, sitemap, deploy

---

## 11. Definition of done (every PR)

- `npm run lint && npm test && npm run build` pass (pre-push hook)
- Unit tests for stores/mappers/utils; component tests for shared UI; Playwright for: search → details → chat, sell flow with 11 photos, staff approve
- Works at 360px and 1440px, light + dark, keyboard only
- No hard-coded colors (tokens only), no file > 400 lines
- `../carmexio/API_NEEDED.md` updated if data needs changed
