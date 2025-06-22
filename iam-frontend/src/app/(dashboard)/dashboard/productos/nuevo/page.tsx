'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormErrorAlert } from '@/components/ui/FormErrorAlert'

const unidades = ['UNIDAD', 'KILO', 'LITRO', 'CAJA', 'PAQUETE']

export default function NuevoProductoPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    stock: 0,
    stockMinimo: 0,
    precioCompra: 0,
    precioVenta: 0,
    unidad: '',
    categoria: '',
    codigoBarras: '',
    rfid: '',
    ubicacion: '',
    temperaturaOptima: 0,
    humedadOptima: 0,
    proveedorId: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: ['precioCompra', 'precioVenta', 'stock', 'stockMinimo', 'temperaturaOptima', 'humedadOptima'].includes(name)
        ? Number(value)
        : value
    }))
    setErrors(prev => prev.filter(err => !err.toLowerCase().includes(name.toLowerCase())))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    if (!form.nombre || !form.unidad || form.precioCompra < 0 || form.precioVenta < 0) {
      setErrors(['Todos los campos obligatorios deben ser válidos.'])
      return
    }
    if (form.precioVenta < form.precioCompra) {
      setErrors(['El precio de venta no puede ser menor que el precio de compra.'])
      return
    }
    if (form.stock < 0) {
      setErrors(['El stock no puede ser negativo.'])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      

      if (!res.ok) {
        if (Array.isArray(data.message)) {
          setErrors(data.message)
        } else if (typeof data.message === 'string') {
          setErrors([data.message])
        }
        return
      }

      router.push('/dashboard/productos')
    } catch (err) {
      alert('Hubo un error. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const renderInput = (label: string, name: string, type = 'text', step?: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        placeholder={label}
        className="w-full shadow-sm rounded px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        value={(form as any)[name]}
        onChange={handleChange}
      />
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Nuevo producto</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        <FormErrorAlert errors={errors} className="mb-4" />

        {renderInput('Nombre', 'nombre')}
        {renderInput('Descripción', 'descripcion')}

        <div className="grid grid-cols-2 gap-4">
          {renderInput('Stock', 'stock', 'number')}
          {renderInput('Stock mínimo', 'stockMinimo', 'number')}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {renderInput('Precio compra', 'precioCompra', 'number', '0.01')}
          {renderInput('Precio venta', 'precioVenta', 'number', '0.01')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
          <select
            name="unidad"
            className="w-full shadow-sm rounded px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.unidad}
            onChange={handleChange}
          >
            <option value="">Selecciona unidad</option>
            {unidades.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {renderInput('Categoría (opcional) Agregar Enum', 'categoria')}
        {renderInput('Código de barras (opcional)', 'codigoBarras')}
        {renderInput('RFID (opcional)', 'rfid')}
        {renderInput('Ubicación (Opcional)Agregar Enum por empresas', 'ubicacion')}

        <div className="grid grid-cols-2 gap-4">
          {renderInput('Temperatura óptima (opcional)', 'temperaturaOptima', 'number')}
          {renderInput('Humedad óptima (opcional)', 'humedadOptima', 'number')}
        </div>

        {renderInput('ID Proveedor (opcional)', 'proveedorId')}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#8E94F2] hover:bg-[#7278e0] text-white text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar producto'}
        </button>
      </form>
    </div>
  )
}
