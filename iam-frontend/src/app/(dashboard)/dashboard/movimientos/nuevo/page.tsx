// src/app/dashboard/movimientos/nuevo/page.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { FormErrorAlert } from '@/components/ui/FormErrorAlert'
import VolverAtras from '@/components/ui/VolverAtras'
import { 
  Package, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  AlertTriangle, 
  Loader2, 
  CheckCircle, 
  Filter,
  TrendingUp,
  TrendingDown,
  Hash,
  FileText,
  Truck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Proveedor } from '@/types/proveedor'

interface Producto {
  id: number
  nombre: string
  stock: number
  stockMinimo: number
  codigoBarras?: string
  estado?: string
  unidad: string
  precioVenta: number
  proveedor?: {
    id: number
    nombre: string
    email?: string
    telefono?: string
  }
}

export default function NuevoMovimientoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [productosActivos, setProductosActivos] = useState<Producto[]>([])
  const [productosInactivos, setProductosInactivos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [productoId, setProductoId] = useState('')
  const [producto, setProducto] = useState<Producto | null>(null)
  const [proveedorId, setProveedorId] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoadingProductos, setIsLoadingProductos] = useState(true)
  const [isLoadingProveedores, setIsLoadingProveedores] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // Combinar productos activos e inactivos
  const todosLosProductos = [...productosActivos, ...productosInactivos]

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoadingProductos(true)
        setIsLoadingProveedores(true)
        
        // Obtener productos activos
        const responseActivos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos`, { 
          credentials: 'include' 
        })
        const dataActivos = await responseActivos.json()
        setProductosActivos(dataActivos.productos || [])

        // Obtener productos inactivos
        const responseInactivos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/inactivos`, { 
          credentials: 'include' 
        })
        const dataInactivos = await responseInactivos.json()
        setProductosInactivos(dataInactivos || [])

        // Obtener proveedores activos
        const responseProveedores = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores`, { 
          credentials: 'include' 
        })
        const dataProveedores = await responseProveedores.json()
        setProveedores(dataProveedores || [])
      } catch (error) {
        console.error('Error cargando datos:', error)
        setErrors(['Error al cargar los datos. Intenta recargar la página.'])
      } finally {
        setIsLoadingProductos(false)
        setIsLoadingProveedores(false)
      }
    }

    cargarDatos()
  }, [])

  // Preseleccionar proveedor si viene en la URL
  useEffect(() => {
    const proveedorIdFromUrl = searchParams.get('proveedorId')
    if (proveedorIdFromUrl && proveedores.length > 0) {
      const proveedor = proveedores.find(p => p.id === parseInt(proveedorIdFromUrl))
      if (proveedor && proveedor.estado === 'ACTIVO') {
        setProveedorId(proveedorIdFromUrl)
      }
    }
  }, [searchParams, proveedores])

  useEffect(() => {
    if (productoId) {
      const prod = todosLosProductos.find(p => p.id === Number(productoId))
      setProducto(prod || null)
      setCodigoBarras(prod?.codigoBarras || '')
    } else {
      setProducto(null)
      setCodigoBarras('')
    }
  }, [productoId, todosLosProductos])

  // Autofocus al cargar
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Validación de cantidad
  const cantidadValida = () => {
    const n = parseInt(cantidad)
    if (!n || n <= 0) return false
    if (tipo === 'SALIDA' && producto && n > producto.stock) return false
    return true
  }

  const registrarMovimiento = async () => {
    if (!producto || !cantidadValida()) return

    setIsLoading(true)
    setErrors([])

    try {
      const movimientoData: any = {
        tipo,
        cantidad: parseInt(cantidad),
        productoId: producto.id,
        motivo: motivo || undefined,
        descripcion: descripcion || undefined,
      }

      // Agregar proveedorId solo si se seleccionó uno
      if (proveedorId) {
        movimientoData.proveedorId = parseInt(proveedorId)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(movimientoData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Manejar errores específicos de negocio
        if (errorData.details?.code === 'INSUFFICIENT_STOCK') {
          setErrors([
            `Stock insuficiente para "${producto.nombre}". ` +
            `Stock actual: ${errorData.details.stockActual}, ` +
            `cantidad solicitada: ${errorData.details.cantidadSolicitada}. ` +
            `Faltan ${errorData.details.deficit} unidades.`
          ])
          return
        }
        
        if (errorData.details?.code === 'PRODUCT_NOT_FOUND') {
          setErrors(['El producto seleccionado no fue encontrado. Por favor, selecciona otro producto.'])
          return
        }
        
        if (errorData.details?.code === 'INVALID_MOVEMENT') {
          setErrors([`Error en el movimiento: ${errorData.details.motivo}`])
          return
        }
        
        // Error genérico con detalles si están disponibles
        const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`
        setErrors([errorMessage])
        return
      }

      setShowSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/movimientos')
      }, 2000)
    } catch (error) {
      console.error('Error al registrar movimiento:', error)
      setErrors(['Error de conexión. Verifica tu conexión a internet.'])
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar productos activos/inactivos
  const productosFiltrados = todosLosProductos.filter(p => mostrarInactivos ? true : p.estado === 'ACTIVO')

  // Filtrar proveedores activos
  const proveedoresActivos = proveedores.filter(p => p.estado === 'ACTIVO')

  const getStockStatus = (producto: Producto) => {
    if (producto.stock === 0) return { color: 'bg-red-100 text-red-700', text: 'Agotado' }
    if (producto.stock <= producto.stockMinimo) return { color: 'bg-orange-100 text-orange-700', text: 'Crítico' }
    return { color: 'bg-green-100 text-green-700', text: 'Disponible' }
  }

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Nuevo Movimiento</h1>
              <p className="text-gray-600 mt-1">Registra entradas y salidas de inventario</p>
            </div>
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all duration-200",
                mostrarInactivos 
                  ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200" 
                  : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              )}
              onClick={() => setMostrarInactivos(v => !v)}
            >
              <Filter className="w-4 h-4" />
              {mostrarInactivos ? 'Solo activos' : 'Ver todos'}
            </button>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-6">
            <FormErrorAlert errors={errors} />
            
            {/* Selector de producto */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Producto *
              </label>
              <Select
                name="producto"
                label=""
                options={productosFiltrados.map(p => ({ 
                  value: String(p.id), 
                  label: `${p.nombre} ${p.estado !== 'ACTIVO' ? '(Inactivo)' : ''}` 
                }))}
                value={productoId}
                onChange={e => setProductoId(e.target.value)}
                disabled={isLoading || isLoadingProductos}
              />
              {!productoId && productoId !== '' && (
                <p className="text-sm text-red-600">Selecciona un producto</p>
              )}
            </div>

            {/* Código de barras opcional */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Código de Barras (opcional)
              </label>
              <Input
                name="codigoBarras"
                label=""
                placeholder="Escanear o ingresar código de barras..."
                value={codigoBarras}
                onChange={e => setCodigoBarras(e.target.value)}
                ref={inputRef}
                disabled={isLoading}
                className="border-0 shadow-sm focus:shadow-md transition-shadow duration-200"
              />
            </div>

            {/* Información del producto */}
            {producto && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-blue-900 text-lg mb-2">{producto.nombre}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Stock actual:</span>
                        <span className={cn(
                          "ml-2 px-2 py-1 text-xs rounded-full font-medium",
                          getStockStatus(producto).color
                        )}>
                          {producto.stock} {producto.unidad}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Stock mínimo:</span>
                        <span className="ml-2 font-medium text-blue-900">{producto.stockMinimo} {producto.unidad}</span>
                      </div>
                      {producto.codigoBarras && (
                        <div className="col-span-2">
                          <span className="text-blue-700">Código:</span>
                          <span className="ml-2 font-mono text-blue-900">{producto.codigoBarras}</span>
                        </div>
                      )}
                      {producto.proveedor && (
                        <div className="col-span-2">
                          <span className="text-blue-700">Proveedor actual:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Truck className="w-3 h-3 text-blue-600" />
                            <span className="font-medium text-blue-900">{producto.proveedor.nombre}</span>
                            {producto.proveedor.email && (
                              <span className="text-xs text-blue-600">({producto.proveedor.email})</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {producto.stock <= producto.stockMinimo && (
                      <div className="flex items-center gap-2 text-orange-600 text-sm mt-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Stock bajo - Considera hacer un pedido</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tipo de movimiento */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Movimiento *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo('ENTRADA')}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200",
                    tipo === 'ENTRADA'
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <ArrowUp className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Entrada</div>
                    <div className="text-xs opacity-75">Añadir stock</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('SALIDA')}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200",
                    tipo === 'SALIDA'
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Salida</div>
                    <div className="text-xs opacity-75">Reducir stock</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Selector de proveedor */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Proveedor (opcional)
              </label>
              <div className="relative">
                <Select
                  name="proveedor"
                  label=""
                  options={[
                    { value: '', label: 'Seleccionar proveedor...' },
                    ...proveedoresActivos.map(p => ({ 
                      value: String(p.id), 
                      label: p.nombre 
                    }))
                  ]}
                  value={proveedorId}
                  onChange={e => setProveedorId(e.target.value)}
                  disabled={isLoading || isLoadingProveedores}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Truck className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {tipo === 'ENTRADA' 
                    ? 'Asociar el producto a un proveedor para futuras compras'
                    : 'Mostrar proveedor asociado al producto'
                  }
                </p>
                {searchParams.get('proveedorId') && proveedorId && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    Preseleccionado
                  </span>
                )}
              </div>
            </div>

            {/* Cantidad */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cantidad *
              </label>
              <Input
                name="cantidad"
                label=""
                type="number"
                min="1"
                placeholder="Ingresa la cantidad..."
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                disabled={isLoading}
                className="text-lg border-0 shadow-sm focus:shadow-md transition-shadow duration-200"
              />
              {cantidad && !cantidadValida() && (
                <p className="text-sm text-red-600">
                  {tipo === 'SALIDA' && producto 
                    ? `No hay suficiente stock. Máximo disponible: ${producto.stock} ${producto.unidad}`
                    : 'Cantidad inválida'
                  }
                </p>
              )}
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Motivo (opcional)
              </label>
              <Input
                name="motivo"
                label=""
                placeholder="Ej: Compra, Venta, Ajuste de inventario..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                disabled={isLoading}
                className="border-0 shadow-sm focus:shadow-md transition-shadow duration-200"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Descripción (opcional)
              </label>
              <textarea
                name="descripcion"
                placeholder="Descripción adicional del movimiento..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="w-full px-4 py-3 border-0 shadow-sm focus:shadow-md transition-shadow duration-200 resize-none rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:ring-opacity-50"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-6">
              <button
                onClick={registrarMovimiento}
                disabled={isLoading || !producto || !cantidadValida()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 rounded-lg py-3 text-base font-semibold transition-all duration-200 shadow-sm",
                  isLoading || !producto || !cantidadValida()
                    ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                    : tipo === 'ENTRADA'
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg"
                    : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg"
                )}
                type="button"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : tipo === 'ENTRADA' ? (
                  <>
                    <ArrowUp className="w-5 h-5" />
                    Registrar Entrada
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-5 h-5" />
                    Registrar Salida
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/dashboard/movimientos')}
                className="px-6 py-3 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm"
                type="button"
                disabled={isLoading}
              >
                Cancelar
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Toast visual de éxito */}
        {showSuccess && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2">
            <CheckCircle className="w-5 h-5" />
            <div>
              <div className="font-medium">¡Movimiento registrado exitosamente!</div>
              <div className="text-sm opacity-90">Redirigiendo a movimientos...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
