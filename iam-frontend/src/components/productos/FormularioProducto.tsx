// src/components/productos/FormularioProducto.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { INDUSTRIAS } from '@/config/industrias.config'
import { useServerUser } from '@/context/ServerUserContext'

import { FormErrorAlert } from '@/components/ui/FormErrorAlert'
import { useEffect, useState, useMemo } from 'react'
import Button from '../ui/Button'
import { Input } from '../ui/Input'
import Select from '../ui/Select'
import { useParams, useRouter } from 'next/navigation'
import { getErrorMessage } from '@/lib/form-utils'
import { ChevronDownIcon, ChevronUpIcon, Package, DollarSign, Tag, Settings, Barcode, X, User, Thermometer, Droplets, MapPin, Hash, Radio } from 'lucide-react'
import { TipoProductoConfig } from '@/types/enums'
import { Producto } from '@/types/producto'

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
    proveedorId: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).optional(),
    etiquetas: z.array(z.string()).optional(),
  })


export default function FormularioProducto({ onSuccess, producto }: { onSuccess?: () => void, producto?: Producto }) {

  const etiquetasIniciales = producto?.etiquetas || []   
  const user = useServerUser();
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
  const [eliminandoProducto, setEliminandoProducto] = useState(false)
  const [mostrarOpcionales, setMostrarOpcionales] = useState(false)
  const [mostrarAvanzadas, setMostrarAvanzadas] = useState(false)
  const [etiquetas, setEtiquetas] = useState<string[]>(etiquetasIniciales)
  const [inputEtiqueta, setInputEtiqueta] = useState('')

  // Inicializar etiquetas cuando se recibe un producto para editar
  useEffect(() => {
    if (producto?.etiquetas) {
      setEtiquetas(producto.etiquetas)
    }
  }, [producto])

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
          // Inicializar etiquetas como array (nuevo modelo)
          const etiquetasProducto = Array.isArray(data.etiquetas) ? data.etiquetas : []
          setEtiquetas(etiquetasProducto)
          setValue('etiquetas', etiquetasProducto)
        }
      } catch (error) {
        console.error('Error cargando producto')
    }
  }
    fetchProducto()
  }, [productoId, setValue])

  // Sincronizar etiquetas con react-hook-form
  useEffect(() => {
    setValue('etiquetas', etiquetas)
  }, [etiquetas, setValue])

  const onSubmit = async (values: any) => {
    setServerErrors([])
    
    // Debug: mostrar valores antes de limpiar
    console.log('Valores del formulario:', values)
    console.log('Etiquetas del estado:', etiquetas)
    
    // Limpiar valores vacíos antes de enviar
    const cleanedValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => {
        // Si el valor es string vacío, null o undefined, no incluirlo
        if (value === '' || value === null || value === undefined) {
          return [key, undefined]
        }
        // Si es proveedorId y es 0 o string vacío, no incluirlo
        if (key === 'proveedorId' && (value === 0 || value === '')) {
          return [key, undefined]
        }
        return [key, value]
      }).filter(([_, value]) => value !== undefined)
    )
    
    // Asegurar que las etiquetas se incluyan
    if (etiquetas.length > 0) {
      cleanedValues.etiquetas = etiquetas
    } else {
      // Incluir array vacío para limpiar etiquetas existentes
      cleanedValues.etiquetas = []
    }
    
    // Eliminar el campo 'etiqueta' si existe
    if ('etiqueta' in cleanedValues) {
      delete cleanedValues['etiqueta']
    }
    
    // Debug: mostrar valores finales
    console.log('Valores finales a enviar:', cleanedValues)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos${productoId ? `/${productoId}` : ''}`, {
        method: productoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(cleanedValues),
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

  const eliminarProducto = async () => {
    if (!productoId) return
    
    const confirmar = confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción lo ocultará del inventario pero podrás restaurarlo desde la papelera.')
    if (!confirmar) return

    try {
    setEliminandoProducto(true)
      setServerErrors([])
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${productoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!res.ok) {
        const data = await res.json()
        if (Array.isArray(data.message)) {
          setServerErrors(data.message)
        } else if (typeof data.message === 'string') {
          setServerErrors([data.message])
        } else {
          setServerErrors(['Error al eliminar el producto'])
        }
        return
      }
      
      // Redirigir a la lista de productos después de eliminar
            router.push('/dashboard/productos')
    } catch (err: any) {
      setServerErrors(['Error de conexión. Verifica tu conexión a internet.'])
    } finally {
      setEliminandoProducto(false)
    }
  }

  // Función optimizada para ajustar altura del textarea (debounced)
  const adjustTextareaHeight = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (textarea: HTMLTextAreaElement) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        textarea.style.height = 'auto'
        textarea.style.height = Math.max(80, textarea.scrollHeight) + 'px'
      }, 100) // Debounce de 100ms para evitar cálculos excesivos
    }
  }, [])

  // Handler para agregar etiqueta
  const handleInputEtiqueta = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('Key pressed:', e.key, 'Input value:', inputEtiqueta)
    if ([' ', ','].includes(e.key) && inputEtiqueta.trim()) {
      e.preventDefault()
      const nueva = inputEtiqueta.trim()
      console.log('Nueva etiqueta a agregar:', nueva)
      if (
        nueva.length > 0 &&
        !etiquetas.includes(nueva) &&
        etiquetas.length < 5
      ) {
        const nuevasEtiquetas = [...etiquetas, nueva]
        console.log('Etiquetas actualizadas:', nuevasEtiquetas)
        setEtiquetas(nuevasEtiquetas)
      }
      setInputEtiqueta('')
    }
  }

  const handleRemoveEtiqueta = (etiqueta: string) => {
    setEtiquetas(etiquetas.filter(e => e !== etiqueta))
  }

  // Debug: mostrar estado de etiquetas
  console.log('Render - Estado de etiquetas:', etiquetas)

  const renderCampo = (campo: string, label: string, type: string = 'text', optional = true) => {
    // Caso especial para descripción - usar textarea
    if (campo === 'descripcion') {
      return (
        <div key={campo} className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {!optional && <span className="text-red-500">*</span>}
          </label>
          <textarea
            {...register(campo)}
            placeholder={label + (optional ? ' (opcional)' : '')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent resize-none transition-all duration-200 min-h-[80px]"
            style={{ minHeight: '80px' }}
            onInput={(e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)}
          />
          {typeof errors[campo]?.message === 'string' && (
            <p className="mt-1 text-sm text-red-600">{errors[campo]?.message}</p>
          )}
        </div>
      )
    }

    return (
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
  }

  // Función para obtener el icono según el campo
  const getCampoIcon = (campo: string) => {
    switch (campo) {
      case 'talla':
        return <Hash className="w-4 h-4 text-gray-400" />
      case 'color':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />
      case 'temperaturaOptima':
        return <Thermometer className="w-4 h-4 text-gray-400" />
      case 'humedadOptima':
        return <Droplets className="w-4 h-4 text-gray-400" />
      case 'ubicacion':
        return <MapPin className="w-4 h-4 text-gray-400" />
      case 'sku':
        return <Hash className="w-4 h-4 text-gray-400" />
      case 'codigoBarras':
        return <Barcode className="w-4 h-4 text-gray-400" />
      case 'rfid':
        return <Radio className="w-4 h-4 text-gray-400" />
      case 'stockMinimo':
        return <Package className="w-4 h-4 text-gray-400" />
      default:
        return <Hash className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header mejorado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {modo === 'editar' ? 'Editar producto' : 'Nuevo producto'}
        </h1>
        <p className="text-gray-600">
          {modo === 'editar' 
            ? 'Modifica la información del producto. Los campos marcados con * son obligatorios.'
            : 'Completa la información del nuevo producto. Los campos marcados con * son obligatorios.'
          }
        </p>
      </div>

      {/* Alerta del código de barras */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
        <Barcode className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold text-green-700">Lector de código de barras disponible</span>
          <p className="text-green-700 text-sm mt-1">
            Puedes escanear un código de barras directamente en cualquier campo. 
            El sistema detectará automáticamente el código y rellenará los campos correspondientes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <FormErrorAlert errors={serverErrors} className="mb-6" />

        {/* Información básica */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Información básica</h2>
                <p className="text-sm text-gray-600">Datos esenciales del producto</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  Nombre del producto *
                </div>
              </label>
              <input
                {...register('nombre')}
                type="text"
                placeholder="Nombre del producto"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre.message as string}</p>
              )}
            </div>
            
              {renderCampo('descripcion', 'Descripción', 'text', true)}
              
              <Select
                label="Unidad de medida *"
                value={String(watch('unidad') ?? '')}
                onChange={e => setValue('unidad', e.target.value)}
                options={UNIDADES.map(u => ({ value: u, label: u }))}
                error={getErrorMessage(errors.unidad)}
              />

              <Select
                label="Tipo de producto *"
                value={String(watch('tipoProducto') ?? '')}
                onChange={e => setValue('tipoProducto', e.target.value)}
                options={TIPOS_PRODUCTO.map(tipo => ({
                  value: tipo,
                  label: TipoProductoConfig[tipo as keyof typeof TipoProductoConfig]?.label || tipo
                }))}
                error={getErrorMessage(errors.tipoProducto)}
              />
            </div>
          </div>

        {/* Precios y stock */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Precios y stock</h2>
                <p className="text-sm text-gray-600">Información comercial y de inventario</p>
              </div>
            </div>
            
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  Precio de compra *
                </div>
              </label>
              <input
                {...register('precioCompra')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
              />
              {errors.precioCompra && (
                <p className="mt-1 text-sm text-red-600">{errors.precioCompra.message as string}</p>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  Precio de venta *
                </div>
              </label>
              <input
                {...register('precioVenta')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
              />
              {errors.precioVenta && (
                <p className="mt-1 text-sm text-red-600">{errors.precioVenta.message as string}</p>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  Stock actual *
                </div>
              </label>
              <input
                {...register('stock')}
                type="number"
                min="0"
                placeholder="0"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">{errors.stock.message as string}</p>
              )}
            </div>
            </div>
          </div>

        {/* Datos opcionales colapsables */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div 
            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl"
            onClick={() => setMostrarOpcionales(!mostrarOpcionales)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Tag className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Información adicional</h2>
                  <p className="text-sm text-gray-600">Categorización y proveedor (opcional)</p>
                </div>
              </div>
              {mostrarOpcionales ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
              </div>
            </div>
            
          {mostrarOpcionales && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Input de etiquetas tipo tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      Etiquetas (máx. 5)
              </div>
                  </label>
                  {/* Mostrar chips de etiquetas */}
              {etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {etiquetas.map((etiqueta) => (
                        <span key={etiqueta} className="inline-flex items-center bg-[#F5F7FF] text-[#8E94F2] px-3 py-1 rounded-full text-xs font-medium border border-[#8E94F2]">
                      {etiqueta}
                      <button
                        type="button"
                            onClick={() => handleRemoveEtiqueta(etiqueta)} 
                            className="ml-1 text-[#8E94F2] hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
                  <input
                    type="text"
                    value={inputEtiqueta}
                    onChange={e => setInputEtiqueta(e.target.value.replace(/[^\w\s-]/g, ''))}
                    onKeyDown={handleInputEtiqueta}
                    placeholder={etiquetas.length >= 5 ? 'Máximo 5 etiquetas' : 'Agregar etiqueta (espacio o coma)'}
                    disabled={etiquetas.length >= 5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent text-sm transition-all"
                  />
                  {errors.etiquetas && (
                    <p className="mt-1 text-sm text-red-600">{(errors.etiquetas as any)?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      Proveedor (opcional)
                    </div>
                  </label>
                  <Select
                    label={undefined}
                    value={String(watch('proveedorId') ?? '')}
                    onChange={e => setValue('proveedorId', e.target.value)}
                    options={[
                      { value: '', label: 'Sin proveedor' },
                      ...proveedores.map(p => ({ value: String(p.id), label: p.nombre }))
                    ]}
                    error={errors.proveedorId?.message as string}
                    className="mb-0"
                  />
                  {errors.proveedorId && (
                    <p className="mt-1 text-sm text-red-600">{errors.proveedorId.message as string}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>

        {/* Configuración avanzada colapsable */}
        {config.camposRelevantes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl"
              onClick={() => setMostrarAvanzadas(!mostrarAvanzadas)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Configuración avanzada</h2>
                                         <p className="text-sm text-gray-600">Campos específicos para {config.label.toLowerCase()}</p>
                  </div>
                </div>
                {mostrarAvanzadas ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {mostrarAvanzadas && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {config.camposRelevantes.map((campo) => {
                    const type = ['precioCompra', 'precioVenta', 'stock', 'stockMinimo', 'temperaturaOptima', 'humedadOptima'].includes(campo) ? 'number' : 'text'
                    const label = campo.charAt(0).toUpperCase() + campo.slice(1).replace(/([A-Z])/g, ' $1')
                    const icon = getCampoIcon(campo)
                    
                    return (
                      <div key={campo} className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            {icon}
                            {label}
                          </div>
                        </label>
                        <input
                          {...register(campo)}
                          type={type}
                          placeholder={label + ' (opcional)'}
                          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
                        />
                        {typeof errors[campo]?.message === 'string' && (
                          <p className="mt-1 text-sm text-red-600">{errors[campo]?.message}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            <Button
              type="submit"
                  disabled={isSubmitting || eliminandoProducto}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#8E94F2] hover:bg-[#7278e0] focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-xl shadow-md hover:shadow-lg"
            >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      {modo === 'editar' ? 'Actualizar producto' : 'Guardar producto'}
                    </>
                  )}
            </Button>
          
          {modo === 'editar' && (
            <Button
              type="button"
              onClick={eliminarProducto}
                    disabled={isSubmitting || eliminandoProducto}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-xl shadow-md hover:shadow-lg"
            >
                    {eliminandoProducto ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        Eliminar producto
                      </>
                    )}
            </Button>
          )}
            </div>
            
            <p className="text-sm text-gray-500">
              {modo === 'editar' ? 'Los cambios se guardarán inmediatamente' : 'El producto se agregará al inventario'}
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
