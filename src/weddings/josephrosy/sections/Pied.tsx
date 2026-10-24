import { useSite } from '../../_kit'

export default function Pied() {
  const { names } = useSite()
  return (
    <footer className="px-6 py-10 text-center text-sm text-(--w-text)/60">
      <p className="font-(family-name:--w-heading) text-2xl text-(--w-primary)">{names}</p>
    </footer>
  )
}
