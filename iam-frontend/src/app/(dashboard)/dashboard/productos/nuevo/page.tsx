'use client'

import FormularioProducto from '@/components/productos/FormularioProducto'
import { useRouter } from 'next/navigation'
import { requireAuth } from '@/lib/ssrAuth'

export default async function NuevoProductoPage() {
  const user = await requireAuth()
  if (!user) return null
  const router = useRouter()

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <FormularioProducto onSuccess={() => router.push('/dashboard/productos')} />
    </div>
  )
}
