import { guestSeats } from '@/lib/seats'
import type { Guest, RsvpResponseRow, TableRow } from '@/types/domain'

export interface WeddingStats {
  invitedGuests: number
  confirmed: number
  declined: number
  pending: number
  expectedPeople: number // personnes attendues : confirmés (avec accompagnants) + en attente (places réservées)
  confirmedPeople: number
  arrivedGuests: number
  arrivedPeople: number
  tables: Array<{ name: string; capacity: number; used: number; free: number }>
  unassignedPeople: number
  responsesPerDay: Array<{ day: string; count: number }>
}

export function computeWeddingStats(guests: Guest[], tables: TableRow[], responses: RsvpResponseRow[]): WeddingStats {
  const confirmedList = guests.filter((g) => g.rsvp_status === 'confirmed')
  const perDay = new Map<string, number>()
  for (const r of responses) {
    const day = r.created_at.slice(0, 10)
    perDay.set(day, (perDay.get(day) ?? 0) + 1)
  }
  return {
    invitedGuests: guests.length,
    confirmed: confirmedList.length,
    declined: guests.filter((g) => g.rsvp_status === 'declined').length,
    pending: guests.filter((g) => g.rsvp_status === 'pending').length,
    expectedPeople: guests.reduce((s, g) => s + guestSeats(g), 0),
    confirmedPeople: confirmedList.reduce((s, g) => s + guestSeats(g), 0),
    arrivedGuests: guests.filter((g) => g.arrived_count > 0).length,
    arrivedPeople: guests.reduce((s, g) => s + g.arrived_count, 0),
    tables: tables.map((t) => {
      const used = guests.filter((g) => g.table_id === t.id).reduce((s, g) => s + guestSeats(g), 0)
      return { name: t.name, capacity: t.capacity, used, free: Math.max(0, t.capacity - used) }
    }),
    unassignedPeople: guests.filter((g) => !g.table_id).reduce((s, g) => s + guestSeats(g), 0),
    responsesPerDay: [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, count]) => ({ day, count })),
  }
}
