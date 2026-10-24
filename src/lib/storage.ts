import { requireSupabase } from '@/lib/supabase'

export type StorageKind = 'image' | 'audio'

const RULES: Record<StorageKind, { bucket: string; maxBytes: number; mimes: Record<string, string[]> }> = {
  image: {
    bucket: 'wedding-images',
    maxBytes: 5 * 1024 * 1024,
    mimes: { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'image/avif': ['avif'] },
  },
  audio: {
    bucket: 'wedding-audio',
    maxBytes: 15 * 1024 * 1024,
    mimes: { 'audio/mpeg': ['mp3'], 'audio/mp4': ['m4a'], 'audio/ogg': ['ogg'], 'audio/wav': ['wav'], 'audio/x-wav': ['wav'] },
  },
}

export type StorageFolder = 'hero' | 'story' | 'gallery' | 'gifts' | 'music'

export function validateFile(file: File, kind: StorageKind): string | null {
  const rule = RULES[kind]
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const allowedExt = rule.mimes[file.type]
  if (!allowedExt || !allowedExt.includes(ext)) {
    return kind === 'image'
      ? 'Format non accepté. Utilisez JPEG, PNG, WebP ou AVIF.'
      : 'Format non accepté. Utilisez MP3, M4A, OGG ou WAV.'
  }
  if (file.size > rule.maxBytes) return `Fichier trop volumineux (maximum ${rule.maxBytes / 1024 / 1024} Mo).`
  return null
}

export function publicUrl(kind: StorageKind, path: string | null | undefined): string | null {
  if (!path) return null
  const sb = requireSupabase()
  return sb.storage.from(RULES[kind].bucket).getPublicUrl(path).data.publicUrl
}

/** Envoie un fichier dans {wedding_id}/{dossier}/{uuid}.{ext}. Retourne le chemin stocké en base. */
export async function uploadWeddingFile(
  weddingId: string, folder: StorageFolder, file: File, kind: StorageKind,
): Promise<string> {
  const problem = validateFile(file, kind)
  if (problem) throw new Error(problem)
  const ext = file.name.split('.').pop()!.toLowerCase()
  const path = `${weddingId}/${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await requireSupabase().storage
    .from(RULES[kind].bucket)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false })
  if (error) throw new Error('Le téléversement a échoué. Vérifiez vos droits et réessayez.')
  return path
}

export async function removeWeddingFile(kind: StorageKind, path: string | null | undefined): Promise<void> {
  if (!path) return
  // Suppression « au mieux » : un fichier orphelin n'empêche pas le fonctionnement.
  await requireSupabase().storage.from(RULES[kind].bucket).remove([path])
}

export function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}
