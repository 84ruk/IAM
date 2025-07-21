'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { 
  Upload, 
  X, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Download,
  Info
} from 'lucide-react'
import { useImportacion } from '@/hooks/useImportacion'
import { TipoImportacion } from '@/hooks/useImportacion'

interface ImportacionFormProps {
  tipo: TipoImportacion
  onClose: () => void
}

const tipoConfig = {
  productos: {
    title: 'Productos',
    description: 'Importa tu catálogo de productos',
    icon: '📦',
    camposRequeridos: ['nombre', 'stock', 'precioCompra', 'precioVenta'],
    camposOpcionales: ['descripcion', 'stockMinimo', 'etiqueta', 'proveedor']
  },
  proveedores: {
    title: 'Proveedores',
    description: 'Importa tu lista de proveedores',
    icon: '🏢',
    camposRequeridos: ['nombre', 'email'],
    camposOpcionales: ['telefono', 'direccion', 'rfc', 'contacto']
  },
  movimientos: {
    title: 'Movimientos',
    description: 'Importa movimientos de inventario',
    icon: '📊',
    camposRequeridos: ['producto', 'tipo', 'cantidad', 'fecha'],
    camposOpcionales: ['motivo', 'proveedor', 'observaciones']
  }
}

export default function ImportacionForm({ tipo, onClose }: ImportacionFormProps) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [opciones, setOpciones] = useState({
    sobrescribirExistentes: false,
    validarSolo: false,
    notificarEmail: false,
    emailNotificacion: ''
  })

  const {
    isImporting,
    importarProductos,
    importarProveedores,
    importarMovimientos,
    descargarPlantilla
  } = useImportacion()

  const config = tipoConfig[tipo]

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      if (validarArchivo(file)) {
        setArchivo(file)
      }
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validarArchivo(file)) {
        setArchivo(file)
      }
    }
  }, [])

  const validarArchivo = (file: File): boolean => {
    const extensionesPermitidas = ['.xlsx', '.xls', '.csv']
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!extensionesPermitidas.includes(extension)) {
      alert('Solo se permiten archivos Excel (.xlsx, .xls) o CSV')
      return false
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
      alert('El archivo es demasiado grande. Máximo 50MB')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!archivo) {
      alert('Por favor selecciona un archivo')
      return
    }

    try {
      switch (tipo) {
        case 'productos':
          await importarProductos(archivo, opciones)
          break
        case 'proveedores':
          await importarProveedores(archivo, opciones)
          break
        case 'movimientos':
          await importarMovimientos(archivo, opciones)
          break
      }
      
      onClose()
    } catch (error) {
      console.error('Error al importar:', error)
    }
  }

  const handleDescargarPlantilla = async () => {
    await descargarPlantilla(tipo)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <CardTitle>Importar {config.title}</CardTitle>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de archivo */}
          <div>
            <Label htmlFor="archivo" className="block mb-2">
              Seleccionar archivo
            </Label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : archivo 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {archivo ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-green-900">{archivo.name}</p>
                    <p className="text-sm text-green-700">
                      {(archivo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setArchivo(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 mb-2">
                    Arrastra y suelta tu archivo aquí, o
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('archivo')?.click()}
                  >
                    Seleccionar archivo
                  </Button>
                  <input
                    id="archivo"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Formatos soportados: Excel (.xlsx, .xls) y CSV
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Información de campos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">Campos requeridos</h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {config.camposRequeridos.map((campo) => (
                <Badge key={campo} variant="secondary" className="bg-red-100 text-red-800">
                  {campo}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Campos opcionales</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.camposOpcionales.map((campo) => (
                <Badge key={campo} variant="outline">
                  {campo}
                </Badge>
              ))}
            </div>
          </div>

          {/* Opciones de importación */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Opciones de importación</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sobrescribirExistentes"
                  checked={opciones.sobrescribirExistentes}
                  onCheckedChange={(checked) => 
                    setOpciones(prev => ({ ...prev, sobrescribirExistentes: !!checked }))
                  }
                />
                <Label htmlFor="sobrescribirExistentes">
                  Sobrescribir registros existentes
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validarSolo"
                  checked={opciones.validarSolo}
                  onCheckedChange={(checked) => 
                    setOpciones(prev => ({ ...prev, validarSolo: !!checked }))
                  }
                />
                <Label htmlFor="validarSolo">
                  Solo validar (no importar)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notificarEmail"
                  checked={opciones.notificarEmail}
                  onCheckedChange={(checked) => 
                    setOpciones(prev => ({ ...prev, notificarEmail: !!checked }))
                  }
                />
                <Label htmlFor="notificarEmail">
                  Recibir notificación por email
                </Label>
              </div>

              {opciones.notificarEmail && (
                <div>
                  <Label htmlFor="emailNotificacion" className="block mb-1">
                    Email para notificación
                  </Label>
                  <Input
                    id="emailNotificacion"
                    type="email"
                    placeholder="tu@email.com"
                    value={opciones.emailNotificacion}
                    onChange={(e) => 
                      setOpciones(prev => ({ ...prev, emailNotificacion: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDescargarPlantilla}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar plantilla
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Cancelar
              </Button>
            </div>
            
            <Button
              type="submit"
              disabled={!archivo || isImporting}
              className="min-w-[120px]"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 