# MariamCM

Plateforme de création de **sites web de mariage** et de gestion des invités, avec contrôle d'accès par QR codes individuels.
MariamCM ne crée, ne génère, n'exporte et n'envoie **aucun faire-part numérique** : les QR codes servent uniquement au contrôle d'accès.

Stack : React 19 · TypeScript · Vite · Tailwind CSS 4 · Motion · Supabase (Auth, PostgreSQL, Storage).

## État d'avancement

| Phase | Contenu | État |
|---|---|---|
| 1 | Fondations : design system, site public, migrations, auth, rôles, RLS | **Fait** (voir limites ci-dessous) |
| 2 | Gestion des mariages, site public complet (enveloppe, hero, programme, galerie…), personnalisation | **Fait** (non testé sur un projet Supabase réel, voir limites) |
| 3 | Invités, RSVP, tables, affichage des QR codes, statistiques | **Fait** (non testé sur un projet Supabase réel) |
| 4 | Dashboard hôtesse, scanner mobile | **Fait** (non testé avec une vraie caméra ni sur Supabase réel) |
| 5 | Livre d'or, cadeaux, musique, SEO, déploiement | **Fait** (sauf tests d'interface, voir limites) |

### Phase 2 : ce qui a été ajouté
- **Admin** (`/admin`) : vue d'ensemble avec statistiques réelles et activité récente ; liste, création (slug suggéré, vérification du format et des slugs réservés) et édition des mariages ; publication, dépublication, archivage, restauration avec confirmations ; suppression ; comptes mariés/hôtesses via Edge Function ; accès aux écrans de contenu de chaque mariage.
- **Mariés** (`/couple`) : vue d'ensemble (compte à rebours, statut, aperçu), personnalisation avec aperçu en direct (couleurs, police, textes, photo principale, musique avec confirmation des droits, sections visibles, paramètres RSVP et livre d'or), histoire, programme, galerie (envoi multiple, légendes, ordre, suppression).
- **Site public** (`/:slug`) : enveloppe d'introduction animée (avec bouton « Passer »), hero avec compte à rebours calculé sur la vraie date, lecteur de musique sans lecture automatique, histoire, programme, galerie avec lightbox, RSVP, livre d'or modéré, liste de cadeaux (affichage). Un brouillon n'est visible que par ses gestionnaires via `?apercu=1`.
- **Edge Function** `supabase/functions/admin-manage-users` : création sécurisée des comptes (voir ci-dessous).

### Phase 3 : ce qui a été ajouté
- **Invités** (`/couple/invites`, `/admin/mariages/:id/invites`) : liste paginée avec recherche, filtres et tri côté serveur, création/modification/suppression, import et export CSV (protection contre l'injection de formules), QR individuel affiché à l'écran (révocation, renouvellement, annulation d'arrivée avec confirmation).
- **Tables** : capacité, occupation, affectation des invités (la capacité est imposée par la base).
- **RSVP** : réponses reçues et invités en attente. **Statistiques** : graphiques avec alternative tableau.
- Les QR codes sont **affichés uniquement** pour le contrôle d'accès : aucun téléchargement ni envoi. L'URL encodée `/acces/:jeton` sera servie par le scanner (phase 4).

### Phase 4 : ce qui a été ajouté
- **Espace hôtesse** (`/hotesse`, `/hotesse/:id`) : liste des mariages attribués, scanner QR (caméra activée uniquement sur clic, pause pendant la vérification, message explicite si caméra refusée/absente/occupée), résultat plein écran (autorisé / déjà entré / décliné / révoqué / inconnu / autre mariage / mariage fermé), recherche par nom en secours (`perform_check_in_by_guest`), progression (arrivés / attendus) et 15 derniers contrôles, rafraîchis toutes les 20 s.
- **`/acces/:jeton`** : URL encodée dans les QR. Sans compte autorisé, page neutre sans donnée personnelle. Hôtesse connectée : bouton « Valider l'entrée » (jamais de contrôle automatique au chargement).
- Toute la logique de décision (doublons, RSVP, nombre de personnes, mariage) reste dans la base ; l'interface ne fait qu'afficher le résultat.
- Le nombre de personnes enregistré par défaut est celui confirmé (ou, sans réponse, le maximum autorisé) ; l'annulation d'une arrivée erronée se fait côté mariés/admin (fiche invité).
- Le scan par caméra exige **https** (sauf localhost) et un navigateur récent.

### Phase 5 : ce qui a été ajouté
- **Livre d'or** (`…/livre-d-or`) : modération (publier, refuser, supprimer) par onglets ; textes affichés en texte brut.
- **Cadeaux** (`…/cadeaux`) : création, modification, suppression, photo, lien externe https ; aucun paiement géré par MariamCM.
- **Admin** : Utilisateurs (activer/désactiver), Messages de contact, Journal d'activité, Paramètres publics (contact, réseaux sociaux).
- **SEO** : titre/description/Open Graph par site publié, `noindex` sur aperçus et pages privées, `public/robots.txt`.
- **Déploiement** : voir `docs/DEPLOIEMENT.md`. La musique se règle déjà dans Personnalisation.

### Déployer l'Edge Function (obligatoire pour créer des comptes)
```bash
npx supabase functions deploy admin-manage-users
```
Elle utilise `SUPABASE_SERVICE_ROLE_KEY`, fournie automatiquement par Supabase côté serveur. Elle vérifie que l'appelant est un administrateur actif, crée le compte avec le rôle dans `app_metadata` puis le rattache au mariage (et annule la création si le rattachement échoue). Optionnel : définir le secret `ALLOWED_ORIGIN` sur le domaine du site pour restreindre le CORS.

### Ce qui est réellement en place
- Site public MariamCM (accueil, fonctionnalités, étapes, exemples fictifs, contact fonctionnel, pages légales à compléter).
- Authentification : connexion, déconnexion, session persistante, mot de passe oublié/réinitialisation, comptes désactivés, accès refusé, redirection selon le rôle lu en base.
- Pages d'accueil par rôle (`/admin`, `/couple`, `/hotesse`) qui listent les mariages visibles via la RLS. Ce sont des coquilles : les vrais dashboards arrivent aux phases suivantes.
- `/:slug` charge un mariage via la RPC `get_public_wedding` (inconnu ou non publié → page « site indisponible »). Le rendu complet du site est la phase 2.
- 4 migrations SQL, vérifiées par 67 tests exécutés sur un vrai PostgreSQL (PGlite).

Pages écrites à la main par mariage (un dossier, un fichier par section) : `docs/PAGES_PERSONNALISEES.md` — `npm run nouveau-mariage -- <slug>`.

Premier essai réel : `docs/PREMIER_ESSAI.md` (checklist) ; déploiement : `docs/DEPLOIEMENT.md` ; test de scans simultanés : `scripts/concurrency-check.mjs`.

## Installation locale

```bash
npm install
cp .env.example .env     # puis renseigner les variables
npm run dev
```

Scripts : `npm run dev`, `npm run build`, `npm run typecheck`, `npm test`, `npm run lint`.

Sans `.env`, le site public s'affiche mais la connexion et le formulaire de contact sont désactivés avec un message explicite.

## Configurer Supabase

1. Créer un projet sur supabase.com.
2. **Authentication → Providers → Email** : désactiver **« Allow new users to sign up »** (pas d'inscription publique ; les comptes sont créés par l'équipe).
3. **Authentication → URL Configuration** : ajouter l'URL du site et `https://votre-domaine/reinitialiser-mot-de-passe` aux URLs de redirection autorisées.
4. Récupérer l'URL du projet et la clé **publishable/anon** (Project Settings → API) et les mettre dans `.env`. Ne jamais mettre la clé `service_role` dans le frontend ni dans un fichier `VITE_*`.
5. Appliquer les migrations, dans l'ordre :
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
   Alternative : coller chaque fichier de `supabase/migrations/` dans le SQL Editor, dans l'ordre des numéros.
6. Les buckets Storage `wedding-images` (5 Mo, JPEG/PNG/WebP/AVIF) et `wedding-audio` (15 Mo, MP3/M4A/OGG/WAV) sont créés par la migration 4. Chemin des fichiers : `{wedding_id}/{dossier}/{fichier}`.

## Créer le premier administrateur

1. Dashboard Supabase → Authentication → Users → **Add user** (e-mail + mot de passe, cocher la confirmation).
2. Dans le SQL Editor :
   ```sql
   update public.profiles set role = 'admin' where id = '<uuid-de-l-utilisateur>';
   ```
   Cette opération n'est possible que depuis l'éditeur SQL ou le `service_role` : un utilisateur connecté ne peut jamais s'attribuer un rôle (trigger `guard_profile_update`).

Les comptes mariés et hôtesses seront créés depuis le dashboard admin via une Edge Function (phase 2/4) qui utilisera le `service_role` côté serveur uniquement et fixera le rôle dans `app_metadata`.

## Sécurité : principes en vigueur

- RLS activée sur toutes les tables ; les visiteurs anonymes n'ont **aucun accès direct** aux tables privées. Le contenu public passe par `get_public_wedding`, qui ne renvoie que des champs publics et uniquement les messages du livre d'or approuvés.
- Le rôle vient de `app_metadata` (modifiable seulement côté serveur), jamais de `user_metadata`.
- Un couple ne peut ni changer le slug/statut de son site, ni se rattacher à un autre mariage ; les hôtesses n'ont aucune lecture directe des invités ni des QR (RPC à champs minimaux).
- Contrôle d'accès : `perform_check_in` vérifie authentification, droits sur le mariage, existence/révocation du jeton, appartenance au mariage, RSVP, nombre de participants, et verrouille la ligne de l'invité (`FOR UPDATE`) ; un index unique garantit au plus un contrôle initial réussi par invité.
- Jetons QR : 244 bits aléatoires, sans donnée personnelle, stockés dans une table privée (lisible uniquement par admin/couple du mariage) car le couple doit pouvoir réafficher le QR ; révocation et renouvellement via RPC.
- Le slug `slug` doit rester hors des routes statiques : la liste des slugs réservés (migration 1) est synchronisée avec `src/App.tsx`.

## Limites connues et points à traiter

- **Phase 2 non exécutée sur un vrai projet** : le code compile (`tsc`, build) et la base est testée, mais les écrans, les envois de fichiers (Storage) et l'Edge Function n'ont pas encore été essayés contre un projet Supabase réel ni dans un navigateur. À vérifier lors de la première configuration.
- **Pas de tests automatisés sur l'interface** (arrêtés à la demande du projet) ; les écrans des phases 2 à 5 n'ont jamais été exécutés dans un navigateur ni contre un Supabase réel : seuls les tests de base de données existent.
- **Cadeaux et livre d'or** : affichage et soumission publics prêts ; les écrans de gestion (modération, création des cadeaux) arrivent en phase 5.
- **Fichiers remplacés** : supprimés « au mieux » ; un échec laisse un fichier orphelin sans conséquence fonctionnelle.
- **Concurrence** : les tests tournent sur une connexion unique ; ils vérifient la logique séquentielle et l'index d'unicité, pas deux transactions réellement simultanées. Avant la production, rejouer le scénario « deux scans simultanés du même code » sur la vraie base Supabase.
- **Anti-abus** : RSVP, livre d'or et contact ont une limitation de débit simple (par minute, en base). Pour un trafic public, ajouter un captcha (Supabase Auth/Cloudflare Turnstile) et une limitation au niveau de l'API.
- **RSVP** : l'invité est identifié par son nom, et par e-mail/téléphone si la fiche en contient. Sans coordonnées sur la fiche, le nom seul suffit.
- **Images publiques** : les buckets sont lisibles par URL (chemins non devinables) ; ne pas y déposer de contenu privé.
- **Photo du hero** : déposer une photographie dont vous détenez les droits dans `public/hero.jpg` ; sans fichier, un fond dégradé s'affiche.
- **Pages légales** : textes à rédiger (mentions légales, confidentialité, CGU). Les données des invités sont des données personnelles.
- **Lint** : quelques avertissements non bloquants (`oxlint`).
- Les types TypeScript du domaine sont écrits à la main ; ils pourront être régénérés avec `supabase gen types`.

## Structure

```
supabase/migrations/   schéma, sécurité/RLS, RPC, storage
src/features/          auth, marketing, weddings (+ dossiers prêts pour guests, tables, check-in…)
src/components/        ui, layout
src/services/          accès Supabase
src/test/db/           tests de sécurité et de règles métier sur PostgreSQL (PGlite)
```
