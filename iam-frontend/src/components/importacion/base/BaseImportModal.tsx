'use client'

import React, { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { X, AlertTriangle } from 'lucide-react'


interface BaseImportModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  showWebSocketStatus?: boolean
  className?: string
}

export default function BaseImportModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  showWebSocketStatus = true,
  className = ''
}: BaseImportModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

            </div>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar alertas de WebSocket
export function WebSocketAlert({ isConnected }: { isConnected: boolean }) {
  if (isConnected) return null

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <span className="text-yellow-800 text-sm">
          Sin conexión en tiempo real. Los datos pueden no estar actualizados.
        </span>
      </div>
    </div>
  )
} 