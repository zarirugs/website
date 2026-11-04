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

- Every day: one single-image feed post at 12:45 IST and one Reel at 19:45 IST.
- Vary the visual premise across the week: rug detail, room styling, colour,
  proportion, craft context, moving room reveals, and editorial atmosphere.
- Sunday: review verified results and prepare the next weekly approval PR while
  the normal image and Reel slots continue to publish.
- Stories: three to five informal updates per week, including one poll or question.
- Community: 20 minutes each weekday leaving thoughtful comments and replying to every genuine interaction.

The scheduled publisher has two daily slots: one IMAGE at 12:45 IST and one REELS
post at 19:45 IST. Each slot has a one-hour retry. A run is restricted to its
media type and India-local date, so a missed image run cannot consume the Reel
slot, and a retry cannot publish a second post after the first has been tagged.
The normal weekly cycle prepares both formats for every day. Merge its PR to
approve; only entries in `queue.json` with `status: "approved"` can publish.
Published IDs receive a Git tag to prevent duplicate publication.

Reels marked `publishingMode: "instagram-native-music"` are excluded from the
Graph API publisher. Confirm the named track in the ZARI account's Instagram
music picker and schedule those Reels manually in Instagram; the repository MP4
contains no commercial recording.

## Once-a-week approval flow

1. Every Sunday, the weekly cycle records only verified results from the week,
   identifies the strongest and weakest posts, and turns those findings into a
   Monday–Saturday plan. It prepares fresh media and an isolated
   `codex/instagram-week-YYYY-MM-DD` branch. Website photography is not used as a
   recurring content source.
2. Pushing that branch opens one weekly review pull request. Its review page shows
   all 14 daily image and Reel slots with previews, captions, source details,
   music rights, scores, and publish times.
3. Review the complete pack once. Reject any slot by naming its day and format in
   a PR comment. Do not merge until each image and Reel passes its rubric.
4. Only content merged into `main` can be selected by the publisher. The scheduled
   workflow publishes one image at 12:45 IST and one Reel at 19:45 IST daily.

At 12:30 India time each Sunday, the Codex weekly marketing review records the
previous week's verified results, applies the image and Reel rubrics to every
candidate, replaces weak selections, adjusts concepts and captions from the
evidence, and leaves the PR unmerged for approval. The review includes what to
repeat, what to stop, and what the coming week is testing. It also records image
and Reel scores, accept/reject decisions, reasons, and later performance so
selection standards improve from evidence.

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
