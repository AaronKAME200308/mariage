import {
  CalendarHeart, Camera, Gift, LayoutDashboard, MessageSquareHeart, QrCode, ScanLine, Table2,
  UserCheck, Users, Globe,
  type LucideIcon,
} from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export const FEATURES: Feature[] = [
  { icon: Globe, title: 'Sites de mariage personnalisés', description: 'Un site à votre image : couleurs, polices, photos et textes, accessible par une adresse unique.' },
  { icon: Users, title: 'Gestion des invités', description: 'Liste centralisée, recherche, filtres et import CSV pour garder le contrôle sans tableur.' },
  { icon: UserCheck, title: 'Confirmations de présence', description: 'Vos invités répondent en ligne ; chaque réponse est rattachée à leur fiche, sans doublon.' },
  { icon: CalendarHeart, title: 'Programme de la cérémonie', description: 'Cérémonies, cocktail, dîner, soirée : une chronologie claire avec lieux, horaires et code vestimentaire.' },
  { icon: Camera, title: 'Galerie photos', description: 'Une galerie élégante avec lightbox pour partager vos plus beaux souvenirs.' },
  { icon: MessageSquareHeart, title: 'Livre d’or', description: 'Les messages sont modérés avant publication : vous gardez la maîtrise de ce qui s’affiche.' },
  { icon: Gift, title: 'Liste de cadeaux', description: 'Présentez vos envies de cadeaux, avec liens et statut de disponibilité.' },
  { icon: QrCode, title: 'QR codes individuels', description: 'Chaque invité possède un code unique, utilisé uniquement pour le contrôle d’accès le jour J.' },
  { icon: Table2, title: 'Gestion des tables', description: 'Créez vos tables, affectez vos invités et ne dépassez jamais la capacité prévue.' },
  { icon: LayoutDashboard, title: 'Dashboard des mariés', description: 'Un espace privé pour suivre les réponses, les statistiques et personnaliser votre site.' },
  { icon: ScanLine, title: 'Interface des hôtesses', description: 'Une application mobile simple pour scanner, vérifier l’accès et indiquer la table.' },
]

export const STEPS = [
  { title: 'L’équipe configure votre site', description: 'MariamCM crée le site de votre mariage, son adresse et vos accès sécurisés.' },
  { title: 'Vous personnalisez et gérez vos invités', description: 'Vous composez votre site, importez vos invités, suivez les réponses et organisez vos tables.' },
  { title: 'Les hôtesses contrôlent les entrées', description: 'Le jour J, elles scannent les QR codes individuels pour valider l’accès et orienter vers la bonne table.' },
]

export interface DemoWedding {
  couple: string
  date: string
  place: string
  palette: [string, string]
}

/** Données fictives, utilisées uniquement pour illustrer la plateforme. */
export const DEMO_WEDDINGS: DemoWedding[] = [
  { couple: 'Amélie & Yoan', date: '14 mars 2027', place: 'Yaoundé', palette: ['#183D32', '#A7B9A3'] },
  { couple: 'Sandra & Michel', date: '5 juin 2027', place: 'Douala', palette: ['#8A6D33', '#F1ECE0'] },
  { couple: 'Inès & Paul', date: '18 septembre 2027', place: 'Kribi', palette: ['#24533F', '#C8A96B'] },
]
