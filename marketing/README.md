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

## Approval flow

1. Add the final public JPEG or MP4 to `public/marketing/instagram/`.
2. Add or revise its entry in `queue.json` with `status: "draft"`.
3. Run `npm run marketing:validate` and review the asset, caption, date, and CTA.
4. Change only the reviewed entry to `status: "approved"` and merge it to `main`.
5. The next scheduled run publishes it. A specific approved post can be published
   sooner with the workflow's `post_id` input.

Never commit access tokens. Add these GitHub Actions secrets to the repository:

- `INSTAGRAM_ACCOUNT_ID`
- `INSTAGRAM_ACCESS_TOKEN`

The Instagram account must be a Professional account. The Meta app needs Instagram
Login and the `instagram_business_basic` and
`instagram_business_content_publish` permissions. The workflow defaults to Graph
API `v26.0`; override it with the repository variable `INSTAGRAM_GRAPH_VERSION` if
Meta requires a later supported version.

## What remains human

Founder voice, original photographs/video, final factual review, and approval stay
human. Scheduling, eligibility checks, API publishing, duplicate prevention, and
the recurring content-planning cycle are automated.

Track the weekly numbers in `metrics.csv`. Follower count matters for the first
milestone, but saves, shares, profile visits, replies, and qualified conversations
show whether the right audience is forming.
