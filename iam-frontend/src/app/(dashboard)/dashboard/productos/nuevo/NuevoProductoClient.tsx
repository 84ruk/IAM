'use client'

import FormularioProducto from '@/components/productos/FormularioProducto'
import { useRouter } from 'next/navigation'

export default function NuevoProductoClient() {
  const router = useRouter()
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <FormularioProducto onSuccess={() => router.push('/dashboard/productos')} />
    </div>
  )
} 