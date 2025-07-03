'use client'

import { useIndustriaConfig } from '@/hooks/useIndustriaConfig'
import { Card } from '@/components/ui/Card'
import { Thermometer, Droplets, Package, Tag, TrendingUp, AlertTriangle } from 'lucide-react'

interface DashboardIndustriaProps {
  estadisticas: {
    totalProductos: number
    productosAgotados: number
    productosBajoStock: number
    valorInventario: number
    temperaturaPromedio?: number
    humedadPromedio?: number
  }
}

export default function DashboardIndustria({ estadisticas }: DashboardIndustriaProps) {
  const { config, tieneSensores, mostrarTemperaturaHumedad, tipoIndustria } = useIndustriaConfig()

  const renderMetricaIndustria = () => {
    switch (tipoIndustria) {
      case 'ALIMENTOS':
      case 'FARMACIA':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Thermometer className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Temperatura Promedio</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {estadisticas.temperaturaPromedio ? `${estadisticas.temperaturaPromedio}°C` : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Droplets className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Humedad Promedio</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {estadisticas.humedadPromedio ? `${estadisticas.humedadPromedio}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )

      case 'ROPA':
        return (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Productos con Variantes</p>
                <p className="text-2xl font-bold text-gray-800">
                  {estadisticas.totalProductos} productos
                </p>
                <p className="text-xs text-gray-500">Con tallas y colores</p>
              </div>
            </div>
          </Card>
        )

      case 'ELECTRONICA':
        return (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Productos con SKU</p>
                <p className="text-2xl font-bold text-gray-800">
                  {estadisticas.totalProductos} productos
                </p>
                <p className="text-xs text-gray-500">Con códigos de barras y RFID</p>
              </div>
            </div>
          </Card>
        )

      default:
        return null
    }
  }

  const renderAlertasIndustria = () => {
    const alertas = []

    // Alertas específicas por industria
    if (tipoIndustria === 'ALIMENTOS' || tipoIndustria === 'FARMACIA') {
      if (estadisticas.temperaturaPromedio && estadisticas.temperaturaPromedio > 25) {
        alertas.push({
          tipo: 'warning',
          mensaje: 'Temperatura elevada detectada en algunos productos',
          icono: <Thermometer className="w-4 h-4" />
        })
      }
      
      if (estadisticas.humedadPromedio && estadisticas.humedadPromedio > 70) {
        alertas.push({
          tipo: 'warning',
          mensaje: 'Humedad alta detectada en algunos productos',
          icono: <Droplets className="w-4 h-4" />
        })
      }
    }

    if (estadisticas.productosAgotados > 0) {
      alertas.push({
        tipo: 'error',
        mensaje: `${estadisticas.productosAgotados} productos agotados`,
        icono: <AlertTriangle className="w-4 h-4" />
      })
    }

    if (estadisticas.productosBajoStock > 0) {
      alertas.push({
        tipo: 'warning',
        mensaje: `${estadisticas.productosBajoStock} productos con stock bajo`,
        icono: <TrendingUp className="w-4 h-4" />
      })
    }

    return alertas
  }

  const alertas = renderAlertasIndustria()

  return (
    <div className="space-y-6">
      {/* Métricas específicas de la industria */}
      {renderMetricaIndustria()}

      {/* Alertas específicas */}
      {alertas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Alertas de {config.label}</h3>
          {alertas.map((alerta, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 flex items-center gap-3 ${
                alerta.tipo === 'error' 
                  ? 'bg-red-50 border-red-400 text-red-700' 
                  : 'bg-yellow-50 border-yellow-400 text-yellow-700'
              }`}
            >
              {alerta.icono}
              <span className="text-sm font-medium">{alerta.mensaje}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 