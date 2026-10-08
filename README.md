# Catálogo Cobo

A private B2B catalog and order-request web app for an agricultural machinery and spare-parts business in Ecuador (chainsaws, brushcutters, sprayers, water pumps, engines, and their parts — STIHL, Honda and other brands).

Approved clients browse the full catalog, build a list of parts they need, and send it as an order request. A dispatcher checks real stock in the warehouse, marks what is available, and sends back a reviewed order (proforma). The client then accepts or rejects it and coordinates pickup in **Tisaleo** or **Guayllabamba**, or shipping. No payments happen in the app — it replaces the paper/WhatsApp catalog and order flow.

The UI is in Spanish.

---

## How it works

### Roles

| Role | What they can do | Main pages |
|---|---|---|
| **CLIENT** | Browse the catalog, view products, add to cart, send order requests, track and accept/reject reviewed orders, edit profile | `/catalogo`, `/producto/:id`, `/carrito`, `/pedido`, `/perfil` |
| **DISPATCHER** | See incoming orders, mark each item available / not available with observations, see warehouse locations (casilleros) | `/despacho`, `/despacho/pedido/:id` |
| **ADMIN** | Everything above, plus approve/reject new users and assign roles, manage products, images, brands, part types and equipment models | `/admin`, `/admin/solicitudes`, `/admin/catalogo` |

### Sign-up and approval

1. A person signs up at `/registro` (authentication by **Clerk**).
2. The account starts as **PENDING** and they see a "pending approval" page.
3. An admin approves it in `/admin/solicitudes` and assigns a role (or rejects it).
4. Whoever signs up with `BOOTSTRAP_ADMIN_EMAIL` is auto-approved as ADMIN, so the first admin can get in.

### Order lifecycle

Order status changes are enforced on the server (`apps/api/src/lib/requestStateMachine.ts`), and every change is recorded in a history table:

```
DRAFT ──► SENT ──► IN_REVIEW ──► REVIEWED ──► APPROVED
  │         │                        │
  └─────────┴──► CANCELLED ◄─────────┴──► REJECTED
```

- **SENT**: the client submitted the order → dispatchers/admins get an email.
- **IN_REVIEW → REVIEWED**: the dispatcher marks availability per item → the client gets an email.
- **APPROVED / REJECTED / CANCELLED**: final states.

Prices shown are reference prices; the final price and availability are confirmed when the dispatcher reviews the order.

---

## Tech stack

**Monorepo** managed with **pnpm workspaces** (`pnpm@10.33.4`).

### Frontend — `apps/web`
- **React 19** + **TypeScript**, built with **Vite 8**
- **React Router 7** for routing
- **TanStack Query** for server data, **Zustand** for the cart (persisted)
- **React Hook Form** + **Zod** for forms and validation
- **Tailwind CSS 4** plus custom CSS variables (`src/index.css`)
- **Clerk** (`@clerk/react`, Spanish localization) for sign-in/sign-up
- **Axios** API client, **lucide-react** icons, **date-fns**, **xlsx**
- Deployed on **Vercel** (`vercel.json` rewrites all routes to `index.html` for the SPA)

### Backend — `apps/api`
- **Node.js** + **Express 5** + **TypeScript** (run with `tsx` in dev)
- **PostgreSQL** with **Prisma 7** (`@prisma/adapter-pg`)
- **Clerk** (`@clerk/express`) to verify sessions; roles/status live in our own DB
- **Cloudflare R2** (S3-compatible, via AWS SDK) for product and profile images
- **sharp** for image processing: auto-trims blank borders (Word/Canva pastes), creates `thumb` 200px, `medium` 600px and `full` 1200px WebP versions
- **multer** for uploads, **Resend** for email notifications
- **Zod** env validation, **helmet**, **cors**, **compression**, **pino**/**morgan** logging
- Deployed on **Railway** (`start` script runs `prisma migrate deploy` first)

### Other
- `packages/shared` — placeholder package for shared types (Zod)

---

## Project structure

```
catalog/
├── apps/
│   ├── api/                     Express backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma    Data model
│   │   │   ├── migrations/      SQL migrations
│   │   │   └── seed.ts          Seeds categories etc.
│   │   ├── scripts/             One-off admin / data scripts (see below)
│   │   └── src/
│   │       ├── config/env.ts    Env var validation
│   │       ├── routes/          /api/v1/* routers
│   │       ├── controllers/     Request handlers (products, images, requests, users…)
│   │       ├── services/        Order request business logic
│   │       ├── middleware/      Auth (attachUser, requireActive, requireRole), errors
│   │       └── lib/             prisma, r2, email, notifications, state machine
│   └── web/                     React frontend
│       └── src/
│           ├── pages/           Catalog, ProductDetail, Cart, MyOrder, Profile…
│           │   ├── admin/       Dashboard, AccessRequests, CatalogManager
│           │   └── dispatcher/  Inbox, OrderReview
│           ├── components/      Header, layout, landing, role guards…
│           ├── api/             React Query hooks per resource
│           └── stores/cart.ts   Cart state
├── packages/shared/
├── SOFI.xls                     Original product catalog spreadsheet (imported)
├── vercel.json
└── pnpm-workspace.yaml
```

---

## Data model (summary)

- **User** — linked to Clerk by `clerkId`; has `role` (CLIENT/DISPATCHER/ADMIN), `status` (PENDING/ACTIVE/REJECTED), and profile fields (name, phone, city, company, photo).
- **Product** — `code` (unique internal code like `E55`, `MS660-001`), name, description, price, brand, part type, `isCompleteUnit` (machine vs. spare part), `isNew`, `warehouseLocation` (casillero, shown only to dispatchers).
- **ProductImage** — multiple images per product, ordered by `position`, stored in three sizes.
- **Brand** (with search aliases like "STHIL"), **PartType**, **EquipmentModel** (e.g. `MS660`, `FS280`), and **ProductModel** (which models a part is compatible with).
- **Category** — still in the DB, but no longer shown in the UI.
- **Request** / **RequestItem** / **RequestStatusHistory** — order requests, their items (quantity, availability, observations) and the full status history.

## API

All routes are under `/api/v1` and need a Clerk session. Most also need an ACTIVE user, and writes need the ADMIN role.

| Route | Purpose |
|---|---|
| `/auth` | Current user / profile |
| `/users` | Admin: list, approve, reject, assign roles |
| `/products` | Catalog listing with filters, product detail, admin create/update |
| `/products/:id/images` | Admin: upload (multipart, up to 5), upload from URL, delete |
| `/brands`, `/part-types`, `/equipment-models` | Taxonomy (admin manages) |
| `/categories` | Legacy |
| `/requests` | Create, send, review, approve/reject/cancel order requests |

---

## Running locally

### Requirements
- Node.js (recent LTS)
- pnpm: `corepack enable`, or use `corepack pnpm …`
- A PostgreSQL database, a Clerk app, and (to upload images) a Cloudflare R2 bucket

### 1. Install
```bash
pnpm install          # also runs `prisma generate`
```

### 2. Environment variables
`.env` files are **not** in git. You need to create them on every new computer.

**`apps/api/.env`**
```env
DATABASE_URL=postgresql://user:password@host:5432/db
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...

# optional
BOOTSTRAP_ADMIN_EMAIL=you@example.com
R2_ACCOUNT_ID=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
RESEND_API_KEY=
EMAIL_FROM=
APP_URL=http://localhost:5173
PORT=3000
```
Leave optional variables commented out rather than empty. For example, an empty `BOOTSTRAP_ADMIN_EMAIL=` fails validation.

**`apps/web/.env`**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...    # same as CLERK_PUBLISHABLE_KEY
VITE_API_URL=                        # empty in dev (Vite proxies /api → localhost:3000)
```

Where to find the values: the Clerk dashboard (**API Keys**), Railway (the Postgres and API services, **Variables** tab), and the Cloudflare dashboard (**R2 → Manage API Tokens**).

### 3. Database
```bash
pnpm --filter api db:migrate     # apply migrations (dev)
pnpm --filter api db:seed        # optional: seed base data
pnpm --filter api db:studio      # browse data in Prisma Studio
```

### 4. Start
```bash
pnpm dev:api     # http://localhost:3000
pnpm dev:web     # http://localhost:5173
```

### Build
```bash
pnpm build:api
pnpm build:web
```

---

## Scripts (`apps/api/scripts`)

Run with `pnpm --filter api exec tsx scripts/<name>.ts …`

| Script | What it does |
|---|---|
| `import-cobo-analyze.ts` | Dry analysis of the catalog spreadsheet and how it maps to categories, brands and part types |
| `import-cobo.ts <file.xls> [--dry-run]` | Imports the catalog (~1,208 products from `SOFI.xls`). Idempotent on product `code` |
| `verify-import.ts` | Checks the imported data |
| `preview-recategorize.ts` / `recategorize-equipos.ts` | Preview / apply re-categorization of complete units |
| `promote-admin.ts <email> [ROLE]` | Activates a user and sets their role (default ADMIN). Useful if you get locked out |
| `list-users.ts` | Lists users and their status/role |
| `inspect-request.ts` | Debug a specific order request |

---

## Deployment

- **Frontend → Vercel.** Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` (the Railway backend URL). `vercel.json` handles SPA routing so refreshing a page doesn't 404.
- **Backend + PostgreSQL → Railway.** Set all `apps/api` env variables. `pnpm --filter api build`, then `start` runs migrations and the server.

---

## Feature history

What has been built so far, in order:

**May 2026: foundation**
- Monorepo set up (pnpm workspaces), initial SQL schema
- Authentication with **Clerk** (replaced an earlier JWT/bcrypt approach)
- Catalog API and catalog front end
- Catalog domain model: products, brands, part types, equipment models, compatibility
- Distributor (dispatcher) panel for reviewing orders
- Product images on **Cloudflare R2**
- Fixed client view of past orders
- **Email notifications** for new and reviewed orders
- Mobile-responsive design, all pages connected
- Fixed the brand filter
- **User profiles** (first/last name split, phone, city, company, photo)
- Deployed with Vercel (front) and Railway (API)
- UI polish and better mobile layout

**June 2026: real data**
- Imported the real product catalog from the spreadsheet; added **warehouse location (casillero)** per product
- Fixed Vercel SPA 404 on refresh; simplified catalog filters

**July 2026: images and simplification**
- **Multiple images per product**, with thumbnail selector and full-screen viewer
- Upload images by **copy-paste and drag-and-drop**
- Removed categories from the client and admin UI
- Improved image upload handling

**August 2026: image quality of life**
- Clipboard paste handler in the admin
- Automatic **trimming of blank borders** on images
- Support for images pasted from **Canva** (transparent padding)

**October 2026: in progress, not yet committed**
- The product image now shows uncropped (`contain` instead of `cover`)
- The full-screen viewer has real zoom: click to zoom into a point, mouse wheel, drag to pan
