import NuevoProductoClient from './NuevoProductoClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NuevoProductoPage() {
  return <NuevoProductoClient />
}
