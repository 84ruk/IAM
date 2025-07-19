// dashboard/kpis/page.tsx
import KPIsClient from './KPIsClient'

// Configurar para renderizado dinámico
export const revalidate = 0

export default async function KPIsPage() {
  return <KPIsClient />
} 