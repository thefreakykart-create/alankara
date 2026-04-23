# Alankara

Alankara is a Next.js storefront for Indian home decor, with a strong focus on configurable wall art. The app includes a standard ecommerce flow plus a gallery wall planner, a room try-on experience, Supabase-backed auth and catalog data, and PhonePe checkout.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Supabase for auth, data, and storage
- Zustand for cart state
- Framer Motion, GSAP, and Lenis for interaction and motion
- PhonePe for payments

## Main Features

- server-rendered home, catalog, product, account, and admin pages
- general products and wall-art products with frame and size variants
- persisted cart and slide-out cart drawer
- gallery wall planner for arranging multiple wall-art pieces
- try-on-wall flow using either camera or uploaded room photos
- PhonePe payment initiation with callback handling

## Project Structure

- `src/app`: routes, layouts, route handlers
- `src/components`: feature and UI components
- `src/lib`: shared types, constants, utilities, Supabase and PhonePe helpers
- `src/stores`: Zustand stores
- `docs/CODEBASE_OVERVIEW.md`: architecture, flow, and risk notes

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
cp .env.local.example .env.local
```

If you do not have an example env file yet, create `.env.local` manually with the variables listed below.

3. Run the dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PHONEPE_MERCHANT_ID`
- `PHONEPE_SALT_KEY`
- `PHONEPE_SALT_INDEX`
- `PHONEPE_ENV`
- `PHONEPE_BASE_URL`

If the PhonePe credentials are missing, the app falls back to a demo checkout mode that still creates successful orders locally.

## Useful Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

- Admin pages are protected in-app through server-side auth and role checks.
- Product data, categories, profiles, orders, and payments are expected to exist in Supabase.
- Wall-art pricing should be treated as variant-driven through `product_variants`, not through the base `products.price`.

## Documentation

- Architecture overview: [docs/CODEBASE_OVERVIEW.md](docs/CODEBASE_OVERVIEW.md)
