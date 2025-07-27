import { apiClient } from '../api'

export interface ImportarProductosDto {
  sobrescribirExistentes: boolean
  validarSolo: boolean
  notificarEmail: boolean
  emailNotificacion?: string
  configuracionEspecifica?: {
    tipoValidacion?: 'estricta' | 'flexible' | 'solo_validacion'
    validarPrecios?: boolean
    validarStock?: boolean
    generarSKUAutomatico?: boolean
    prefijoSKU?: string
    crearProveedorSiNoExiste?: boolean
  }
}

export interface ImportarProveedoresDto {
  sobrescribirExistentes: boolean
  validarSolo: boolean
  notificarEmail: boolean
  emailNotificacion?: string
  configuracionEspecifica?: {
    tipoValidacion?: 'estricta' | 'flexible' | 'solo_validacion'
    validarEmail?: boolean
    validarTelefono?: boolean
    crearProductosSiNoExisten?: boolean
  }
}

export interface ImportarMovimientosDto {
  sobrescribirExistentes: boolean
  validarSolo: boolean
  notificarEmail: boolean
  emailNotificacion?: string
  configuracionEspecifica?: {
    tipoValidacion?: 'estricta' | 'flexible' | 'solo_validacion'
    validarStock?: boolean
    validarProductos?: boolean
    crearProductosSiNoExisten?: boolean
  }
}

// Nuevas interfaces para los endpoints unificados
export interface ImportacionUnificadaDto {
  tipo: 'productos' | 'proveedores' | 'movimientos'
  sobrescribirExistentes: boolean
  validarSolo: boolean
  notificarEmail: boolean
  emailNotificacion?: string
  configuracionEspecifica?: any
}

export interface ImportacionAutoDto {
  sobrescribirExistentes: boolean
  validarSolo: boolean
  notificarEmail: boolean
  emailNotificacion?: string
  configuracionEspecifica?: any
}

export interface ValidacionAutoDto {
  configuracionEspecifica?: any
}

export interface ConfirmacionAutoDto {
  tipoConfirmado: 'productos' | 'proveedores' | 'movimientos'
  sobrescribirExistentes: boolean
  validarSolo: boolean
  notificarEmail: boolean
  emailNotificacion?: string
  configuracionEspecifica?: any
}

export interface TipoSoportado {
  tipo: 'productos' | 'proveedores' | 'movimientos'
  nombre: string
  descripcion: string
  camposRequeridos: string[]
  camposOpcionales: string[]
  formatosSoportados: string[]
  maxFileSizeMB: number
  icono: string
  color: string
}

export interface TiposSoportadosResponse {
  success: boolean
  tipos: TipoSoportado[]
}

export interface DeteccionTipoResponse {
  success: boolean
  tipoDetectado?: 'productos' | 'proveedores' | 'movimientos'
  confianza: number // 0-100
  razones: string[]
  necesitaConfirmacion: boolean
  sugerencias?: string[]
}

export interface TrabajoImportacion {
  id: string
  tipo: 'productos' | 'proveedores' | 'movimientos'
  estado: 'pendiente' | 'procesando' | 'completado' | 'error' | 'cancelado'
  empresaId: number
  usuarioId: number
  archivoOriginal: string
  totalRegistros: number
  registrosProcesados: number
  registrosExitosos: number
  registrosConError: number
  fechaCreacion: string
  fechaActualizacion: string
  progreso: number
  mensaje?: string
  errores?: string[]
}

export interface ImportacionValidationError {
  fila: number
  columna: string
  valor: string
  mensaje: string
  tipo: string
}

export interface ResultadoImportacion {
  success: boolean
  message: string
  trabajoId: string
  estado: string
  totalRegistros?: number
  errores?: number
  erroresDetallados?: ImportacionValidationError[]
  deteccionTipo?: DeteccionTipoResponse
}

export interface ListaTrabajosResponse {
  success: boolean
  trabajos: TrabajoImportacion[]
  total: number
  limit: number
  offset: number
}

export interface EstadoTrabajoResponse {
  success: boolean
  trabajo: TrabajoImportacion
}

export interface PlantillasResponse {
  success: boolean
  plantillas: string[]
}

class ImportacionAPI {
  // Endpoints originales (mantener compatibilidad)
  async importarProductos(
    archivo: File,
    opciones: ImportarProductosDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('opciones', JSON.stringify(opciones))

    const response = await apiClient.post('/importacion/productos', formData)
    return response.data
  }

  async importarProveedores(
    archivo: File,
    opciones: ImportarProveedoresDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('opciones', JSON.stringify(opciones))

    const response = await apiClient.post('/importacion/proveedores', formData)
    return response.data
  }

  async importarMovimientos(
    archivo: File,
    opciones: ImportarMovimientosDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('opciones', JSON.stringify(opciones))

    const response = await apiClient.post('/importacion/movimientos', formData)
    return response.data
  }

  // Nuevos endpoints unificados
  async importarUnificada(
    archivo: File,
    opciones: ImportacionUnificadaDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('opciones', JSON.stringify(opciones))

    const response = await apiClient.post('/importacion/unificada', formData)
    return response.data
  }

  async importarAuto(
    archivo: File,
    opciones: ImportacionAutoDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('opciones', JSON.stringify(opciones))

    const response = await apiClient.post('/importacion/auto', formData)
    return response.data
  }

  async validarAuto(
    archivo: File,
    opciones?: ValidacionAutoDto
  ): Promise<DeteccionTipoResponse> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    if (opciones) {
      formData.append('opciones', JSON.stringify(opciones))
    }

    const response = await apiClient.post('/importacion/auto/validar', formData)
    return response.data
  }

  async confirmarAuto(
    trabajoId: string,
    opciones: ConfirmacionAutoDto
  ): Promise<ResultadoImportacion> {
    const response = await apiClient.post(`/importacion/auto/confirmar/${trabajoId}`, opciones)
    return response.data
  }

  async obtenerTiposSoportados(): Promise<TiposSoportadosResponse> {
    const response = await apiClient.get('/importacion/tipos-soportados')
    return response.data
  }

  async descargarPlantillaMejorada(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<Blob> {
    const response = await apiClient.get(`/importacion/plantillas-mejoradas/${tipo}`, {
      responseType: 'blob',
    })
    return response.data
  }

  // Endpoints existentes (mantener compatibilidad)
  async obtenerEstadoTrabajo(trabajoId: string): Promise<EstadoTrabajoResponse> {
    const response = await apiClient.get(`/importacion/trabajos/${trabajoId}`)
    return response.data
  }

  async listarTrabajos(limit = 50, offset = 0): Promise<ListaTrabajosResponse> {
    const response = await apiClient.get(`/importacion/trabajos?limit=${limit}&offset=${offset}`)
    return response.data
  }

  async cancelarTrabajo(trabajoId: string): Promise<void> {
    await apiClient.delete(`/importacion/trabajos/${trabajoId}`)
  }

  async descargarReporteErrores(trabajoId: string): Promise<Blob> {
    const response = await apiClient.get(`/importacion/trabajos/${trabajoId}/reporte-errores`, {
      responseType: 'blob',
    })
    return response.data
  }

  async descargarPlantilla(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<Blob> {
    const response = await apiClient.get(`/importacion/plantillas/${tipo}`, {
      responseType: 'blob',
    })
    return response.data
  }

  async listarPlantillas(): Promise<PlantillasResponse> {
    const response = await apiClient.get('/importacion/plantillas')
    return response.data
  }
}

export const importacionAPI = new ImportacionAPI() 