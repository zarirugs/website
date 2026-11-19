/** Editable launch copy. Admin-authored descriptions take precedence. */
export const catalogueCopy: Record<string, string> = {
  "ZAR-HER-001": "A considered expression of traditional pattern. Explore the Heritage collection with our atelier and choose a piece around your room, palette and preferred dimensions.",
  "ZAR-CON-001": "Quiet geometry for contemporary interiors. Use the Contemporary collection as a starting point for a room-led conversation about scale, texture and colour.",
  "ZAR-BES-001": "A rug begins with your room. Share your dimensions, palette and design references with our atelier to develop a personal commission and receive a tailored quotation.",
};
export function catalogueDescription(sku: string, description: string | null) {
  const placeholder = !description || /^A hand-knotted (Heritage|Contemporary) rug\.$/.test(description) || description === "A bespoke consultation rug.";
  return placeholder ? catalogueCopy[sku] ?? description : description;
}
