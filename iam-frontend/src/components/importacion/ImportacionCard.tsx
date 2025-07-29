'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Upload,
  FileText,
  Package,
  ShoppingCart,
  Activity,
  Plus,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useImportacionGlobal } from '@/context/ImportacionGlobalContext'
import { useImportacionWebSocket } from '@/hooks/useImportacionWebSocket'
import { useImportacionNotifications } from '@/hooks/useImportacionNotifications'
import WebSocketStatus from './WebSocketStatus'
import UnifiedImportModal from './UnifiedImportModal'
import TrabajosList from './TrabajosList'
import ImportacionStats from './ImportacionStats'
import ImportacionNotifications from './ImportacionNotifications'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'

const tipoConfig = {
  productos: {
    title: 'Productos',
    description: 'Importa tu catálogo de productos',
    icon: Package,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  proveedores: {
    title: 'Proveedores',
    description: 'Importa tu lista de proveedores',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  movimientos: {
    title: 'Movimientos',
    description: 'Importa movimientos de inventario',
    icon: Activity,
    color: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  auto: {
    title: 'Importación Automática',
    description: 'Detecta automáticamente el tipo de datos',
    icon: FileText,
    color: 'bg-green-500',
    badgeColor: 'bg-green-100 text-green-800'
  }
}

export default function ImportacionCard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<TipoImportacion | null>(null)
  
  const { 
    state: { trabajos, isLoadingTrabajos, isImporting },
    loadTrabajos,
    clearError,
    clearSuccess
  } = useImportacionGlobal()

  // Sistema de notificaciones
  const {
    notifications,
    addSuccess,
    addError,
    addWarning,
    addInfo,
    removeNotification
  } = useImportacionNotifications()

  // WebSocket para actualizaciones en tiempo real
  const { isConnected } = useImportacionWebSocket({
    onTrabajoCreado: (trabajoId) => {
      addInfo(
        'Trabajo Creado',
        'Se ha iniciado un nuevo trabajo de importación',
        { duration: 3000 }
      )
      loadTrabajos(true)
    },
    onProgresoActualizado: (trabajoId, progreso, estadisticas) => {
      // Los trabajos se actualizan automáticamente a través del contexto
      if (progreso === 100) {
        addSuccess(
          'Progreso Completado',
          'El trabajo de importación ha finalizado',
          { duration: 5000 }
        )
      }
    },
    onTrabajoCompletado: (trabajoId, resultado) => {
      addSuccess(
        'Importación Completada',
        'El trabajo de importación se ha completado exitosamente',
        { duration: 8000 }
      )
      loadTrabajos(true)
      clearSuccess()
    },
    onError: (trabajoId, error) => {
      addError(
        'Error en Importación',
        `Se ha producido un error en el trabajo: ${error}`,
        { duration: 10000 }
      )
    }
  })

  const handleOpenModal = useCallback((tipo?: TipoImportacion) => {
    setSelectedTipo(tipo || null)
    setIsModalOpen(true)
    clearError()
    clearSuccess()
  }, [clearError, clearSuccess])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedTipo(null)
  }, [])

  const handleTipoSelect = useCallback((tipo: TipoImportacion) => {
    setSelectedTipo(tipo)
  }, [])

  const trabajosActivos = trabajos.filter(t => 
    t.estado === 'procesando' || t.estado === 'pendiente'
  )

  const trabajosCompletados = trabajos.filter(t => 
    t.estado === 'completado' || t.estado === 'error'
  )

  return (
    <>
      <div className="space-y-6">
        {/* Header con estado WebSocket */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Importación</h2>
            <WebSocketStatus showDetails={true} />
          </div>
          
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Importación
          </Button>
        </div>

        {/* Estadísticas */}
        <ImportacionStats 
          trabajos={trabajos}
          isLoading={isLoadingTrabajos}
          isConnected={isConnected}
        />

        {/* Tipos de importación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Tipos de Importación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(tipoConfig).map(([tipo, config]) => {
                const IconComponent = config.icon
                return (
                  <div
                    key={tipo}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOpenModal(tipo as TipoImportacion)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{config.title}</h3>
                        <p className="text-sm text-gray-600">{config.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Trabajos activos */}
        {trabajosActivos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Trabajos Activos
                <Badge variant="secondary">{trabajosActivos.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrabajosList 
                trabajos={trabajosActivos}
                showProgress={true}
                showActions={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Trabajos completados */}
        {trabajosCompletados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Trabajos Completados
                <Badge variant="secondary">{trabajosCompletados.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrabajosList 
                trabajos={trabajosCompletados}
                showProgress={false}
                showActions={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Modal de importación */}
        <UnifiedImportModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>

      {/* Notificaciones */}
      <ImportacionNotifications
        notifications={notifications}
        onClose={removeNotification}
        maxNotifications={5}
        position="top-right"
      />
    </>
  )
} 