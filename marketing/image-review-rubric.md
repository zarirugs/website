# Instagram image review rubric

Codex applies this gate after automated sourcing and before the weekly pack is
presented for approval. Review the three images together as a feed sequence as
well as individually.

## Immediate rejection

Replace an image without scoring it if any of these are true:

- It appears AI-generated or contains distorted anatomy, impossible materials,
  repeated texture, synthetic lighting, or implausible architecture.
- It presents another maker's identifiable rug or workshop as a ZARI product or
  as documentary evidence from Bhadohi.
- It is generic luxury-interior filler with no clear relationship to rugs, craft,
  material, or the week's idea.
- It is culturally inaccurate, tokenising, unsafe, or disrespectful to artisans.
- It is below 1080 × 1350, visibly soft, badly cropped, watermarked, or missing
  its licence/source record.
- It has already appeared in `stock-usage.json`.
- It was copied from the ZARI website merely to fill a weekly slot; website assets
  may be used only when the week is intentionally revisiting that original story.

## Score each surviving image

Score every category from 1 to 5. An image must reach 21/25, score at least 4 in
both aesthetic strength and authenticity, and have no immediate-rejection
condition. The user's rejection always overrides the numeric score.

| Category | Review question |
| --- | --- |
| Aesthetic strength | Would this stop the right person in a premium fashion or interiors feed? |
| Brand relevance | Does it build ZARI's world of rugs, material, Indian craft, and considered homes? |
| Authenticity | Does it feel real, specific, culturally accurate, and free of synthetic details? |
| Story value | Does it add a clear idea instead of acting as decoration? |
| Technical execution | Is the crop deliberate, the subject clear, and the 1080 × 1350 file crisp and tonally controlled? |

Also score the complete three-image sequence from 1 to 5 for rhythm, visual
variety, colour balance, and narrative progression. The sequence must score 4 or
5 before it is presented for approval.

## Weekly learning loop

Before judging the next pack, record the previous week's verified signals in
`metrics.csv`. Compare follower growth, likes, comments and any available reach,
saves, shares, profile visits, story replies, and qualified conversations. Mark
unavailable metrics as unavailable; never estimate them.

Record the per-image scores, sequence score, user decisions, and rejection reasons
in `image-score-history.csv`. State three decisions in the new review:

1. What visual or topic should be repeated.
2. What should be stopped or changed.
3. What the new week tests.

Use Bluorng for product/process immediacy and feed rhythm, and Louis Vuitton for
campaign sequencing, human context, restraint, and confident crops. Do not copy
their campaigns, logos, layouts, or protected creative assets.

## Source order

1. New original ZARI founder, workshop, material, or process media.
2. Fresh licensed photography recorded in `stock-usage.json`.
3. At most one generated editorial image in a weekly pack, recorded as
   `provider: "generated"`. It cannot depict a supposed ZARI product, identifiable
   real artisan, documentary event, or factual workshop scene.

Do not reuse a source merely because it already exists in the website repository.
If no candidate reaches 21/25, leave the slot blocked for review.
