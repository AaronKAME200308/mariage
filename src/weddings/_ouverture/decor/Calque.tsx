/**
 * Papier calque translucide enroulé sur l'enveloppe. Il ne bloque pas les clics ;
 * il glisse sur le côté à l'ouverture (data-p="calque").
 */
export default function Calque() {
  return (
    <div
      data-p="calque"
      data-piece-calque
      aria-hidden
      className="pointer-events-none absolute -inset-[3%] z-[7]"
      style={{
        clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 26% 100%, 44% 62%, 56% 30%)',
        background:
          'linear-gradient(112deg, rgb(255 255 255 / .55) 0%, rgb(255 255 255 / .1) 22%, rgb(255 255 255 / .38) 40%, rgb(255 255 255 / .08) 62%, rgb(255 255 255 / .3) 100%)',
        backdropFilter: 'blur(1.2px) brightness(1.15)',
        WebkitBackdropFilter: 'blur(1.2px) brightness(1.15)',
        filter: 'drop-shadow(0 6px 10px rgb(0 0 0 / .35))',
      }}
    >
      {/* Plis du papier */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(104deg, transparent 45%, rgb(255 255 255 / .45) 46%, transparent 48%), linear-gradient(98deg, transparent 63%, rgb(0 0 0 / .08) 64%, rgb(255 255 255 / .3) 65.5%, transparent 68%), linear-gradient(120deg, transparent 78%, rgb(255 255 255 / .35) 79%, transparent 81%)',
        }}
      />
    </div>
  )
}
