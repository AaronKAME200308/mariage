# Déploiement de MariamCM

Aucun de ces pas n'a été exécuté depuis cet environnement : ils sont à dérouler et à vérifier lors de la première mise en ligne.

## 1. Supabase
1. Créer le projet. Désactiver l'inscription publique (Authentication → Providers → Email → *Allow new users to sign up* : **off**).
2. Appliquer les 4 migrations dans l'ordre (`npx supabase db push`).
3. Déployer l'Edge Function : `npx supabase functions deploy admin-manage-users`. Optionnel : `npx supabase secrets set ALLOWED_ORIGIN=https://votre-domaine`.
4. Créer le premier administrateur (voir README).
5. Authentication → URL Configuration : *Site URL* = domaine de production ; ajouter `https://votre-domaine/reinitialiser-mot-de-passe` aux redirections.
6. Configurer un SMTP personnalisé (le SMTP par défaut de Supabase est très limité) pour les e-mails de réinitialisation.
7. Activer un captcha (Authentication → Attack Protection) et envisager Cloudflare Turnstile devant les formulaires publics (RSVP, livre d'or, contact).

## 2. Variables d'environnement du frontend
| Variable | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | clé publishable/anon |
| `VITE_PUBLIC_SITE_URL` | `https://votre-domaine` (utilisée dans les QR codes) |

Ne jamais exposer la clé `service_role` dans une variable `VITE_*`.

## 3. Hébergement du frontend
`npm run build` produit `dist/`. Le site est une SPA : toutes les routes doivent renvoyer `index.html` (réécriture `/* → /index.html` sur Netlify/Cloudflare Pages/Vercel). Servir en **https** (obligatoire pour la caméra du scanner).

En-têtes recommandés : `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self)`, et une CSP autorisant votre projet Supabase (`connect-src`, `img-src`, `media-src`) et Google Fonts.

## 4. Vérifications avant le jour J
- Créer un mariage de test, un compte marié, un compte hôtesse ; vérifier qu'un marié ne voit pas un autre mariage et qu'une hôtesse ne lit pas la liste complète des invités.
- Importer des invités, afficher un QR, le scanner avec un téléphone en conditions réelles (lumière, https).
- Rejouer « deux scans simultanés du même QR » sur la vraie base : un seul doit réussir.
- Tester l'envoi d'images/audio (taille et types refusés), la réinitialisation de mot de passe, un compte désactivé.
- Faire une sauvegarde (Supabase → Database → Backups) avant l'événement.

## 5. SEO
Les balises (titre, description, Open Graph) sont posées côté client ; les pages privées sont en `noindex` et `robots.txt` les exclut. Les robots qui n'exécutent pas JavaScript (aperçus de certains réseaux sociaux) ne verront que les balises génériques de `index.html` : pour des aperçus parfaits, prévoir un rendu serveur ou un pré-rendu des sites publiés.
