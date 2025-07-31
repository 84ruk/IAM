import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProveedorFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  proveedor?: {
    id: number
    nombre: string
    email?: string
    telefono?: string
  } | null
}

export default function ProveedorFormModal({ isOpen, onClose, onSuccess, proveedor }: ProveedorFormModalProps) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (proveedor) {
      setNombre(proveedor.nombre || '')
      setEmail(proveedor.email || '')
      setTelefono(proveedor.telefono || '')
    } else {
      setNombre('')
      setEmail('')
      setTelefono('')
    }
    setError(null)
  }, [proveedor, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const data = {
        nombre: formData.get('nombre') as string,
        email: formData.get('email') as string,
        telefono: formData.get('telefono') as string,
        direccion: formData.get('direccion') as string,
        estado: 'ACTIVO'
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al crear el proveedor')
      }

      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200',
      isOpen ? 'opacity-100' : 'opacity-0'
    )}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
            </h2>
            <p className="text-sm text-gray-600">
              {proveedor ? 'Actualiza los datos del proveedor.' : 'Agrega un nuevo proveedor al sistema.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              maxLength={100}
              placeholder="Nombre del proveedor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={100}
              placeholder="Correo electrónico"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              maxLength={20}
              placeholder="Teléfono de contacto"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-[#8E94F2] hover:bg-[#7278e0] rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              {loading ? 'Guardando...' : proveedor ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 