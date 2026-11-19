This is a [Next.js](https://nextjs.org) project for ZARI.

## Pre-launch Instagram marketing

The approval-based content queue, first-100-follower plan, launch assets, metrics
sheet, and scheduled Instagram publisher live in [`marketing/`](marketing/README.md).
Run `npm run marketing:validate` before approving any post.

## Orders and inventory backend

The storefront includes an order-request form (`#order`) and a protected operations dashboard at `/admin`.

- Customer requests are recorded as `new`; this deliberately does **not** reduce stock.
- When an operator changes an order to `confirmed` (or a later fulfilment status), the requested quantity is deducted and a stock movement is recorded.
- Cancelling a confirmed order restores its stock. The dashboard also flags stock at or below its reorder level.

### One-time Cloudflare setup

The application uses Cloudflare D1 so orders survive deployments. Create the database and place its ID in `wrangler.jsonc` (replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`):

```bash
npx wrangler d1 create zari-orders
npx wrangler d1 execute zari-orders --remote --file=db/migrations/0001_initial_schema.sql
npx wrangler secret put ADMIN_TOKEN
```

Use a long, unique value for `ADMIN_TOKEN`. Enter it in `/admin`; it is kept only in that browser tab's session storage and sent to the server as a bearer token. Do not put the token in a `NEXT_PUBLIC_*` variable.

For a local D1 database, run the migration without `--remote` before starting the app:

```bash
npx wrangler d1 execute zari-orders --local --file=db/migrations/0001_initial_schema.sql
```

Before opening the order form to the public, configure Cloudflare Turnstile or a comparable rate-limit/bot-control rule for `POST /api/orders`.

## Customer accounts and shopping bags

Customers can create an account at `/register`, sign in at `/login`, and save pieces in a persistent shopping bag at `/cart`. Sessions use an HttpOnly cookie; password salts and PBKDF2 hashes are stored in D1, never in the browser.

Apply the customer schema after pulling this feature if it has not already been applied to the target database:

```bash
npx wrangler d1 execute zari-orders --remote --file=db/migrations/0002_customer_accounts_and_carts.sql
```

The current cart holds selected pieces and validates available stock. Payment, checkout, product/category management, and the separate admin portal are intentionally the next phase.

## Customer account dashboard

The account page keeps a signed-in customer's order history, saved pieces, delivery addresses, profile name, and concierge contact options together. New requests created while signed in are linked using the authenticated customer ID. An email match does not grant access to guest requests.

Migration `0015_order_account_ownership.sql` marks existing orders as `legacy`: the older email-based backfill did not preserve reliable ownership provenance. These orders and their current links remain intact and available to the private operations dashboard, but are withheld from customer self-service. Customers can contact the concierge with their reference for earlier or guest requests. Only new links recorded by an authenticated session appear automatically. Email verification and a verified claim flow must be implemented before restoring automatic access to guest or legacy requests; registration alone is not proof of email ownership.

Apply the dashboard migration before deploying this release:

```bash
npx wrangler d1 migrations apply zari-orders --remote
```

The dashboard intentionally does not offer payment, order cancellation, email changes, or password resets yet. Those flows require a verified-email and payment-provider implementation so they can be handled safely.

## Storefront media managed in the admin portal

The standalone admin portal has a named media library for the Homepage hero, Atelier image, collection cards, and product imagery. Administrators can upload an image, save an external image link, or create a colour-only treatment, then assign that item to the appropriate placement.

Create the R2 bucket once before deploying this feature; both Workers use it as `ZARI_MEDIA`:

```bash
npx wrangler r2 bucket create zari-media --location apac
```

Then deploy the latest storefront and admin portal. Their deployment workflows apply migration `0005_site_media_library.sql` automatically.

## Getting Started

### Product galleries

The shop’s “View all” lists products across active categories. Category tabs filter
those products in place; product quick views show the ordered photo gallery.

Apply `db/migrations/0011_product_images.sql` before releasing the matching admin
gallery editor. Existing product photos are preserved as the first gallery image.
The admin editor supports up to 12 photos per product, including multiple uploads,
selection from the category’s image library, reordering, and removal. The first
photo is the storefront thumbnail. Category covers are managed separately.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloudflare

After adding the D1 database ID and `ADMIN_TOKEN` secret, deploy the site and its backend together:

hello

```bash
npm run deploy:cloudflare
```

### Shop catalogue redesign

`/shop` includes a minimal white storefront, sticky collection tabs and image cards, an edge-to-edge editorial gallery, switchable editorial/two-column/three-column views, search, a floating filter-and-sort drawer with multi-select size/color/material/weave/price filters, price/popularity/new-arrival sorting, and accessible product quick views. Run `node --test tests/shop-catalog.test.mjs` on Node 22.18+ to check filtering and sorting behavior.

Apply `db/migrations/0009_product_filter_attributes.sql` with the other D1 migrations before populating filter metadata. The optional `product_attributes` table is keyed by catalog SKU. `sizes`, `colors`, and `materials` are JSON arrays of verified strings (for example the UI's `6 × 9 ft`, `Blue`, and `Wool` labels); `weave` is a string such as `Hand-knotted`. Additional catalog values automatically appear as filter options. This table is not yet editable in the existing admin portal; populate verified attributes through the catalog data workflow or D1. The API remains compatible with databases that have not applied this migration.

Unknown attributes are excluded from attribute-specific matches. Unpriced pieces display “Price on request” and sort after priced pieces in both price directions. Popularity counts quantities on confirmed/in-progress/ready/fulfilled orders, excluding new and cancelled orders; new arrivals use catalog creation dates. Existing sample entries have no verified size/color/material data or published prices, so those filters may return no results until catalog details are supplied. No sample prices or specifications are invented.

Development previews load the existing public ZARI default photographs from `zarirugs.com` because local R2 does not contain these assets. Production continues to use the configured media URLs. Run `npm run dev` and open `/shop` for the preview.

## Storefront improvements

Public catalogue data now drives the initial shop HTML, collection pages, permanent
`/rugs/[sku]` pages, metadata and sitemap. Empty categories are hidden from public
navigation without removing admin data. Publish verified specifications, photographs
and prices in the admin catalogue; absent details remain explicit enquiries. The
buying guide explains what to confirm and does not invent shipping, return or bespoke
terms. Editable launch descriptions are in `lib/data/catalogue-copy.ts`; custom admin
descriptions take precedence. Exact fibre composition, dimensions, lead times,
commercial policies and customer/project evidence should be supplied or confirmed
by the business rather than inferred from a photograph.

Guests can keep a bag on their device and submit a request without registration.
Signing in merges guest selections using the larger quantity per SKU, so a retried
merge does not duplicate pieces. Unavailable quantities stay editable and must be
reviewed before an enquiry. Sign-in return destinations are restricted to local URLs.

Apply migrations `0016_order_stock_transitions.sql` and
`0017_storefront_engagement.sql` before deploying this release (the production
workflow does this automatically). Stock confirmation, cancellation and their
movements are conditional on the same successful status transition in an atomic D1
batch. Concurrent or stale transitions return 409 without partial reservations.

Newsletter interest is stored in D1 through `POST /api/newsletter`; it does not send
campaigns or verification messages. Operators can read the list through protected
`GET /api/newsletter`. `GET /api/store-events` returns protected daily activity counts
for the last 30 days. Public event requests cannot create confirmation events;
confirmation counts are recorded by the successful stock transition. Counts are
activity totals, not unique visitors or verified conversion rates. Optional browser
reporting respects Do Not Track and Global Privacy Control. No customer identifiers
or contact details are stored in event rows. Public forms use one-minute request
limits with expiring hashed network keys, supplementing deployment WAF rules.

Run `npm run test:store` for catalogue, enquiry, account privacy, stock concurrency,
guest bag, newsletter, telemetry and SEO regressions. CI validation and deployment
both use Node 24.
