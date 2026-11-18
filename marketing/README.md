# ZARI pre-launch marketing

This directory is the operating system for growing `@zarirugs` before products launch.

## Goal

Reach the first 100 relevant followers in 30 days: interior designers, architects,
home-decor enthusiasts, collectors, and people interested in Indian craft.

The account should earn a follow through three things:

1. A distinctive point of view on timeless interiors.
2. A transparent look at building ZARI and working with Bhadohi's rug tradition.
3. Useful guidance about rugs, rooms, materials, and care.

## Weekly publishing policy

Schedule up to four feed posts per Monday–Sunday week in Asia/Kolkata. The
default slots are Monday, Wednesday, Friday, and Saturday at 19:30 IST, with
two educational/informative posts and two trend-led posts. The queue allocator
uses the next available slot and moves overflow into a later week. It creates
a reservation only for accepted content.

The policy lives in `posting-policy.json`. All feed formats share the four-post
cap. The publisher checks the live Instagram feed before publishing, including
posts made outside GitHub, and maintains one automated post per India date.

## Approve once in chat

When the user says **“this is good to post”** for an identified post, that is
final approval to schedule and publish it. The scheduling agent records the
approved media, caption, category, approval wording, and media hash in the queue.
It releases the accepted post to main within the existing repository checks.
A separate human PR review is unnecessary for that accepted content.

Use a candidate JSON containing `id`, `mediaType`, `mediaUrl`, `caption`, and
`contentCategory` (`education` or `trend`). The approved media must exist under
`public/marketing/instagram/` and its public URL must use `https://zarirugs.com`.

```sh
npm run marketing:schedule -- --post /path/to/candidate.json --approval "this is good to post" --dry-run
npm run marketing:schedule -- --post /path/to/candidate.json --approval "this is good to post"
npm run marketing:test
npm run marketing:validate
```

The helper preserves the queue and treats repeated scheduling of the same
accepted future post as the same reservation. Fetch current main and publication
tags before allocating. If a push loses a race, recompute the slot from the new
queue before releasing it.

## Publishing and recovery

GitHub Actions checks for due content every half-hour. The timestamp in the queue
is the target time. Actual publication depends on Actions availability and media
processing. Relevant main pushes run a read-only connection/feed check.

Only approved, due content can publish. Manual selection also follows the due
time, daily spacing, and weekly limit. A container checkpoint is pushed before
the final publish request so a retry can inspect the same container. Publication
tags continue to prevent reusing a published post ID.

The policy takes effect on 18 November 2026. Older queued entries remain available
for historical review and explicit rescheduling. The first failed legacy video
returned HTTP 404 because an oversized asset had blocked deployment.

Before publication, the public media URL must respond with the expected media
type and the approved bytes. Finish deployment and verify that URL when handing
off a scheduled post. Queue validation rejects media larger than Cloudflare's
25 MiB per-file hosting limit before deployment.

Reels marked `publishingMode: "instagram-native-music"` use Instagram's native
music/scheduling interface. Their queue reservation counts toward weekly
capacity, and the live feed check also sees posts published outside GitHub.

## Draft supply and review

The stock preparation workflow supplies draft candidates and retains existing
queue entries. Its preview PR lets the user inspect those candidates. Each
accepted post is then scheduled through chat approval. Review only the affected
post when the user requests a correction.

Use new original founder/workshop media where available, then freshly licensed
photography with recorded provenance or clearly identified original illustrations.
Track image identities and quality review in the production records.

Never commit access tokens. Add these GitHub Actions secrets to the repository:

- `INSTAGRAM_ACCOUNT_ID`
- `INSTAGRAM_ACCESS_TOKEN`
- `PEXELS_API_KEY`

Create the free Pexels API key at `https://www.pexels.com/api/`. The sourcing
script records the photo ID, photographer, source page, search query, week, and
local filename privately in `stock-usage.json`. Pexels attribution is optional,
so sources do not appear in the public caption or the approval page. Search themes
and caption rotations live in `stock-sourcing.json`.

The repository owner must also enable **Settings → Actions → General → Workflow
permissions → Allow GitHub Actions to create and approve pull requests**. This
allows the stock workflow to open a preview PR. Posting approval is recorded in chat.

The stock workflow intentionally uses Pexels for materialized post files.
Unsplash's API requires direct CDN hotlinking, attribution to both the photographer
and Unsplash, and a download-tracking request when an image is selected. Do not
download Unsplash API results into this repository. An Unsplash provider should
only be added if the publishing queue is extended to preserve those requirements.

The Instagram account must be a Professional account. The Meta app needs Instagram
Login and the `instagram_business_basic` and
`instagram_business_content_publish` permissions. The workflow defaults to Graph
API `v26.0`; override it with the repository variable `INSTAGRAM_GRAPH_VERSION` if
Meta requires a later supported version.

## What remains human

The user accepts each finished post in chat. Sourcing, review preparation, queue
allocation, deployment checks, and API publication follow the production and
scheduling workflows. The chat approval authorizes the identified release.

Track the weekly numbers in `metrics.csv`. Follower count matters for the first
milestone, but saves, shares, profile visits, replies, and qualified conversations
show whether the right audience is forming.
