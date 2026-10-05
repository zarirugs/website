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
- Saturday: craft, mood, behind-the-scenes content, or one short Reel experiment.
- Stories: three to five informal updates per week, including one poll or question.
- Community: 20 minutes each weekday leaving thoughtful comments and replying to every genuine interaction.

The scheduled publisher runs at 19:30 India time on Tuesday, Thursday, and
Saturday. The queue supports both still images and Reels; begin with no more than
one Reel per week so its performance can be compared with still posts.
It publishes only entries in `queue.json` whose status is `approved` and whose
`publishAt` time has passed. Published IDs receive a Git tag, preventing the same
entry from being selected again.

Reels support an optional mixed audio track. Build one with
`npm run marketing:reel-draft -- --input=... --output=... --title=... --subtitle=... --audio=licensed-track.mp3`.
The default `--motion=smooth-push` uses an eased, oversampled move toward the rug
to prevent stepped or bouncy reframing. Adjust its travel with
`--motion-amount=0.16` (supported range: 0.08–0.25), or use `--motion=still` for
locked framing.
The default audio level is 22%; use `--audio-volume=0.18` or another value from 0
to 1 when the visual needs a quieter mix. Only use audio with documented commercial
rights. For a current English or Punjabi trend, select the track from the catalog
available inside the ZARI Instagram account and record the exact excerpt in the
weekly review.

## Once-a-week approval flow

1. At 12:30 India time each Sunday, the Codex marketing review records the previous
   week's verified results and prepares an isolated
   `codex/instagram-week-YYYY-MM-DD` branch.
2. The pack contains three posts and may include one Reel. Still images must pass
   `image-review-rubric.md`; Reels must pass `video-review-rubric.md` and play
   clearly without sound.
3. One approval pull request shows every visual, caption, score and publish time.
   Reject an item with a clear comment such as `REJECT 2 — reason` or
   `REJECT REEL 1 — reason`; only that item is replaced.
4. Merge only after all three posts are accepted. Only content merged into `main`
   can be selected by the Tuesday, Thursday and Saturday publisher.

The review records what to repeat, stop and test, then appends selection scores,
rejection reasons and later performance so the visual standard improves from
observed results. Start with no more than one Reel per week and compare its reach,
plays, retention, saves and profile visits with the still posts.

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
