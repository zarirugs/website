# ZARI pre-launch marketing

This directory is the operating system for growing `@zarirugs` before products launch.

## Goal

Reach the first 100 relevant followers in 30 days: interior designers, architects,
home-decor enthusiasts, collectors, and people interested in Indian craft.

The account should earn a follow through three things:

1. A distinctive point of view on timeless interiors.
2. A transparent look at building ZARI and working with Bhadohi's rug tradition.
3. Useful guidance about rugs, rooms, materials, and care.

## Weekly rhythm

- Tuesday: brand story or founder perspective.
- Thursday: useful, saveable interior or rug education.
- Saturday: craft, mood, or behind-the-scenes content.
- Stories: three to five informal updates per week, including one poll or question.
- Community: 20 minutes each weekday leaving thoughtful comments and replying to every genuine interaction.

The scheduled publisher runs at 19:30 India time on Tuesday, Thursday, and Saturday.
It publishes only entries in `queue.json` whose status is `approved` and whose
`publishAt` time has passed. Published IDs receive a Git tag, preventing the same
entry from being selected again.

## Once-a-week approval flow

1. Every Sunday at 11:00 India time, GitHub searches Pexels for a fresh pool of
   photographs, rejects low-resolution and previously used results, crops the
   selected files to 1080 × 1350, rotates the caption set, and prepares an isolated
   `codex/instagram-week-YYYY-MM-DD` branch. Website photography is not used as a
   recurring content source.
2. Pushing that branch makes GitHub open one weekly review pull request. Its review
   page shows the three visuals, full captions, calls to action, and publish times.
3. Review the pack once. To reject one image, comment `REJECT 1 — reason`,
   `REJECT 2 — reason`, or `REJECT 3 — reason` on the PR. Only that image is held
   and replaced; the others retain their accepted state. Merge only when all three
   are accepted.
4. Only content merged into `main` can be selected by the publisher. The scheduled
   workflow then publishes at 19:30 India time on Tuesday, Thursday, and Saturday.

At 12:30 India time each Sunday, the Codex weekly marketing review runs after the
stock workflow. It records the previous week's verified results, applies
`image-review-rubric.md` to every candidate and the three-image sequence, replaces
weak selections, adjusts queries and captions from the evidence, and leaves the
PR unmerged for approval. The next review includes what to repeat, what to stop,
and what the coming week is testing. It also appends the week's image scores,
accept/reject decisions, reasons, and later performance to
`image-score-history.csv`, so selection standards improve from evidence.

The content supply does not depend on the website library. Each week should use,
in order: new original founder/workshop media when available, newly licensed
photography with recorded provenance, and at most one generated editorial image
when neither source can express the idea. Generated work must be recorded as such,
must not depict a claimed ZARI product or real artisan, and must pass the same
visual review. A failed review blocks the pack instead of silently recycling an
old image.

Posts in a weekly review branch use `status: "approved"` because merging the branch
is the approval action. Posts still being developed outside a weekly review branch
must remain `draft`.

A specific approved post can be published sooner with the publishing workflow's
`post_id` input.

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
allows the Sunday workflow to open the approval PR; merging still remains a human
decision.

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

Founder voice, final factual review, and one weekly approval stay human. Stock
search, reuse prevention, cropping, credits, caption rotation, formatting,
validation, review-PR creation, scheduling, API publishing, duplicate prevention,
and the recurring content cycle are automated.

Track the weekly numbers in `metrics.csv`. Follower count matters for the first
milestone, but saves, shares, profile visits, replies, and qualified conversations
show whether the right audience is forming.
