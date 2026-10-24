# Page d'ouverture « enveloppe » (thème Royal Ascot : noir et blanc)

Enveloppe noire en 3D qui s'ouvre sur une carte ivoire, puis révèle le site. C'est une **animation d'introduction du site** : la carte affiche seulement les noms, la date, l'heure et le lieu, et ne peut être ni téléchargée, ni partagée, ni envoyée.

Tout est dessiné par le code (SVG/CSS + Motion) : **aucune image à fournir**.

## Intégration (2 étapes)
1. Le dossier `_ouverture/` doit se trouver dans `src/weddings/` (à côté de `_kit/`).
2. Dans `src/weddings/<slug>/index.tsx`, remplacez `<Intro />` par `<Ouverture />` :

```tsx
import Ouverture from '../_ouverture'

export default function Page() {
  return (
    <>
      <Ouverture config={{ initiales: ['A', 'J'] }} />
      {/* … vos sections … */}
    </>
  )
}
```
Les noms, la date, l'heure et le lieu sont lus automatiquement dans le mariage (base de données : date du mariage, premier événement du programme). Vous n'avez donc rien à recopier.

## Options (`config`, toutes facultatives)
| Option | Rôle | Par défaut |
|---|---|---|
| `initiales` | monogramme du sceau `['A','J']` | initiales des prénoms |
| `formule` | ligne au-dessus des noms | « Ensemble avec leurs familles » |
| `invitation` | ligne sous les noms | « vous invitent à leur mariage » |
| `heure`, `lieu`, `ville` | texte libre sous la date | heure et lieu du 1er événement |
| `filigrane` | grands chiffres pâles JJ MM AA | `true` |
| `indice`, `boutonEntrer`, `boutonPasser` | textes des boutons | « Touchez le sceau », « Entrer », « Passer » |
| `suivreReglageAdmin` | respecter le réglage « enveloppe d'introduction » de Personnalisation | `false` |
| `couleurs` | `fond`, `enveloppe`, `carte`, `encre`, `cire`, `cireClair`, `cireOmbre`, `doublureClair`, `doublureSombre` | noir / ivoire / cire blanc nacré |

Exemple cire noire : `couleurs: { cire: '#2b2b2b', cireClair: '#6a6a6a', cireOmbre: '#0d0d0d', encre: '#e9e5db' }` (l'encre du monogramme est alors claire ; mettez `carte` et `encre` distincts si besoin).

## Contenu du dossier
```
_ouverture/
  index.tsx      déroulé de l'animation (sceau → calque → rabat → carte → entrée)
  config.ts      options et couleurs par défaut
  Carte.tsx      la carte ivoire (noms, date en grand, filigrane, lieu)
  decor/
    Dos.tsx        fond de l'enveloppe
    Poche.tsx      face avant (3 plis en « V »)
    Rabat.tsx      rabat 3D, doublure pied-de-poule
    Sceau.tsx      sceau de cire en relief, avec fissure en deux moitiés
    Calque.tsx     papier calque translucide
    Gypsophile.tsx brins de gypsophile (dessin généré)
    grain.ts       grain de papier généré par le code
```

## Comportement
- Toucher le sceau : il se fend, le calque glisse, le rabat se retourne (doublure visible), la carte sort puis s'agrandit ; bouton « Entrer » (≈ 5 s).
- « Passer » est toujours visible ; Entrée/Espace sur le sceau ouvre l'enveloppe au clavier.
- Si l'appareil demande moins d'animations (`prefers-reduced-motion`), l'enveloppe est sautée.
- Pas de son, pas de lecture automatique. Le défilement de la page est bloqué pendant l'ouverture, puis rétabli.
- Taille : l'enveloppe est portrait (ratio A7) et limitée à 62 % de la hauteur de l'écran ; la carte se met à l'échelle de l'écran à la fin.

## À savoir (non vérifié visuellement)
Ce code compile (TypeScript) mais **je ne l'ai pas encore regardé tourner dans un navigateur** : les proportions, l'ombrage du rabat, l'aspect du papier calque et le rendu sur petits téléphones sont à contrôler et à ajuster (positions en pourcentages dans `index.tsx`, `Poche.tsx`, `Rabat.tsx`, `Calque.tsx`). La fissure du sceau, l'ordre de superposition pendant la sortie de la carte et la police Playfair/Cormorant/Montserrat (chargées par `index.html`) sont les points les plus sensibles.
