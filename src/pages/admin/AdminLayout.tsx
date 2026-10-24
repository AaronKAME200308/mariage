import { Heart, LayoutDashboard, Mail, ScrollText, Settings, Users } from 'lucide-react'
import { DashboardLayout, type NavItem } from '@/components/layout/DashboardLayout'

const NAV: NavItem[] = [
  { to: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/admin/mariages', label: 'Mariages', icon: Heart },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/journal', label: 'Journal', icon: ScrollText },
  { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
]

export default function AdminLayout() {
  return <DashboardLayout nav={NAV} />
}
