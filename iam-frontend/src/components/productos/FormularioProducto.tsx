// src/components/productos/FormularioProducto.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useServerUser } from '@/context/ServerUserContext'
import { useIndustriaConfig } from '@/hooks/useIndustriaConfig'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useApi } from '@/lib/api'
import { AppError } from '@/lib/errorHandler'

import { FormErrorAlert } from '@/components/ui/FormErrorAlert'
import { useEffect, useState, useMemo } from 'react'
import Button from '../ui/Button'
import { Input } from '../ui/Input'
import Select from '../ui/Select'
import CamposIndustria from './CamposIndustria'
import { useParams, useRouter } from 'next/navigation'
import { getErrorMessage } from '@/lib/form-utils'
import { ChevronDownIcon, ChevronUpIcon, Package, DollarSign, Tag, Settings, Barcode, X } from 'lucide-react'
import { TipoProductoConfig } from '@/types/enums'
import { Producto } from '@/types/producto'

const UNIDADES = ['UNIDAD', 'KILO', 'LITRO', 'CAJA', 'PAQUETE']
const TIPOS_PRODUCTO = ['GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO']

const baseSchema = z
  .object({
    nombre: z.string().min(1, { message: 'El nombre es obligatorio' }),
    descripcion: z.string().optional(),
    precioCompra: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).positive({ message: 'El precio de compra debe ser mayor a 0' }),
    precioVenta: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).positive({ message: 'El precio de venta debe ser mayor a 0' }),
    stock: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).int({ message: 'Debe ser un número entero' }).nonnegative({ message: 'El stock no puede ser negativo' }),
    stockMinimo: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).int({ message: 'Debe ser un número entero' }).nonnegative({ message: 'El stock mínimo no puede ser negativo' }).optional(),
    unidad: z.string().min(1, { message: 'La unidad es obligatoria' }),
    tipoProducto: z.string().min(1, { message: 'El tipo de producto es obligatorio' }),
    proveedorId: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).optional(),
    etiquetas: z.array(z.string()).optional(),
    talla: z.string().optional(),
    color: z.string().optional(),
    temperaturaOptima: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).optional(),
    humedadOptima: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }).optional(),
    ubicacion: z.string().optional(),
    sku: z.string().optional(),
    codigoBarras: z.string().optional(),
    rfid: z.string().optional(),
  })

type FormData = {
  nombre: string
  descripcion: string
  precioCompra: number
  precioVenta: number
  stock: number
  stockMinimo: number
  unidad: string
  tipoProducto: string
  proveedorId?: number
  etiquetas: string[]
  talla: string
  color: string
  temperaturaOptima?: number
  humedadOptima?: number
  ubicacion: string
  sku: string
  codigoBarras: string
  rfid: string
}

export default function FormularioProducto({ onSuccess, producto }: { onSuccess?: () => void, producto?: Producto }) {

  const etiquetasIniciales = producto?.etiquetas || []   
  const user = useServerUser();
  const { config, camposRelevantes } = useIndustriaConfig();
  const router = useRouter()
  const params = useParams()
  const productoId = params?.id
  const modo = productoId ? 'editar' : 'crear'
  const { api, handleApiCall } = useApi()

  const camposIndustria = camposRelevantes.reduce((acc: any, campo: string) => {
    acc[campo] = z.any().optional()
    return acc
  }, {} as any)

  const schema = baseSchema
  .extend(camposIndustria)
 
  // Usar el nuevo hook de validación
  const {
    data: formData,
    errors,
    isSubmitting,
    serverErrors,
    updateField,
    validateForm,
    handleBlur,
    submitForm,
    clearErrors
  } = useFormValidation<FormData>({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    precioCompra: producto?.precioCompra || 0,
    precioVenta: producto?.precioVenta || 0,
    stock: producto?.stock || 0,
    stockMinimo: producto?.stockMinimo || 0,
    unidad: producto?.unidad || '',
    tipoProducto: producto?.tipoProducto || '',
    proveedorId: producto?.proveedorId || undefined,
    etiquetas: etiquetasIniciales,
    talla: producto?.talla || '',
    color: producto?.color || '',
    temperaturaOptima: producto?.temperaturaOptima || undefined,
    humedadOptima: producto?.humedadOptima || undefined,
    ubicacion: producto?.ubicacion || '',
    sku: producto?.sku || '',
    codigoBarras: producto?.codigoBarras || '',
    rfid: producto?.rfid || '',
  }, {
    schema,
    validateOnChange: true,
    validateOnBlur: true,
    validateOnSubmit: true
  })

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
        const data = await api.proveedores.getAll()
        setProveedores(data as { id: number, nombre: string }[])
      } catch (error) {
        console.error('Error cargando proveedores:', error)
      }
    }
    fetchProveedores()
  }, [api.proveedores])

  const agregarEtiqueta = () => {
    if (inputEtiqueta.trim() && !etiquetas.includes(inputEtiqueta.trim())) {
      const nuevasEtiquetas = [...etiquetas, inputEtiqueta.trim()]
      setEtiquetas(nuevasEtiquetas)
      updateField('etiquetas', nuevasEtiquetas)
      setInputEtiqueta('')
    }
  }

  const eliminarEtiqueta = (index: number) => {
    const nuevasEtiquetas = etiquetas.filter((_, i) => i !== index)
    setEtiquetas(nuevasEtiquetas)
    updateField('etiquetas', nuevasEtiquetas)
  }

  const onSubmit = async (data: FormData) => {
    const submitData = {
      ...data,
      etiquetas: etiquetas,
      empresaId: user?.empresaId
    }

    const success = await submitForm(
      async (formData) => {
        if (modo === 'crear') {
          return await api.productos.create(submitData)
        } else {
          return await api.productos.update(Number(productoId), submitData)
        }
      },
      {
        onSuccess: (result) => {
          onSuccess?.()
          router.push('/dashboard/productos')
        },
        onError: (error: AppError) => {
          console.error('Error al guardar producto:', error)
        }
      }
    )

    return success
  }

  const eliminarProducto = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción lo ocultará del inventario pero podrás restaurarlo desde la papelera.')) {
      return
    }

    setEliminandoProducto(true)
    
    try {
      await handleApiCall(
        () => api.productos.delete(Number(productoId)),
        {
          onSuccess: () => {
            router.push('/dashboard/productos')
          },
          onError: (error) => {
            console.error('Error al eliminar producto:', error)
          }
        }
      )
    } finally {
      setEliminandoProducto(false)
    }
  }

  const renderCampo = (campo: keyof FormData, label: string, tipo: string, opcional: boolean = false) => (
    <Input
      name={campo}
      label={label}
      type={tipo}
      optional={opcional}
      value={formData[campo] || ''}
      onChange={(e) => updateField(campo, e.target.value)}
      onBlur={() => handleBlur(campo)}
      error={errors[campo]}
    />
  )

  const renderCampoNumero = (campo: keyof FormData, label: string, opcional: boolean = false) => (
    <Input
      name={campo}
      label={label}
      type="number"
      optional={opcional}
      value={formData[campo] || ''}
      onChange={(e) => updateField(campo, parseFloat(e.target.value) || 0)}
      onBlur={() => handleBlur(campo)}
      error={errors[campo]}
    />
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {modo === 'crear' ? 'Nuevo Producto' : 'Editar Producto'}
        </h1>
        <p className="text-gray-600">
          {modo === 'crear' 
            ? 'Completa la información del nuevo producto' 
            : 'Modifica la información del producto'
          }
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData) }} className="space-y-8">
        <FormErrorAlert 
          errors={serverErrors} 
          className="mb-6" 
          onClose={clearErrors}
        />

        {/* Información básica y comercial */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Sección: Información básica */}
          <div className="p-6 border-b border-gray-100">
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
              {renderCampo('nombre', 'Nombre del producto *', 'text', false)}
              {renderCampo('descripcion', 'Descripción', 'text', true)}
              
              <Select
                label="Unidad de medida *"
                options={UNIDADES}
                value={formData.unidad}
                onChange={(e) => updateField('unidad', e.target.value)}
                onBlur={() => handleBlur('unidad')}
                error={errors.unidad}
              />

              <Select
                label="Tipo de producto *"
                options={TIPOS_PRODUCTO.map(tipo => ({
                  value: tipo,
                  label: TipoProductoConfig[tipo as keyof typeof TipoProductoConfig]?.label || tipo
                }))}
                value={formData.tipoProducto}
                onChange={(e) => updateField('tipoProducto', e.target.value)}
                onBlur={() => handleBlur('tipoProducto')}
                error={errors.tipoProducto}
              />
            </div>
          </div>

          {/* Sección: Precios y stock */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Precios y stock</h2>
                <p className="text-sm text-gray-600">Información comercial y de inventario</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderCampoNumero('precioCompra', 'Precio de compra *', false)}
              {renderCampoNumero('precioVenta', 'Precio de venta *', false)}
              {renderCampoNumero('stock', 'Stock actual *', false)}
              {renderCampoNumero('stockMinimo', 'Stock mínimo', true)}
              
              <Select
                label="Proveedor"
                options={[
                  { value: '', label: 'Sin proveedor' },
                  ...proveedores.map(p => ({ value: p.id.toString(), label: p.nombre }))
                ]}
                value={formData.proveedorId?.toString() || ''}
                onChange={(e) => updateField('proveedorId', e.target.value ? parseInt(e.target.value) : undefined)}
                onBlur={() => handleBlur('proveedorId')}
                error={errors.proveedorId}
                optional={true}
              />
            </div>
          </div>

          {/* Campos específicos de industria */}
          {camposRelevantes.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Configuración de {config.label}</h2>
                  <p className="text-sm text-gray-600">Campos específicos para tu industria</p>
                </div>
              </div>
              
              <CamposIndustria
                camposRelevantes={camposRelevantes}
                config={config}
                formData={formData}
                updateField={updateField}
                handleBlur={handleBlur}
                errors={errors}
              />
            </div>
          )}

          {/* Sección: Etiquetas */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Tag className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Etiquetas</h2>
                <p className="text-sm text-gray-600">Organiza tu producto con etiquetas</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  name="inputEtiqueta"
                  label=""
                  type="text"
                  value={inputEtiqueta}
                  onChange={(e) => setInputEtiqueta(e.target.value)}
                  placeholder="Agregar etiqueta..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEtiqueta())}
                />
                <Button
                  type="button"
                  onClick={agregarEtiqueta}
                  disabled={!inputEtiqueta.trim()}
                  className="mt-6"
                >
                  Agregar
                </Button>
              </div>
              
              {etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {etiquetas.map((etiqueta, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {etiqueta}
                      <button
                        type="button"
                        onClick={() => eliminarEtiqueta(index)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sección: Campos opcionales */}
          <div className="p-6">
            <button
              type="button"
              onClick={() => setMostrarOpcionales(!mostrarOpcionales)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
              <Barcode className="w-4 h-4" />
              <span>Campos opcionales</span>
              {mostrarOpcionales ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
            
            {mostrarOpcionales && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderCampo('sku', 'SKU', 'text', true)}
                {renderCampo('codigoBarras', 'Código de barras', 'text', true)}
                {renderCampo('rfid', 'RFID', 'text', true)}
                {renderCampo('ubicacion', 'Ubicación', 'text', true)}
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Guardando...' : (modo === 'crear' ? 'Crear Producto' : 'Guardar Cambios')}
            </Button>
            
            <Button
              type="button"
              onClick={() => router.push('/dashboard/productos')}
              className="border border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </Button>
          </div>
          
          {modo === 'editar' && (
            <Button
              type="button"
              onClick={eliminarProducto}
              disabled={eliminandoProducto}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {eliminandoProducto ? 'Eliminando...' : 'Eliminar Producto'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
