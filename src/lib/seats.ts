import type { Guest, RsvpStatus, TableRow } from '@/types/domain'

type SeatInput = Pick<Guest, 'rsvp_status' | 'allowed_companions' | 'confirmed_companions'>

/** Doit rester identique à la fonction SQL guest_seats(). */
export function guestSeats(g: SeatInput): number {
  if (g.rsvp_status === 'declined') return 0
  if (g.rsvp_status === 'confirmed') return 1 + g.confirmed_companions
  return 1 + g.allowed_companions
}

export function tableOccupancy(table: TableRow, guests: Array<SeatInput & { table_id: string | null }>) {
  const used = guests.filter((g) => g.table_id === table.id).reduce((sum, g) => sum + guestSeats(g), 0)
  return { used, free: table.capacity - used }
}

export const RSVP_LABEL: Record<RsvpStatus, string> = {
  pending: 'En attente', confirmed: 'Confirmé', declined: 'Décliné',
}
