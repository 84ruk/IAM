// src/components/productos/FormularioProducto.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { INDUSTRIAS } from '@/config/industrias.config'
import { useUserContext } from '@/context/UserProvider'

import { FormErrorAlert } from '@/components/ui/FormErrorAlert'
import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import { Input } from '../ui/Input'
import Select from '../ui/Select'
import { useParams, useRouter } from 'next/navigation'
import { watch } from 'node:fs/promises'
import { getErrorMessage } from '@/lib/form-utils'

const UNIDADES = ['UNIDAD', 'KILO', 'LITRO', 'CAJA', 'PAQUETE']
const TIPOS_PRODUCTO = ['GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO']

const baseSchema = z
  .object({
    nombre: z.string().min(1, { message: 'El nombre es obligatorio' }),
    precioCompra: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).positive({ message: 'El precio de compra debe ser mayor a 0' }),
    precioVenta: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).positive({ message: 'El precio de venta debe ser mayor a 0' }),
    stock: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).int({ message: 'Debe ser un número entero' }).nonnegative({ message: 'El stock no puede ser negativo' }),
    unidad: z.string().min(1, { message: 'La unidad es obligatoria' }),
    tipoProducto: z.string().min(1, { message: 'El tipo de producto es obligatorio' }),
    proveedorId: z.string().optional(),
  })


export default function FormularioProducto({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useUserContext()
  const router = useRouter()
  const params = useParams()
  const productoId = params?.id
  const modo = productoId ? 'editar' : 'crear'

  const tipoIndustria = (user?.tipoIndustria || 'GENERICA') as keyof typeof INDUSTRIAS
  const config = INDUSTRIAS[tipoIndustria]

  const camposIndustria = config.camposRelevantes.reduce((acc, campo) => {
    acc[campo] = z.any().optional()
    return acc
  }, {} as any)

  const schema = baseSchema
  .extend(camposIndustria)
  .refine(data => {
    if (data.precioVenta < data.precioCompra * 1.1) {
      return false
    }
    return true
  }, {
    message: 'El precio de venta debe ser al menos un 10% mayor que el precio de compra',
    path: ['precioVenta'],
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
  })

  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [proveedores, setProveedores] = useState<{ id: number, nombre: string }[]>([])

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok) setProveedores(data)
      } catch (err) {
        console.error('Error cargando proveedores')
      }
    }
    fetchProveedores()
  }, [])

  useEffect(() => {
    if (!productoId) return
    const fetchProducto = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${productoId}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok) {
          Object.entries(data).forEach(([key, value]) => {
            setValue(key as any, value)
          })
        }
      } catch (error) {
        console.error('Error cargando producto')
      }
    }
    fetchProducto()
  }, [productoId, setValue])

  const onSubmit = async (values: any) => {
    setServerErrors([])
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos${productoId ? `/${productoId}` : ''}`, {
        method: productoId ? 'PUT' : 'POST',
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

      onSuccess?.()
      router.push('/dashboard/productos')
    } catch (err: any) {
      setServerErrors(['Hubo un error inesperado.'])
    }
  }

  const renderCampo = (campo: string, label: string, type: string = 'text', optional = true) => (
    <Input
      key={campo}
      label={label}
      placeholder={label + (optional ? ' (opcional)' : '')}
      {...register(campo)}
      error={typeof errors[campo]?.message === 'string' ? errors[campo]?.message : undefined}
      optional={optional}
      type={type}
    />
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{modo === 'editar' ? 'Editar producto' : 'Nuevo producto'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
  <FormErrorAlert errors={serverErrors} className="mb-4" />

  {/*Sección: Datos obligatorios */}
  <div>
    <h2 className="text-lg font-semibold text-gray-700 mb-2">Datos obligatorios</h2>
    {renderCampo('nombre', 'Nombre', 'text', false)}
    {renderCampo('precioCompra', 'Precio de Compra', 'number', false)}
    {renderCampo('precioVenta', 'Precio de Venta', 'number', false)}
    {renderCampo('stock', 'Stock', 'number', false)}

    <Select
      label="Unidad de medida"
      options={UNIDADES}
      {...register('unidad')}
      error={getErrorMessage(errors.unidad)}
    />

    <Select
      label="Tipo de producto"
      options={TIPOS_PRODUCTO}
      {...register('tipoProducto')}
      error={getErrorMessage(errors.tipoProducto)}
    />
  </div>

  {/* Sección: Datos opcionales */}
  <div className="border-t pt-4">
    <h2 className="text-lg font-semibold text-gray-700 mb-2">Datos opcionales</h2>

    <Select
      label="Proveedor"
      options={proveedores.map(p => ({ value: String(p.id), label: p.nombre }))}
      {...register('proveedorId')}
      error={getErrorMessage(errors.proveedorId)}
      optional
    />

    {config.camposRelevantes.map((campo) => {
      const type = ['precioCompra', 'precioVenta', 'stock', 'stockMinimo', 'temperaturaOptima', 'humedadOptima'].includes(campo) ? 'number' : 'text'
      const label = campo.charAt(0).toUpperCase() + campo.slice(1).replace(/([A-Z])/g, ' $1')
      return renderCampo(campo, label, type, true) // forzar que se muestre como opcional
    })}
  </div>

  <Button
    type="submit"
    disabled={isSubmitting}
    className="bg-[#8E94F2] hover:bg-[#7278e0] text-white text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-50"
  >
    {isSubmitting ? 'Guardando...' : modo === 'editar' ? 'Actualizar producto' : 'Guardar producto'}
  </Button>
</form>

    </div>
  )
}
