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
    crearProveedorSiNoExiste?: boolean
    generarSKUAutomatico?: boolean
    prefijoSKU?: string
    usarPreciosDelMovimiento?: boolean
    crearCategoriaSiNoExiste?: boolean
    descripcionPorDefecto?: string
    stockMinimoPorDefecto?: number
    validarProveedorExistente?: boolean
    permitirMovimientosSinProducto?: boolean
    permitirStockNegativo?: boolean
    validarFechas?: boolean
    fechaMinima?: string
    fechaMaxima?: string
    motivoPorDefecto?: string
    actualizarStockEnTiempoReal?: boolean
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
    
    // Enviar campos booleanos como booleanos reales
    formData.append('sobrescribirExistentes', String(opciones.sobrescribirExistentes))
    formData.append('validarSolo', String(opciones.validarSolo))
    formData.append('notificarEmail', String(opciones.notificarEmail))
    
    if (opciones.emailNotificacion) {
      formData.append('emailNotificacion', opciones.emailNotificacion)
    }
    
    if (opciones.configuracionEspecifica) {
      formData.append('configuracionEspecifica', JSON.stringify(opciones.configuracionEspecifica))
    }

    const response = await apiClient.post<ResultadoImportacion>('/importacion/productos', formData)
    return response
  }

  async importarProveedores(
    archivo: File,
    opciones: ImportarProveedoresDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    
    // Enviar campos booleanos como booleanos reales
    formData.append('sobrescribirExistentes', String(opciones.sobrescribirExistentes))
    formData.append('validarSolo', String(opciones.validarSolo))
    formData.append('notificarEmail', String(opciones.notificarEmail))
    
    if (opciones.emailNotificacion) {
      formData.append('emailNotificacion', opciones.emailNotificacion)
    }
    
    if (opciones.configuracionEspecifica) {
      formData.append('configuracionEspecifica', JSON.stringify(opciones.configuracionEspecifica))
    }

    const response = await apiClient.post<ResultadoImportacion>('/importacion/proveedores', formData)
    return response
  }

  async importarMovimientos(
    archivo: File,
    opciones: ImportarMovimientosDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    
    // Enviar campos booleanos como booleanos reales
    formData.append('sobrescribirExistentes', String(opciones.sobrescribirExistentes))
    formData.append('validarSolo', String(opciones.validarSolo))
    formData.append('notificarEmail', String(opciones.notificarEmail))
    
    if (opciones.emailNotificacion) {
      formData.append('emailNotificacion', opciones.emailNotificacion)
    }
    
    if (opciones.configuracionEspecifica) {
      formData.append('configuracionEspecifica', JSON.stringify(opciones.configuracionEspecifica))
    }

    const response = await apiClient.post<ResultadoImportacion>('/importacion/movimientos', formData)
    return response
  }

  // Nuevos endpoints unificados
  async importarUnificada(
    archivo: File,
    opciones: ImportacionUnificadaDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('opciones', JSON.stringify(opciones))

    const response = await apiClient.post<ResultadoImportacion>('/importacion/unificada', formData)
    return response
  }

  async importarAuto(
    archivo: File,
    opciones: ImportacionAutoDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('opciones', JSON.stringify(opciones))

    const response = await apiClient.post<ResultadoImportacion>('/importacion/auto', formData)
    return response
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

    const response = await apiClient.post<DeteccionTipoResponse>('/importacion/auto/validar', formData)
    return response
  }

  async confirmarAuto(
    trabajoId: string,
    opciones: ConfirmacionAutoDto
  ): Promise<ResultadoImportacion> {
    const response = await apiClient.post<ResultadoImportacion>(`/importacion/auto/confirmar/${trabajoId}`, opciones)
    return response
  }

  async obtenerTiposSoportados(): Promise<TiposSoportadosResponse> {
    const response = await apiClient.get<TiposSoportadosResponse>('/importacion/tipos-soportados')
    return response
  }

  async descargarPlantillaMejorada(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/importacion/plantillas-mejoradas/${tipo}`, {
      responseType: 'blob',
    })
    return response
  }

  // Endpoints existentes (mantener compatibilidad)
  async obtenerEstadoTrabajo(trabajoId: string): Promise<EstadoTrabajoResponse> {
    const response = await apiClient.get<EstadoTrabajoResponse>(`/importacion/trabajos/${trabajoId}`)
    return response
  }

  async listarTrabajos(limit = 50, offset = 0): Promise<ListaTrabajosResponse> {
    const response = await apiClient.get<ListaTrabajosResponse>(`/importacion/trabajos?limit=${limit}&offset=${offset}`)
    return response
  }

  async cancelarTrabajo(trabajoId: string): Promise<void> {
    await apiClient.delete(`/importacion/trabajos/${trabajoId}`)
  }

  async descargarReporteErrores(trabajoId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/importacion/trabajos/${trabajoId}/reporte-errores`, {
      responseType: 'blob',
    })
    return response
  }

  async descargarPlantilla(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/importacion/plantillas/${tipo}`, {
      responseType: 'blob',
    })
    return response
  }

  async listarPlantillas(): Promise<PlantillasResponse> {
    const response = await apiClient.get<PlantillasResponse>('/importacion/plantillas')
    return response
  }

  // Nuevos métodos para plantillas automáticas
  async obtenerTodasLasPlantillas(): Promise<any> {
    const response = await apiClient.get<any>('/plantillas-auto')
    return response
  }

  async obtenerPlantillasPorTipo(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<any> {
    const response = await apiClient.get<any>(`/plantillas-auto/${tipo}`)
    return response
  }

  async obtenerMejorPlantilla(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<any> {
    const response = await apiClient.get<any>(`/plantillas-auto/${tipo}/mejor`)
    return response
  }

  async descargarPlantillaAuto(tipo: 'productos' | 'proveedores' | 'movimientos', nombre: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/plantillas-auto/${tipo}/descargar/${nombre}`, {
      responseType: 'blob',
    })
    return response
  }

  async obtenerEstadisticasPlantillas(): Promise<any> {
    const response = await apiClient.get<any>('/plantillas-auto/estadisticas')
    return response
  }

  async buscarPlantillas(criterios: {
    tipo?: string;
    nombre?: string;
    incluirAvanzadas?: boolean;
    incluirMejoradas?: boolean;
  }): Promise<any> {
    const params = new URLSearchParams()
    if (criterios.tipo) params.append('tipo', criterios.tipo)
    if (criterios.nombre) params.append('nombre', criterios.nombre)
    if (criterios.incluirAvanzadas !== undefined) params.append('incluirAvanzadas', criterios.incluirAvanzadas.toString())
    if (criterios.incluirMejoradas !== undefined) params.append('incluirMejoradas', criterios.incluirMejoradas.toString())
    
    const response = await apiClient.get<any>(`/plantillas-auto/buscar?${params.toString()}`)
    return response
  }

  async obtenerInfoPlantilla(nombre: string): Promise<any> {
    const response = await apiClient.get<any>(`/plantillas-auto/info/${nombre}`)
    return response
  }

  async actualizarPlantillas(): Promise<any> {
    const response = await apiClient.get<any>('/plantillas-auto/actualizar')
    return response
  }
}

export const importacionAPI = new ImportacionAPI() 