This is a [Next.js](https://nextjs.org) project for ZARI.

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

The account page now keeps a signed-in customer’s order history, saved pieces, delivery addresses, profile name, and concierge contact options together. Orders created while the customer is signed in are linked to that customer automatically; existing requests are linked by their matching account email when the migration is applied.

Apply the dashboard migration before deploying this release:

```bash
npx wrangler d1 migrations apply zari-orders --remote
```

The dashboard intentionally does not offer payment, order cancellation, email changes, or password resets yet. Those flows require a verified-email and payment-provider implementation so they can be handled safely.

## Getting Started

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
