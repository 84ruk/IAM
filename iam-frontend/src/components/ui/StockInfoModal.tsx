import { useState, useEffect } from 'react'
import { X, Package, AlertTriangle, CheckCircle, TrendingUp, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StockInfoModalProps {
  isOpen: boolean
  onClose: () => void
  producto: {
    nombre: string
    stock: number
    stockMinimo: number
    unidad: string
  } | null
}

export default function StockInfoModal({ isOpen, onClose, producto }: StockInfoModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible || !producto) return null

  const getStockStatus = () => {
    if (producto.stock === 0) {
      return {
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle,
        text: 'Agotado',
        description: 'No hay stock disponible'
      }
    }
    if (producto.stock <= producto.stockMinimo) {
      return {
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: AlertTriangle,
        text: 'Stock Crítico',
        description: 'Stock por debajo del mínimo recomendado'
      }
    }
    if (producto.stock > producto.stockMinimo * 3) {
      return {
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: TrendingUp,
        text: 'Stock Alto',
        description: 'Stock significativamente por encima del mínimo'
      }
    }
    return {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      text: 'Stock Normal',
      description: 'Stock dentro del rango recomendado'
    }
  }

  const stockStatus = getStockStatus()
  const StatusIcon = stockStatus.icon

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200",
      isOpen ? "opacity-100" : "opacity-0"
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200",
        isOpen ? "scale-100" : "scale-95"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Información de Stock</h2>
              <p className="text-sm text-gray-600">Estado actual del inventario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Producto */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Producto</h3>
            <p className="text-gray-600">{producto.nombre}</p>
          </div>

          {/* Estado del stock */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3">Estado del Stock</h3>
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg border",
              stockStatus.color
            )}>
              <StatusIcon className="w-5 h-5" />
              <div>
                <p className="font-medium">{stockStatus.text}</p>
                <p className="text-sm opacity-80">{stockStatus.description}</p>
              </div>
            </div>
          </div>

          {/* Detalles del stock */}
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Stock Actual</span>
              </div>
              <span className="font-semibold text-gray-800">
                {producto.stock} {producto.unidad.toLowerCase()}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Stock Mínimo</span>
              </div>
              <span className="font-semibold text-gray-800">
                {producto.stockMinimo} {producto.unidad.toLowerCase()}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Diferencia</span>
              <span className={cn(
                "font-semibold",
                producto.stock > producto.stockMinimo ? "text-green-600" : "text-red-600"
              )}>
                {producto.stock > producto.stockMinimo ? '+' : ''}
                {producto.stock - producto.stockMinimo} {producto.unidad.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Recomendaciones */}
          {producto.stock <= producto.stockMinimo && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-orange-800 mb-1">Recomendación</h4>
                  <p className="text-sm text-orange-700">
                    Considera realizar un pedido para reponer el stock y evitar quedarte sin inventario.
                  </p>
                </div>
              </div>
            </div>
          )}

          {producto.stock > producto.stockMinimo * 3 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Recomendación</h4>
                  <p className="text-sm text-yellow-700">
                    El stock está alto. Considera ajustar el stock mínimo o revisar la rotación del producto.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
} 