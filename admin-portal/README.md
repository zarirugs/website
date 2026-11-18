# ZARI Operations Portal

This is a standalone Next.js/OpenNext Cloudflare Worker for `admin.zarirugs.com`.
It has its own admin-only session cookie and shares the `zari-orders` D1 database with the customer storefront.

## Storefront media library

The dashboard includes a **Storefront media** library. Each item has a name and optional description, and can be created from an uploaded image or MP4 video, an external media link, or a hex colour. Videos can be assigned to the Homepage hero; images and colours remain available for the other placements. The original hero image stays in the library so the homepage can be switched back at any time.

Uploaded files are stored in the shared Cloudflare R2 bucket. Create it once before the first deploy:

```sh
npx wrangler r2 bucket create zari-media --location apac
```

Both the storefront and this portal declare the same `ZARI_MEDIA` bucket binding. The deployment workflow applies `0005_site_media_library.sql` automatically.

## Local preview

From this directory:

```sh
npm run dev -- --port 3001
```

For first-time local setup, `.dev.vars` supplies a local-only bootstrap value. It is ignored by Git.

## Production release

Run these commands from `admin-portal/`. They deliberately target the portal Worker and the existing production D1 database.

```sh
npx wrangler d1 migrations apply zari-orders --remote --config wrangler.jsonc
npx wrangler secret put ADMIN_BOOTSTRAP_TOKEN --config wrangler.jsonc
npm run deploy:cloudflare
```

Choose a long, random bootstrap token in the interactive secret prompt. Do not commit or share it. After deployment, visit `https://admin.zarirugs.com/bootstrap` once to create the owner account with that token. The portal stores only a password hash and an HttpOnly admin-session cookie.

Once the owner account has been created, remove the bootstrap secret:

```sh
npx wrangler secret delete ADMIN_BOOTSTRAP_TOKEN --config wrangler.jsonc
```

`wrangler.jsonc` declares `admin.zarirugs.com` as a Cloudflare Custom Domain. The `zarirugs.com` zone must be active in the same Cloudflare account, and the hostname must not already have a CNAME record.

## Interface and quality checks

The portal reuses `../styles/tokens.css` and locally bundled Inter, Cormorant Garamond and Prata fonts to match the storefront. Shared workspace controls and feedback live in `components/workspace.module.css`, `AdminShell.tsx` and `Feedback.tsx`; authentication shares `AuthFrame.tsx`.

The dashboard supports `/dashboard` and `?view=categories`, `?view=media`, `?view=orders`. Category/product editing remains under `/dashboard/categories/[id]`.

Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build:cloudflare` from this directory. Tests use in-memory SQLite and mocked storage, with no production credentials. Node.js 24 is used by CI.

See [the quality review](docs/portal-quality-review.md) for findings, validation and desktop/mobile screenshots.
