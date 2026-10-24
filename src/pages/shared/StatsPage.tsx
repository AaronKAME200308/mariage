import { useEffect, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { computeWeddingStats } from '@/lib/weddingStats'
import { listAllGuests, listRsvpResponses, listTables } from '@/services/guests'

// Palette catégorielle validée (slots 1 et 2) + gris neutre pour « en attente ».
const C = { confirmed: '#2a78d6', declined: '#eb6834', pending: '#8a8a82', free: '#dfe2da', grid: '#e5e7e0', axis: '#4b5247' }
const axisProps = { stroke: C.axis, fontSize: 12, tickLine: false } as const

function ChartCard({ title, summary, table, children }: { title: string; summary: string; table: { head: string[]; rows: Array<Array<string | number>> }; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
      <h2 className="text-2xl font-semibold text-forest">{title}</h2>
      <div role="img" aria-label={`${title} : ${summary}`} className="mt-4">{children}</div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-forest underline-offset-4 hover:underline">Afficher les données</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-ink-soft uppercase"><tr>{table.head.map((h) => <th key={h} scope="col" className="py-1 pr-4 font-medium">{h}</th>)}</tr></thead>
          <tbody>{table.rows.map((r, i) => <tr key={i} className="border-t border-forest/10">{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="py-1 pr-4 font-normal">{c}</th> : <td key={j} className="py-1 pr-4">{c}</td>)}</tr>)}</tbody>
        </table>
      </details>
    </section>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-2 font-serif text-5xl font-semibold text-forest">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  )
}

export default function StatsPage() {
  const { wedding } = useWedding()
  useEffect(() => { document.title = 'Statistiques — MariamCM' }, [])
  const state = useAsync(async () => {
    const [guests, tables, responses] = await Promise.all([listAllGuests(wedding.id), listTables(wedding.id), listRsvpResponses(wedding.id, 1000)])
    return computeWeddingStats(guests, tables, responses)
  }, [wedding.id])

  if (state.status === 'loading') return <Spinner />
  if (state.status === 'error') return <Alert>{state.error.message}</Alert>
  const s = state.data

  const rsvpData = [
    { name: 'Confirmés', value: s.confirmed, color: C.confirmed },
    { name: 'Absents', value: s.declined, color: C.declined },
    { name: 'En attente', value: s.pending, color: C.pending },
  ]
  const arrivedPct = s.expectedPeople > 0 ? Math.round((s.arrivedPeople / s.expectedPeople) * 100) : 0

  return (
    <>
      <PageHeader title="Statistiques" description="Calculées à partir des données réelles de votre mariage." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Invités" value={String(s.invitedGuests)} />
        <Tile label="Personnes attendues" value={String(s.expectedPeople)} sub="Hors invités ayant décliné" />
        <Tile label="Personnes entrées" value={String(s.arrivedPeople)} sub={`${s.arrivedGuests} invité${s.arrivedGuests > 1 ? 's' : ''} · ${arrivedPct} % des attendus`} />
        <Tile label="Sans table" value={String(s.unassignedPeople)} sub="Personnes à placer" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Réponses RSVP" summary={rsvpData.map((d) => `${d.name} ${d.value}`).join(', ')}
          table={{ head: ['Réponse', 'Invités'], rows: rsvpData.map((d) => [d.name, d.value]) }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rsvpData} layout="vertical" margin={{ left: 16, right: 24 }}>
              <CartesianGrid horizontal={false} stroke={C.grid} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="name" width={90} {...axisProps} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} formatter={(v) => [`${v} invité${Number(v) > 1 ? 's' : ''}`, '']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                {rsvpData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Réponses par jour" summary={s.responsesPerDay.length ? `${s.responsesPerDay.length} jour(s) avec des réponses` : 'aucune réponse'}
          table={{ head: ['Jour', 'Réponses'], rows: s.responsesPerDay.map((d) => [d.day, d.count]) }}>
          {s.responsesPerDay.length === 0 ? <p className="py-16 text-center text-sm text-ink-soft">Aucune réponse reçue pour le moment.</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={s.responsesPerDay} margin={{ left: 0, right: 16 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="day" {...axisProps} />
                <YAxis allowDecimals={false} width={32} {...axisProps} />
                <Tooltip formatter={(v) => [`${v} réponse${Number(v) > 1 ? 's' : ''}`, '']} />
                <Line type="monotone" dataKey="count" stroke={C.confirmed} strokeWidth={2} dot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: C.confirmed }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="xl:col-span-2">
          <ChartCard title="Occupation des tables" summary={s.tables.length ? s.tables.map((t) => `${t.name} ${t.used}/${t.capacity}`).join(', ') : 'aucune table'}
            table={{ head: ['Table', 'Occupées', 'Capacité'], rows: s.tables.map((t) => [t.name, t.used, t.capacity]) }}>
            {s.tables.length === 0 ? <p className="py-16 text-center text-sm text-ink-soft">Aucune table créée.</p> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={s.tables} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid vertical={false} stroke={C.grid} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis allowDecimals={false} width={32} {...axisProps} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Legend />
                  <Bar dataKey="used" name="Places occupées" stackId="a" fill={C.confirmed} stroke="#fff" strokeWidth={2} />
                  <Bar dataKey="free" name="Places libres" stackId="a" fill={C.free} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </>
  )
}
