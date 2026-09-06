# ZARI Operations Portal

This is a standalone Next.js/OpenNext Cloudflare Worker for `admin.zarirugs.com`.
It has its own admin-only session cookie and shares the `zari-orders` D1 database with the customer storefront.

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
