# Premier essai réel — checklist

À dérouler une fois le projet Supabase créé. Cochez au fur et à mesure ; toute case qui échoue est un bug à corriger avant la mise en production. Rien ici n'a encore été exécuté.

## A. Préparation (≈ 20 min)
- [ ] Projet créé, inscription publique désactivée (Authentication → Providers → Email).
- [ ] `npx supabase link --project-ref <ref>` puis `npx supabase db push` : les 4 migrations passent sans erreur.
- [ ] `npx supabase functions deploy admin-manage-users`.
- [ ] `.env` rempli (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_PUBLIC_SITE_URL`), `npm run dev`.
- [ ] Premier administrateur créé (README, « Créer le premier administrateur »).

## B. Contrôles de sécurité en base (SQL Editor)
```sql
-- 1. Aucune table publique sans RLS (doit renvoyer 0 ligne)
select tablename from pg_tables where schemaname = 'public' and not rowsecurity;
-- 2. L'anonyme n'a de droits que sur platform_settings (select)
select table_name, privilege_type from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public';
-- 3. Les fonctions sensibles ne sont pas exécutables par anon (doit renvoyer 0 ligne pour perform_check_in)
select routine_name from information_schema.routine_privileges
where grantee = 'anon' and routine_schema = 'public' and routine_name like '%check_in%';
```

## C. Parcours administrateur
- [ ] Connexion admin → `/admin`. Une mauvaise connexion affiche un message sans révéler si l'e-mail existe.
- [ ] Créer un mariage « test » (slug accepté ; un slug réservé comme `admin` est refusé).
- [ ] Créer un compte marié et un compte hôtesse depuis la fiche (Edge Function). Se connecter avec chacun.
- [ ] Désactiver puis réactiver le compte hôtesse : session coupée, message clair.

## D. Parcours marié
- [ ] Personnalisation : couleurs, textes, photo principale, musique (≤ 15 Mo), aperçu en direct.
- [ ] Histoire, programme, galerie (essayer un fichier trop lourd et un PDF : refusés avec message).
- [ ] Publier (admin) puis ouvrir `/<slug>` en navigation privée : enveloppe, compte à rebours, RSVP, livre d'or.
- [ ] Un brouillon n'est PAS visible en navigation privée ; `?apercu=1` fonctionne connecté seulement.
- [ ] Invités : créer, importer un CSV (essayer une cellule `=1+1` : exportée neutralisée), export.
- [ ] Tables : dépasser la capacité → refus. RSVP depuis le site public : la réponse apparaît dans l'onglet RSVP.
- [ ] Livre d'or : message public → apparaît « À modérer » → publier → visible sur le site.
- [ ] Un marié ne voit jamais un autre mariage (créer un 2ᵉ mariage/compte pour vérifier).

## E. Jour J (simulation sur téléphone, en https)
- [ ] Hôtesse connectée sur téléphone → `/hotesse` → Activer la caméra (refuser l'accès une fois : message + recherche par nom).
- [ ] Scanner un QR affiché sur un autre écran : « Accès autorisé » avec nom, table, nombre de personnes.
- [ ] Rescanner le même QR : « Déjà enregistré ».
- [ ] QR révoqué, QR d'un autre mariage, invité ayant décliné : refus clairs.
- [ ] Recherche par nom → Valider l'entrée ; la progression et les derniers contrôles se mettent à jour.
- [ ] Marié : annuler une arrivée depuis la fiche invité, rescanner : accepté.
- [ ] Hôtesse : essayer d'ouvrir `/couple` et `/admin` → accès refusé.

## F. Scans simultanés (le test qui manque)
```bash
SUPABASE_URL=… SUPABASE_KEY=… HOSTESS_EMAIL=… HOSTESS_PASSWORD=… \
WEDDING_ID=<uuid> TOKEN=<jeton d'un invité non arrivé> node scripts/concurrency-check.mjs
```
Attendu : un seul `success`, les autres `already_checked_in`. Le jeton est visible dans la table `guest_qr_tokens` (SQL Editor). Mariage de test uniquement.

## G. Avant l'ouverture au public
- [ ] Textes légaux rédigés, `public/hero.jpg` ajoutée, SMTP personnalisé, captcha activé, sauvegarde faite.
- [ ] Voir `docs/DEPLOIEMENT.md` (hébergement, en-têtes, réécriture SPA).
