'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  X,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Tipos de notificación
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

// Interfaz para una notificación
export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  progress?: number
  timestamp: Date
}

// Contexto para el sistema de notificaciones
interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => string
  removeToast: (id: string) => void
  updateToast: (id: string, updates: Partial<Toast>) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Hook para usar el contexto
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe ser usado dentro de ToastProvider')
  }
  return context
}

// Configuración de iconos y colores
const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-500',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-500',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-500',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600'
  },
  loading: {
    icon: Loader2,
    bgColor: 'bg-gray-500',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    iconColor: 'text-gray-600'
  }
}

// Componente individual de toast
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = toastConfig[toast.type]
  const Icon = config.icon
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const startTime = Date.now()
      const endTime = startTime + toast.duration

      const updateProgress = () => {
        const now = Date.now()
        const remaining = Math.max(0, endTime - now)
        const newProgress = toast.duration ? (remaining / toast.duration) * 100 : 0

        if (newProgress <= 0) {
          handleRemove()
        } else {
          setProgress(newProgress)
          requestAnimationFrame(updateProgress)
        }
      }

      requestAnimationFrame(updateProgress)
    }
  }, [toast.duration])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(toast.id), 300)
  }

  return (
    <div
      className={cn(
        'relative transform transition-all duration-300 ease-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className={cn(
        'bg-white border rounded-lg shadow-lg p-4 min-w-[320px] max-w-[480px]',
        config.borderColor
      )}>
        {/* Barra de progreso */}
        {toast.duration && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
            <div
              className={cn('h-full transition-all duration-100', config.bgColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
            <Icon className={cn(
              'w-5 h-5',
              toast.type === 'loading' && 'animate-spin'
            )} />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className={cn('font-medium text-sm', config.textColor)}>
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className={cn('text-sm mt-1 opacity-90', config.textColor)}>
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Botón de cerrar */}
              <button
                onClick={handleRemove}
                className={cn(
                  'flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors',
                  config.textColor
                )}
              >
                <X className="w-4 w-4" />
              </button>
            </div>

            {/* Acción */}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className={cn(
                  'mt-2 text-sm font-medium hover:underline',
                  config.textColor
                )}
              >
                {toast.action.label}
              </button>
            )}

            {/* Progreso personalizado */}
            {toast.progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all duration-300', config.bgColor)}
                    style={{ width: `${toast.progress}%` }}
                  />
                </div>
                <p className={cn('text-xs mt-1', config.textColor)}>
                  {toast.progress}% completado
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Contenedor de toasts
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  )
}

// Provider del contexto
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      timestamp: new Date()
    }

    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    updateToast,
    clearAll
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// Hooks de conveniencia
export function useImportacionToast() {
  const { addToast, updateToast } = useToast()

  const showTrabajoCreado = useCallback((trabajoId: string, tipo: string) => {
    return addToast({
      type: 'info',
      title: 'Trabajo de importación creado',
      message: `Se ha iniciado la importación de ${tipo}`,
      duration: 5000
    })
  }, [addToast])

  const showProgresoActualizado = useCallback((trabajoId: string, progreso: number) => {
    return addToast({
      type: 'loading',
      title: 'Progreso de importación',
      message: `Procesando registros...`,
      progress: progreso,
      duration: 0 // Sin auto-close
    })
  }, [addToast])

  const showTrabajoCompletado = useCallback((trabajoId: string, registrosExitosos: number) => {
    return addToast({
      type: 'success',
      title: '¡Importación completada!',
      message: `${registrosExitosos} registros procesados exitosamente`,
      duration: 8000,
      action: {
        label: 'Ver detalles',
        onClick: () => {
          // Navegar a la página de trabajos
          window.location.href = '/dashboard/importacion/trabajos'
        }
      }
    })
  }, [addToast])

  const showTrabajoError = useCallback((trabajoId: string, error: string) => {
    return addToast({
      type: 'error',
      title: 'Error en importación',
      message: error,
      duration: 10000,
      action: {
        label: 'Ver errores',
        onClick: () => {
          // Navegar a la página de errores
          window.location.href = `/dashboard/importacion/trabajos/${trabajoId}/errores`
        }
      }
    })
  }, [addToast])

  const showValidacionError = useCallback((trabajoId: string, erroresCount: number) => {
    return addToast({
      type: 'warning',
      title: 'Errores de validación',
      message: `Se encontraron ${erroresCount} errores de validación`,
      duration: 8000,
      action: {
        label: 'Descargar errores',
        onClick: () => {
          // Descargar reporte de errores
          window.open(`/api/importacion/trabajos/${trabajoId}/errores/descargar`, '_blank')
        }
      }
    })
  }, [addToast])

  return {
    showTrabajoCreado,
    showProgresoActualizado,
    showTrabajoCompletado,
    showTrabajoError,
    showValidacionError,
    updateToast
  }
} 