'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ubicacion } from '@/types/sensor'
import { Card, CardContent } from '@/components/ui/Card'
import  Button  from '@/components/ui/Button'
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Radio, 
  Package, 
  Activity,
  History,
  Settings,
  Plus
} from 'lucide-react'
import { UbicacionInfo } from './components/UbicacionInfo'
import { SensoresTab } from './components/SensoresTab'
import { TiempoRealTab } from './components/TiempoRealTab'
import { HistorialTab } from './components/HistorialTab'
import { ConfiguracionTab } from './components/ConfiguracionTab'

type TabType = 'info' | 'sensores' | 'tiempo-real' | 'historial' | 'configuracion'

interface UbicacionDetalleClientProps {
  ubicacion: Ubicacion
}

export function UbicacionDetalleClient({ ubicacion }: UbicacionDetalleClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('info')

  const tabs = [
    {
      id: 'info' as TabType,
      label: 'Información',
      icon: MapPin,
      description: 'Detalles generales de la ubicación'
    },
    {
      id: 'sensores' as TabType,
      label: 'Sensores',
      icon: Radio,
      description: 'Gestionar sensores de la ubicación'
    },
    {
      id: 'tiempo-real' as TabType,
      label: 'Tiempo Real',
      icon: Activity,
      description: 'Monitoreo en tiempo real'
    },
    {
      id: 'historial' as TabType,
      label: 'Historial',
      icon: History,
      description: 'Historial de lecturas y eventos'
    },
    {
      id: 'configuracion' as TabType,
      label: 'Configuración',
      icon: Settings,
      description: 'Configurar alertas y parámetros'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <UbicacionInfo ubicacion={ubicacion} />
      case 'sensores':
        return <SensoresTab ubicacion={ubicacion} />
      case 'tiempo-real':
        return <TiempoRealTab ubicacion={ubicacion} />
      case 'historial':
        return <HistorialTab ubicacion={ubicacion} />
      case 'configuracion':
        return <ConfiguracionTab ubicacion={ubicacion} />
      default:
        return <UbicacionInfo ubicacion={ubicacion} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/ubicaciones')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ubicacion.nombre}</h1>
            <p className="text-gray-600 mt-1">
              {ubicacion.descripcion || 'Sin descripción'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setActiveTab('sensores')}
            className="bg-[#8E94F2] text-white hover:bg-[#7278e0]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Sensor
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab('info')}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sensores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ubicacion._count?.sensores || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Radio className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ubicacion._count?.productos || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ubicacion.activa ? 'Activa' : 'Inactiva'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                ubicacion.activa ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <MapPin className={`w-6 h-6 ${
                  ubicacion.activa ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas */}
      <Card>
        <CardContent className="p-0">
          {/* Navegación de pestañas */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-[#8E94F2] text-[#8E94F2]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Contenido de la pestaña */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 