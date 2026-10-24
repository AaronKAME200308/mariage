# Pages de mariage écrites à la main

Pour chaque mariage, vous pouvez écrire la page vous-même en React, **dans un dossier à part, un fichier par section**. Sans dossier, le mariage garde le site généré automatiquement (Personnalisation).

## Voir l'exemple
`npm run dev` puis ouvrez **http://localhost:5173/exemples/mariage** : mariage fictif d'Awa & Jean (données de démonstration, formulaires désactivés). Son code est dans `src/weddings/exemple-awa-et-jean/` : une page unique qui défile, avec un fichier par section (`Menu`, `Hero`, `Histoire`, `Programme`, `InfosPratiques` — section propre à ce mariage —, `Galerie`, `Rsvp`, `Cadeaux`, `LivreOr`, `Pied`) et un `style.css` à lui. Toutes les sections sont assemblées dans `index.tsx` et sont reliées par des ancres (`#histoire`, `#rsvp`…).

## Créer la page d'un mariage
1. Créez le mariage dans l'administration (le **slug** compte : `awa-et-jean`).
2. Dans le projet : `npm run nouveau-mariage -- awa-et-jean`
3. Éditez `src/weddings/awa-et-jean/` puis `npm run dev` → `http://localhost:5173/awa-et-jean`.
4. Déployez (build + mise en ligne) à chaque modification : ce sont des fichiers du projet.

## Comment la page est liée à la base de données
1. Vous créez le mariage dans l'admin : une ligne est enregistrée dans la table `weddings` avec son **slug**.
2. Vous créez le dossier `src/weddings/<slug>/` : le **nom du dossier est le lien** avec cette ligne. La fiche du mariage (admin) indique si la page est détectée.
3. Quand un visiteur ouvre `/<slug>`, l'application charge la ligne par le slug (mariage publié) puis affiche votre page avec les données de la base (programme, histoire, galerie, cadeaux, livre d'or). Le RSVP et le livre d'or écrivent dans la base.
4. Seuls ces contenus sont en base. **Les textes que vous écrivez dans les fichiers ne sont pas dans la base** : ils sont dans le code, et une modification demande un redéploiement. Sans ligne `weddings` publiée portant ce slug, la page n'est pas affichée.

## Structure d'un dossier
```
src/weddings/awa-et-jean/
  index.tsx            ordre des sections (réordonnez, supprimez, ajoutez)
  sections/
    Hero.tsx  Histoire.tsx  Programme.tsx  Galerie.tsx
    Rsvp.tsx  Cadeaux.tsx   LivreOr.tsx    Pied.tsx
```
Ajouter une section : créez `sections/Menu.tsx` (`export default function Menu() { … }`), importez-la dans `index.tsx`. Vous pouvez aussi ajouter vos images dans `public/awa-et-jean/` (`<img src="/awa-et-jean/photo.jpg" />`) ou vos styles dans un `style.css` importé par `index.tsx`.

## Ce que vous pouvez utiliser (`import … from '../_kit'`)
| Outil | Rôle |
|---|---|
| `useSite()` | données du mariage : `wedding`, `names`, `data.events`, `data.milestones`, `data.gallery`, `data.gifts`, `data.guestbook`, `content`, `theme`, `settings`, `preview` |
| `Section` | bloc de section (titre, filet, fond) |
| `Intro`, `Musique` | enveloppe d'introduction et lecteur de musique |
| `Countdown` | compte à rebours (rendu libre : `{(v) => …}`) |
| `RsvpForm`, `GuestbookBlock` | RSVP et livre d'or **branchés à la base** |
| `GalleryBlock`, `GiftsBlock` | galerie avec visionneuse, liste de cadeaux |
| `formatDate`, `formatTime`, `imageUrl` | utilitaires |

Les variables `--w-primary`, `--w-secondary`, `--w-bg`, `--w-accent`, `--w-text`, `--w-heading` viennent de « Personnalisation » ; utilisables en Tailwind (`bg-(--w-primary)`), ou remplacez-les par vos propres couleurs.

## Ce qui reste géré par l'application
Invités, RSVP, tables, QR, livre d'or (modération), cadeaux, galerie, programme et histoire restent saisis dans les tableaux de bord : votre page les **affiche**. Le RSVP et le livre d'or passent par les mêmes RPC sécurisées que le site généré (validation, limitation de débit, modération). Un mariage doit être publié (ou ouvert avec `?apercu=1` par un gestionnaire) pour que sa page s'affiche.

## Règles à respecter
- Le dossier porte **exactement le slug** du mariage. Les dossiers commençant par `_` (`_kit`, `_modele`) ne sont jamais servis.
- Ne pas écrire de faire-part numérique (aucune génération/téléchargement/envoi d'invitation) : règle du projet.
- N'affichez jamais de données privées (liste d'invités, QR) dans une page publique ; passez uniquement par `useSite()` et les blocs du kit.
- Le code de vos pages est du code de votre application : relisez-le comme tel (pas de `dangerouslySetInnerHTML` avec du texte venant de visiteurs).
- Les pages écrites à la main s'ajoutent au bundle : chaque page est chargée à la demande (lazy), seul le mariage visité est téléchargé.
