/** Propose un slug à partir des prénoms : "Amélie" + "Yoan" → "amelieetyoan". */
export function suggestSlug(a: string, b: string): string {
  const clean = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const x = clean(a)
  const y = clean(b)
  return x && y ? `${x}et${y}` : x || y
}

export function normalizeSlug(value: string): string {
  return value
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
