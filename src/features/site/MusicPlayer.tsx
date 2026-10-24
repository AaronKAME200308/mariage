import { useRef, useState } from 'react'
import { Music2, Pause, Play } from 'lucide-react'

/** Lecture lancée uniquement sur action de l'utilisateur ; état et erreurs visibles. */
export function MusicPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<'idle' | 'playing' | 'paused' | 'error'>('idle')

  async function toggle() {
    const audio = ref.current
    if (!audio) return
    if (state === 'playing') {
      audio.pause()
      setState('paused')
      return
    }
    try {
      await audio.play()
      setState('playing')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex items-center gap-3 rounded-full bg-white/95 py-2 pr-4 pl-2 shadow-lg ring-1 ring-black/5">
      <audio ref={ref} src={src} loop preload="none" onError={() => setState('error')} onEnded={() => setState('paused')} />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={state === 'playing'}
        aria-label={state === 'playing' ? 'Mettre la musique en pause' : 'Lancer la musique'}
        className="grid size-11 place-items-center rounded-full bg-(--w-primary) text-white"
      >
        {state === 'playing' ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
      </button>
      <span role="status" className="flex items-center gap-1.5 text-xs text-(--w-text)">
        <Music2 className="size-4" aria-hidden />
        {state === 'playing' ? 'Musique en cours' : state === 'error' ? 'Musique indisponible' : 'Musique'}
      </span>
    </div>
  )
}
