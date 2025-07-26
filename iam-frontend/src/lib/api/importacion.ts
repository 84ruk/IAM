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
  async importarProductos(
    archivo: File,
    opciones: ImportarProductosDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('sobrescribirExistentes', opciones.sobrescribirExistentes.toString())
    formData.append('validarSolo', opciones.validarSolo.toString())
    formData.append('notificarEmail', opciones.notificarEmail.toString())
    
    if (opciones.emailNotificacion) {
      formData.append('emailNotificacion', opciones.emailNotificacion)
    }
    
    if (opciones.configuracionEspecifica) {
      formData.append('configuracionEspecifica', JSON.stringify(opciones.configuracionEspecifica))
    }

    console.log('🚀 Enviando solicitud de importación de productos...');
    const response = await apiClient.post('/importacion/productos', formData)
    console.log('📥 Respuesta recibida:', response);
    console.log('📥 Tipo de respuesta:', typeof response);
    
    const resultado = response as ResultadoImportacion;
    console.log('📥 resultado.success:', resultado.success);
    console.log('📥 resultado.erroresDetallados:', resultado.erroresDetallados);

    return resultado
  }

  async importarProveedores(
    archivo: File,
    opciones: ImportarProveedoresDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('sobrescribirExistentes', opciones.sobrescribirExistentes.toString())
    formData.append('validarSolo', opciones.validarSolo.toString())
    formData.append('notificarEmail', opciones.notificarEmail.toString())
    
    if (opciones.emailNotificacion) {
      formData.append('emailNotificacion', opciones.emailNotificacion)
    }
    
    if (opciones.configuracionEspecifica) {
      formData.append('configuracionEspecifica', JSON.stringify(opciones.configuracionEspecifica))
    }

    const response = await apiClient.post('/importacion/proveedores', formData)

    return response as ResultadoImportacion
  }

  async importarMovimientos(
    archivo: File,
    opciones: ImportarMovimientosDto
  ): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('sobrescribirExistentes', opciones.sobrescribirExistentes.toString())
    formData.append('validarSolo', opciones.validarSolo.toString())
    formData.append('notificarEmail', opciones.notificarEmail.toString())
    
    if (opciones.emailNotificacion) {
      formData.append('emailNotificacion', opciones.emailNotificacion)
    }
    
    if (opciones.configuracionEspecifica) {
      formData.append('configuracionEspecifica', JSON.stringify(opciones.configuracionEspecifica))
    }

    const response = await apiClient.post('/importacion/movimientos', formData)

    return response as ResultadoImportacion
  }

  async obtenerEstadoTrabajo(trabajoId: string): Promise<EstadoTrabajoResponse> {
    const response = await apiClient.get(`/importacion/trabajos/${trabajoId}`)
    return response as EstadoTrabajoResponse
  }

  async listarTrabajos(limit = 50, offset = 0): Promise<ListaTrabajosResponse> {
    const response = await apiClient.get('/importacion/trabajos', {
      params: { limit, offset }
    })
    return response as ListaTrabajosResponse
  }

  async cancelarTrabajo(trabajoId: string): Promise<void> {
    await apiClient.delete(`/importacion/trabajos/${trabajoId}`)
  }

  async descargarReporteErrores(trabajoId: string): Promise<Blob> {
    const response = await apiClient.get(`/importacion/trabajos/${trabajoId}/errores`, {
      responseType: 'blob'
    })
    return response as Blob
  }

  async descargarPlantilla(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<Blob> {
    const response = await apiClient.get(`/importacion/plantillas/${tipo}`, {
      responseType: 'blob'
    })
    return response as Blob
  }

  async listarPlantillas(): Promise<PlantillasResponse> {
    const response = await apiClient.get('/importacion/plantillas')
    return response as PlantillasResponse
  }
}

export const importacionAPI = new ImportacionAPI() 