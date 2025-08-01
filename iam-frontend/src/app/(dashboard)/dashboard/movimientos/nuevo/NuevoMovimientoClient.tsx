'use client'

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
  AlertTriangle, 
  Loader2, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Hash,
  Truck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Proveedor } from '@/types/proveedor'
import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { normalizeApiResponse } from '@/lib/api'

interface Producto {
  id: number
  nombre: string
  stock: number
  stockMinimo: number
  codigoBarras?: string
  estado?: string
  unidad: string
  precioVenta: number
  precioCompra?: number
  proveedor?: {
    id: number
    nombre: string
    email?: string
    telefono?: string
  }
}

// Subcomponente: Campos del formulario
interface MovimientoFieldsProps {
  tipo: string
  setTipo: (tipo: 'ENTRADA' | 'SALIDA') => void
  productoId: string
  setProductoId: (id: string) => void
  productosActivos: Producto[]
  productosInactivos: Producto[]
  cantidad: string
  setCantidad: (cantidad: string) => void
  proveedorId: string
  setProveedorId: (id: string) => void
  proveedores: Array<{ id: number; nombre: string; estado: string }>
  motivo: string
  setMotivo: (motivo: string) => void
  descripcion: string
  setDescripcion: (descripcion: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  producto: Producto | null
  
  // ✅ NUEVO: Campos de precio
  precioUnitario: string
  setPrecioUnitario: (precio: string) => void
  precioTotal: string
  setPrecioTotal: (precio: string) => void
  tipoPrecio: string
  setTipoPrecio: (tipo: string) => void
}

function MovimientoFields({
  tipo, setTipo,
  productoId, setProductoId,
  productosActivos, productosInactivos,
  cantidad, setCantidad,
  proveedorId, setProveedorId,
  proveedores,
  motivo, setMotivo,
  descripcion, setDescripcion,
  inputRef,
  producto,
  // ✅ NUEVO: Campos de precio
  precioUnitario, setPrecioUnitario,
  precioTotal, setPrecioTotal,
  tipoPrecio, setTipoPrecio
}: MovimientoFieldsProps) {
  
  // ✅ NUEVO: Actualizar precio total cuando cambien cantidad o precio unitario
  useEffect(() => {
    const calcularPrecioTotal = () => {
      if (precioUnitario && cantidad) {
        const unitario = parseFloat(precioUnitario)
        const cant = parseInt(cantidad)
        if (!isNaN(unitario) && !isNaN(cant)) {
          setPrecioTotal((unitario * cant).toFixed(2))
        }
      }
    }
    calcularPrecioTotal()
  }, [precioUnitario, cantidad])

  // ✅ NUEVO: Establecer precio unitario por defecto según tipo de movimiento
  useEffect(() => {
    if (producto && !precioUnitario) {
      if (tipo === 'ENTRADA') {
        setPrecioUnitario(producto.precioCompra?.toString() || '0')
        setTipoPrecio('COMPRA')
      } else {
        setPrecioUnitario(producto.precioVenta?.toString() || '0')
        setTipoPrecio('VENTA')
      }
    }
  }, [producto, tipo, precioUnitario, setPrecioUnitario, setTipoPrecio])

  return (
    <div className="space-y-6">
      {/* Tipo de movimiento */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Tipo de Movimiento</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTipo('ENTRADA')}
            className={cn(
              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
              tipo === 'ENTRADA'
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-green-300"
            )}
          >
            <ArrowDown className="w-5 h-5" />
            <span className="font-medium">Entrada</span>
          </button>
          <button
            type="button"
            onClick={() => setTipo('SALIDA')}
            className={cn(
              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
              tipo === 'SALIDA'
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-red-300"
            )}
          >
            <ArrowUp className="w-5 h-5" />
            <span className="font-medium">Salida</span>
          </button>
        </div>
      </div>
      
      <Select
        label="Producto *"
        name="productoId"
        value={productoId}
        onChange={(e) => setProductoId(e.target.value)}
        required
        options={[
          ...productosActivos.map((prod: Producto) => ({
            value: String(prod.id),
            label: `${prod.nombre} - Stock: ${prod.stock} ${prod.unidad}`
          })),
          ...productosInactivos.map((prod: Producto) => ({
            value: String(prod.id),
            label: `${prod.nombre} - Stock: ${prod.stock} ${prod.unidad} (Inactivo)`
          }))
        ]}
      />
      
      <Input
        label="Cantidad *"
        name="cantidad"
        type="number"
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        placeholder="Ingresa la cantidad"
        min="1"
        required
        ref={inputRef}
      />
      
      {producto && tipo === 'SALIDA' && parseInt(cantidad) > producto.stock && (
        <p className="text-red-600 text-sm mt-1">
          Stock insuficiente. Stock actual: {producto.stock} {producto.unidad}
        </p>
      )}

      {/* ✅ NUEVO: Campos de precio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio Unitario
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={precioUnitario}
            onChange={(e) => setPrecioUnitario(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio Total
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={precioTotal}
            onChange={(e) => setPrecioTotal(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Precio
          </label>
          <select
            value={tipoPrecio}
            onChange={(e) => setTipoPrecio(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
          >
            <option value="COMPRA">Compra</option>
            <option value="VENTA">Venta</option>
            <option value="AJUSTE">Ajuste</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </div>
      </div>
      
      <Select
        label="Proveedor (opcional)"
        name="proveedorId"
        value={proveedorId}
        onChange={(e) => setProveedorId(e.target.value)}
        options={[
          { value: '', label: 'Sin proveedor' },
          ...proveedores.filter((p) => p.estado === 'ACTIVO').map((proveedor) => ({
            value: String(proveedor.id),
            label: proveedor.nombre
          }))
        ]}
      />
      
      <Input
        label="Motivo"
        name="motivo"
        type="text"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Ej: Compra, Venta, Ajuste de inventario..."
      />
      
      <Input
        label="Descripción (opcional)"
        name="descripcion"
        type="text"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción adicional del movimiento..."
      />
    </div>
  )
}

// Subcomponente: Información del producto seleccionado
interface ProductoInfoCardProps {
  producto: Producto | null
  getStockStatus: (producto: Producto) => { status: string; color: string; bg: string }
}

function ProductoInfoCard({ producto, getStockStatus }: ProductoInfoCardProps) {
  if (!producto) return null
  const status = getStockStatus(producto)
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Producto</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
            <p className="text-sm text-gray-600">ID: {producto.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Stock Actual</p>
              <p className="text-lg font-semibold text-gray-900">
                {producto.stock} {producto.unidad}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Mínimo</p>
              <p className="text-lg font-semibold text-gray-900">
                {producto.stockMinimo} {producto.unidad}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Estado del Stock</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
              {status.status === 'agotado' && <AlertTriangle className="w-4 h-4 mr-1" />}
              {status.status === 'crítico' && <AlertTriangle className="w-4 h-4 mr-1" />}
              {status.status === 'bajo' && <TrendingDown className="w-4 h-4 mr-1" />}
              {status.status === 'normal' && <TrendingUp className="w-4 h-4 mr-1" />}
              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
            </span>
          </div>
          {producto.codigoBarras && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Código de Barras</p>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {producto.codigoBarras}
                </code>
              </div>
            </div>
          )}
          {producto.proveedor && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Proveedor Principal</p>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{producto.proveedor.nombre}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Subcomponente: Resumen del movimiento
interface MovimientoResumenProps {
  producto: Producto | null
  cantidad: string
  tipo: string
  precioUnitario: string
  precioTotal: string
  tipoPrecio: string
}

function MovimientoResumen({ producto, cantidad, tipo, precioUnitario, precioTotal, tipoPrecio }: MovimientoResumenProps) {
  if (!producto || !cantidad) return null
  
  const precioUnitarioNum = parseFloat(precioUnitario) || 0
  const precioTotalNum = parseFloat(precioTotal) || 0
  const cantidadNum = parseInt(cantidad) || 0
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen del Movimiento</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Tipo:</span>
            <span className={`font-medium ${
              tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
            }`}>
              {tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Producto:</span>
            <span className="font-medium text-gray-900">{producto.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cantidad:</span>
            <span className="font-medium text-gray-900">
              {cantidad} {producto.unidad}
            </span>
          </div>
          
          {/* ✅ NUEVO: Información de precios */}
          {precioUnitarioNum > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio Unitario:</span>
                <span className="font-medium text-gray-900">
                  ${precioUnitarioNum.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio Total:</span>
                <span className="font-medium text-gray-900">
                  ${precioTotalNum.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo de Precio:</span>
                <span className="font-medium text-gray-900">
                  {tipoPrecio === 'COMPRA' ? 'Compra' : 
                   tipoPrecio === 'VENTA' ? 'Venta' : 
                   tipoPrecio === 'AJUSTE' ? 'Ajuste' : 'Transferencia'}
                </span>
              </div>
            </>
          )}
          
          {tipo === 'SALIDA' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Stock después:</span>
              <span className={`font-medium ${
                producto.stock - cantidadNum <= producto.stockMinimo 
                  ? 'text-red-600' 
                  : 'text-gray-900'
              }`}>
                {producto.stock - cantidadNum} {producto.unidad}
              </span>
            </div>
          )}
          {tipo === 'ENTRADA' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Stock después:</span>
              <span className="font-medium text-gray-900">
                {producto.stock + cantidadNum} {producto.unidad}
              </span>
            </div>
          )}
          
          {/* ✅ NUEVO: Validación de precios */}
          {precioUnitarioNum > 0 && precioTotalNum > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Cálculo:</span>
                <span className="text-blue-700">
                  ${precioUnitarioNum.toFixed(2)} × {cantidadNum} = ${(precioUnitarioNum * cantidadNum).toFixed(2)}
                </span>
              </div>
              {Math.abs(precioTotalNum - (precioUnitarioNum * cantidadNum)) > 0.01 && (
                <div className="mt-2 text-sm text-orange-600">
                  ⚠️ El precio total no coincide con el cálculo
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function NuevoMovimientoClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [productosActivos, setProductosActivos] = useState<Producto[]>([])
  const [productosInactivos, setProductosInactivos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])

  const [productoId, setProductoId] = useState('')
  const [producto, setProducto] = useState<Producto | null>(null)
  const [proveedorId, setProveedorId] = useState('')

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

  // ✅ NUEVO: Campos de precio
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [tipoPrecio, setTipoPrecio] = useState('COMPRA')

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
        setProductosInactivos(normalizeApiResponse(dataInactivos))

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
    const proveedorIdFromUrl = searchParams?.get('proveedorId')
    if (proveedorIdFromUrl && proveedores.length > 0) {
      const proveedor = proveedores.find(p => p.id === parseInt(proveedorIdFromUrl))
      if (proveedor && proveedor.estado === 'ACTIVO') {
        setProveedorId(proveedorIdFromUrl)
      }
    }
  }, [searchParams, proveedores])

  useEffect(() => {
    if (productoId) {
      const todosLosProductos = [...productosActivos, ...productosInactivos]
      const prod = todosLosProductos.find(p => p.id === Number(productoId))
      setProducto(prod || null)
    } else {
      setProducto(null)
    }
  }, [productoId, productosActivos, productosInactivos])

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
      const movimientoData: {
        tipo: string
        cantidad: number
        productoId: number
        motivo?: string
        descripcion?: string
        proveedorId?: number
        precioUnitario?: number
        precioTotal?: number
        tipoPrecio?: string
      } = {
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

      // Agregar precioUnitario y precioTotal solo si son números válidos
      if (precioUnitario && !isNaN(parseFloat(precioUnitario))) {
        movimientoData.precioUnitario = parseFloat(precioUnitario)
      }
      if (precioTotal && !isNaN(parseFloat(precioTotal))) {
        movimientoData.precioTotal = parseFloat(precioTotal)
      }
      if (tipoPrecio && movimientoData.precioUnitario !== undefined) {
        movimientoData.tipoPrecio = tipoPrecio
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
      setErrors(['Error de conexión. Verifica tu conexión a internet e intenta nuevamente.'])
    } finally {
      setIsLoading(false)
    }
  }

  const getStockStatus = (producto: Producto) => {
    if (producto.stock === 0) return { status: 'agotado', color: 'text-red-600', bg: 'bg-red-50' }
    if (producto.stock <= producto.stockMinimo) return { status: 'crítico', color: 'text-orange-600', bg: 'bg-orange-50' }
    if (producto.stock <= producto.stockMinimo * 2) return { status: 'bajo', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { status: 'normal', color: 'text-green-600', bg: 'bg-green-50' }
  }

  if (isLoadingProductos || isLoadingProveedores) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Si hay producto seleccionado, usar grid de dos columnas
  if (producto) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nuevo Movimiento</h1>
          <p className="text-gray-600">Registra un nuevo movimiento de inventario</p>
        </div>
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">Movimiento registrado exitosamente</p>
              <p className="text-green-700 text-sm">Redirigiendo a la lista de movimientos...</p>
            </div>
          </div>
        )}
        {errors.length > 0 && <FormErrorAlert errors={errors} />}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Formulario principal */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Información del Movimiento</h2>
              
              <MovimientoFields
                tipo={tipo}
                setTipo={setTipo}
                productoId={productoId}
                setProductoId={setProductoId}
                productosActivos={productosActivos}
                productosInactivos={productosInactivos}
                cantidad={cantidad}
                setCantidad={setCantidad}
                proveedorId={proveedorId}
                setProveedorId={setProveedorId}
                proveedores={proveedores}
                motivo={motivo}
                setMotivo={setMotivo}
                descripcion={descripcion}
                setDescripcion={setDescripcion}
                inputRef={inputRef}
                producto={producto}
                // ✅ NUEVO: Pasar nuevos campos de precio
                precioUnitario={precioUnitario}
                setPrecioUnitario={setPrecioUnitario}
                precioTotal={precioTotal}
                setPrecioTotal={setPrecioTotal}
                tipoPrecio={tipoPrecio}
                setTipoPrecio={setTipoPrecio}
              />

              <Button
                onClick={registrarMovimiento}
                disabled={!producto || !cantidadValida() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Registrar Movimiento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          {/* Información del producto seleccionado y resumen */}
          <div className="space-y-6">
            {producto && (
              <ProductoInfoCard producto={producto} getStockStatus={getStockStatus} />
            )}

            {/* Resumen del movimiento */}
            {producto && cantidad && (
              <MovimientoResumen 
                producto={producto} 
                cantidad={cantidad} 
                tipo={tipo} 
                precioUnitario={precioUnitario}
                precioTotal={precioTotal}
                tipoPrecio={tipoPrecio}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Si NO hay producto seleccionado, centrar el formulario
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f7f8fa]">
      <div className="w-full max-w-2xl mx-auto p-6">
        <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nuevo Movimiento</h1>
          <p className="text-gray-600">Registra un nuevo movimiento de inventario</p>
        </div>
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">Movimiento registrado exitosamente</p>
              <p className="text-green-700 text-sm">Redirigiendo a la lista de movimientos...</p>
            </div>
          </div>
        )}
        {errors.length > 0 && <FormErrorAlert errors={errors} />}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información del Movimiento</h2>
            
            <MovimientoFields
              tipo={tipo}
              setTipo={setTipo}
              productoId={productoId}
              setProductoId={setProductoId}
              productosActivos={productosActivos}
              productosInactivos={productosInactivos}
              cantidad={cantidad}
              setCantidad={setCantidad}
              proveedorId={proveedorId}
              setProveedorId={setProveedorId}
              proveedores={proveedores}
              motivo={motivo}
              setMotivo={setMotivo}
              descripcion={descripcion}
              setDescripcion={setDescripcion}
              inputRef={inputRef}
              producto={producto}
              // ✅ NUEVO: Pasar nuevos campos de precio
              precioUnitario={precioUnitario}
              setPrecioUnitario={setPrecioUnitario}
              precioTotal={precioTotal}
              setPrecioTotal={setPrecioTotal}
              tipoPrecio={tipoPrecio}
              setTipoPrecio={setTipoPrecio}
            />

            <Button
              onClick={registrarMovimiento}
              disabled={!producto || !cantidadValida() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Registrar Movimiento
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 