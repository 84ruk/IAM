'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Info, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface TipoPlantilla {
  tipo: string
  nombre: string
  descripcion: string
}

interface PlantillaInfo {
  tipo: string
  nombre: string
  descripcion: string
  columnasRequeridas: string[]
  columnasOpcionales: string[]
  validaciones: string[]
  limites: {
    maxRegistros: number
    maxTamanoArchivo: string
  }
}

export default function DescargaPlantillas() {
  const [plantillas, setPlantillas] = useState<TipoPlantilla[]>([])
  const [plantillaInfo, setPlantillaInfo] = useState<PlantillaInfo | null>(null)
  const [descargando, setDescargando] = useState<string | null>(null)
  const [cargandoInfo, setCargandoInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  // Cargar tipos de plantillas al montar el componente
  useState(() => {
    cargarTiposPlantillas()
  })

  const cargarTiposPlantillas = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plantillas`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al cargar tipos de plantillas')
      }

      const data = await response.json()
      setPlantillas(data.data || [])
    } catch (error) {
      console.error('Error cargando plantillas:', error)
      setError('No se pudieron cargar los tipos de plantillas disponibles')
    }
  }

  const obtenerInfoPlantilla = async (tipo: string) => {
    setCargandoInfo(tipo)
    setError(null)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plantillas/${tipo}/info`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al obtener información de la plantilla')
      }

      const data = await response.json()
      setPlantillaInfo(data.data)
    } catch (error) {
      console.error('Error obteniendo info de plantilla:', error)
      setError('No se pudo obtener la información de la plantilla')
    } finally {
      setCargandoInfo(null)
    }
  }

  const descargarPlantilla = async (tipo: string, nombre: string) => {
    setDescargando(tipo)
    setError(null)
    setExito(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plantillas/${tipo}/descargar`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al descargar la plantilla')
      }

      // Crear blob y descargar archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `plantilla_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setExito(`Plantilla "${nombre}" descargada exitosamente`)
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setExito(null), 3000)

    } catch (error) {
      console.error('Error descargando plantilla:', error)
      setError(`Error al descargar la plantilla: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setDescargando(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Descargar Plantillas</h2>
          <p className="text-sm text-gray-600">
            Descarga plantillas Excel preconfiguricas para importar datos al sistema
          </p>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {exito && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700">{exito}</span>
        </div>
      )}

      {/* Lista de plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plantillas.map((plantilla) => (
          <Card key={plantilla.tipo} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{plantilla.nombre}</h3>
                    <p className="text-sm text-gray-600 mt-1">{plantilla.descripcion}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Botón de información */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => obtenerInfoPlantilla(plantilla.tipo)}
                  disabled={cargandoInfo === plantilla.tipo}
                  className="w-full"
                >
                  {cargandoInfo === plantilla.tipo ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Info className="w-4 h-4 mr-2" />
                      Ver Información
                    </>
                  )}
                </Button>

                {/* Botón de descarga */}
                <Button
                  onClick={() => descargarPlantilla(plantilla.tipo, plantilla.nombre)}
                  disabled={descargando === plantilla.tipo}
                  className="w-full"
                >
                  {descargando === plantilla.tipo ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Plantilla
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Información detallada de plantilla */}
      {plantillaInfo && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Información: {plantillaInfo.nombre}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlantillaInfo(null)}
              >
                Cerrar
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columnas requeridas */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Columnas Requeridas</h4>
                <ul className="space-y-2">
                  {plantillaInfo.columnasRequeridas.map((columna) => (
                    <li key={columna} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 font-medium">{columna}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Columnas opcionales */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Columnas Opcionales</h4>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {plantillaInfo.columnasOpcionales.map((columna) => (
                    <li key={columna} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{columna}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Validaciones */}
              <div className="lg:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Reglas de Validación</h4>
                <ul className="space-y-2">
                  {plantillaInfo.validaciones.map((validacion, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      <span className="font-medium">•</span> {validacion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Límites */}
              <div className="lg:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Límites</h4>
                <div className="flex gap-6 text-sm text-gray-700">
                  <span>
                    <strong>Máximo registros:</strong> {plantillaInfo.limites.maxRegistros.toLocaleString()}
                  </span>
                  <span>
                    <strong>Tamaño máximo:</strong> {plantillaInfo.limites.maxTamanoArchivo}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones generales */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Instrucciones de Uso</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>1. <strong>Descarga</strong> la plantilla correspondiente al tipo de datos que deseas importar</p>
            <p>2. <strong>Abre</strong> la plantilla en Excel o Google Sheets</p>
            <p>3. <strong>Revisa</strong> las hojas de instrucciones, ejemplos y validaciones incluidas</p>
            <p>4. <strong>Completa</strong> la hoja &quot;Datos&quot; con tu información</p>
            <p>5. <strong>Guarda</strong> el archivo en formato Excel (.xlsx)</p>
            <p>6. <strong>Sube</strong> el archivo usando la función de importación del sistema</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
