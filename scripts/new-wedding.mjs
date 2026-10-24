// Crée la page d'un mariage à partir du modèle : npm run nouveau-mariage -- <slug>
// Le slug doit être celui du mariage créé dans l'administration (ex. awa-et-jean).
import { cpSync, existsSync } from 'node:fs'
import path from 'node:path'

const slug = process.argv[2]
if (!slug || !/^[a-z0-9](?:[a-z0-9-]{1,58})[a-z0-9]$/.test(slug)) {
  console.error('Usage : npm run nouveau-mariage -- <slug>   (3 à 60 caractères : minuscules, chiffres, tirets)')
  process.exit(1)
}
const root = path.resolve(import.meta.dirname, '..', 'src', 'weddings')
const target = path.join(root, slug)
if (existsSync(target)) { console.error(`Le dossier src/weddings/${slug} existe déjà.`); process.exit(1) }
cpSync(path.join(root, '_modele'), target, { recursive: true })
console.log(`Page créée : src/weddings/${slug}/\nModifiez sections/*.tsx puis index.tsx, et lancez npm run dev (http://localhost:5173/${slug}).`)
