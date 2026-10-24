// Conversions entre « heure murale » d'un fuseau (saisie datetime-local) et instants UTC (timestamptz).

function wallTimeAsUtc(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
}

/** "2027-03-14T15:30" (heure du fuseau) → ISO UTC. Retourne null si vide ou invalide. */
export function localInputToIso(value: string, timeZone: string): string | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!m) return null
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  let guess = asUtc
  // Deux passes pour absorber les changements d'heure.
  for (let i = 0; i < 2; i++) {
    guess = asUtc - (wallTimeAsUtc(new Date(guess), timeZone) - guess)
  }
  return new Date(guess).toISOString()
}

/** ISO UTC → "YYYY-MM-DDTHH:mm" dans le fuseau (valeur d'un input datetime-local). */
export function isoToLocalInput(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const w = new Date(wallTimeAsUtc(d, timeZone))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${w.getUTCFullYear()}-${p(w.getUTCMonth() + 1)}-${p(w.getUTCDate())}T${p(w.getUTCHours())}:${p(w.getUTCMinutes())}`
}

export function formatDateTime(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone }).format(new Date(iso))
}

export function formatTime(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(iso))
}

export const TIMEZONES = [
  'Africa/Douala', 'Africa/Lagos', 'Africa/Libreville', 'Africa/Kinshasa', 'Africa/Abidjan', 'Africa/Dakar',
  'Africa/Casablanca', 'Europe/Paris', 'Europe/Brussels', 'Europe/London', 'America/Toronto', 'America/New_York', 'UTC',
]
