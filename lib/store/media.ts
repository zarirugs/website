const widths = [640, 750, 828, 1080, 1200, 1920];
export function mediaWidth(src: string, width: number) {
  if (!/^\/api\/media\/[\w-]+(?:\?|$)/.test(src)) return src;
  const url = new URL(src, "https://zarirugs.com");
  url.searchParams.set("w", String(width));
  return url.pathname + url.search;
}
export function mediaSrcSet(src: string) {
  return mediaWidth(src, 640) === src ? undefined : widths.map((width) => `${mediaWidth(src, width)} ${width}w`).join(", ");
}
export function previewMedia(src: string) {
  return process.env.NODE_ENV === "development" && src.startsWith("/api/media/media-default-") ? `https://zarirugs.com${src}` : src;
}
