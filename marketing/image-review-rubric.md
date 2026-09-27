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

Score each category from 0 to 3. An image must score at least 12/15 and have no
immediate-rejection condition.

| Category | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Authenticity | Synthetic or misleading | Staged/generic | Believable | Observational and specific |
| ZARI relevance | Unrelated | Decorative association | Clear rug/craft link | Advances the week's brand story |
| Editorial strength | Weak stock framing | Familiar stock image | Strong crop or moment | Distinctive fashion-editorial frame |
| Feed contribution | Repeats another post | Minor variation | Useful contrast | Makes the three-post sequence stronger |
| Technical quality | Unusable | Noticeable defects | Publishable | Excellent detail, crop and tonal range |

## Weekly learning loop

Before judging the next pack, record the previous week's verified signals in
`metrics.csv`. Compare follower growth, likes, comments and any available reach,
saves, shares, profile visits, story replies, and qualified conversations. Mark
unavailable metrics as unavailable; never estimate them.

State three decisions in the new review:

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
If no candidate reaches 12/15, leave the slot blocked for review.
