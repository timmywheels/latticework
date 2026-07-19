// Auto-discovered thinker portraits: drop a `<slug>.png` in src/assets/busts and
// it becomes available everywhere a thinker is shown. Slugs without a file simply
// have no portrait (callers fall back to a placeholder).
const FILES = import.meta.glob('../assets/busts/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export const PORTRAIT_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [
    path.split('/').pop()!.replace('.png', ''),
    url,
  ]),
)

export function portraitFor(slug: string): string | undefined {
  return PORTRAIT_BY_SLUG[slug]
}
