// src/app/dashboard/movimientos/nuevo/page.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormErrorAlert } from '@/components/ui/FormErrorAlert'

const schema = z.object({
  tipo: z.enum(['ENTRADA', 'SALIDA'], { required_error: 'Selecciona el tipo de movimiento' }),
  cantidad: z.coerce.number().int().min(1, { message: 'La cantidad debe ser mayor a 0' }), //MENSAJES DE ERROR NO ESTAN BIEN
  productoId: z.coerce.number().min(1, { message: 'Selecciona un producto válido' }),
  motivo: z.string().optional(),
  descripcion: z.string().optional(),
})

export default function NuevoMovimientoPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<{ id: number; nombre: string; unidad: string }[]>([])
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [resumen, setResumen] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        const productosValidos = data.filter((p: any) => p?.id && p?.nombre && p?.unidad)
        setProductos(productosValidos)
        setLoading(false)
      })
      .catch(() => {
        console.error('Error al cargar productos')
        setLoading(false)
      })
  }, [])

  const onSubmit = async (values: any) => {
    setServerErrors([])
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      })

      const data = await res.json()
      if (!res.ok) {
        if (Array.isArray(data.message)) {
          setServerErrors(data.message)
        } else if (typeof data.message === 'string') {
          setServerErrors([data.message])
        }
        return
      }

      const producto = productos.find(p => p.id === values.productoId)
      setResumen({ ...values, producto: producto?.nombre, unidad: producto?.unidad })
    } catch (err) {
      setServerErrors(['Hubo un error al registrar el movimiento'])
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Registrar Movimiento</h1>

      {resumen && (
        <div className="bg-green-50 border border-green-200 p-4 mb-4 rounded">
          <p className="font-medium text-green-800 mb-2"> Movimiento registrado con éxito</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li><strong>Tipo:</strong> {resumen.tipo}</li>
            <li><strong>Producto:</strong> {resumen.producto} ({resumen.unidad})</li>
            <li><strong>Cantidad:</strong> {resumen.cantidad}</li>
            {resumen.motivo && <li><strong>Motivo:</strong> {resumen.motivo}</li>}
            {resumen.descripcion && <li><strong>Descripción:</strong> {resumen.descripcion}</li>}
          </ul>
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-gray-500">Cargando productos...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded shadow">
          <FormErrorAlert errors={serverErrors} />

          <Select
            label="Tipo de movimiento"
            options={['ENTRADA', 'SALIDA'].map(val => ({ label: val, value: val }))}
            {...register('tipo')}
            error={errors.tipo?.message}
          />

          <Select
            label="Producto"
            options={productos.map(p => ({ label: `${p.nombre} (${p.unidad})`, value: p.id }))}
            {...register('productoId', { valueAsNumber: true })}
            error={errors.productoId?.message}
          />

          <Input
            label="Cantidad"
            type="number"
            step="1"
            placeholder="Ej: 10"
            {...register('cantidad', { valueAsNumber: true })}
            error={errors.cantidad?.message}
          />

          <Input
            label="Motivo (opcional)"
            placeholder="Ej: Reposición semanal"
            {...register('motivo')}
            error={errors.motivo?.message}
          />

          <Input
            label="Descripción (opcional)"
            placeholder="Ej: Stock del proveedor ACME"
            {...register('descripcion')}
            error={errors.descripcion?.message}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Registrar movimiento'}
          </Button>
        </form>
      )}
    </div>
  )
}
