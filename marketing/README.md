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

1. Every Monday morning, the Codex scheduled task prepares the next three posts in
   an isolated `codex/instagram-week-YYYY-MM-DD` branch.
2. Pushing that branch makes GitHub open one weekly review pull request. Its review
   page shows the three visuals, full captions, calls to action, and publish times.
3. Review the pack once. Leave a PR comment if anything needs revision, or merge
   the PR to approve the entire week.
4. Only content merged into `main` can be selected by the publisher. The scheduled
   workflow then publishes at 19:30 India time on Tuesday, Thursday, and Saturday.

Posts in a weekly review branch use `status: "approved"` because merging the branch
is the approval action. Posts still being developed outside a weekly review branch
must remain `draft`.

A specific approved post can be published sooner with the publishing workflow's
`post_id` input.

Never commit access tokens. Add these GitHub Actions secrets to the repository:

- `INSTAGRAM_ACCOUNT_ID`
- `INSTAGRAM_ACCESS_TOKEN`

The Instagram account must be a Professional account. The Meta app needs Instagram
Login and the `instagram_business_basic` and
`instagram_business_content_publish` permissions. The workflow defaults to Graph
API `v26.0`; override it with the repository variable `INSTAGRAM_GRAPH_VERSION` if
Meta requires a later supported version.

## What remains human

Founder voice, original photographs/video, final factual review, and one weekly
approval stay human. Drafting, formatting, validation, review-PR creation,
scheduling, API publishing, duplicate prevention, and the recurring content cycle
are automated.

Track the weekly numbers in `metrics.csv`. Follower count matters for the first
milestone, but saves, shares, profile visits, replies, and qualified conversations
show whether the right audience is forming.
