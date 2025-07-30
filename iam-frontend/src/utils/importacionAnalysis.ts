export interface ImportacionAnalysis {
  estimatedRecords: number
  fileSize: number
  complexity: 'simple' | 'medium' | 'complex'
  estimatedTime: number
  needsWebSocket: boolean
  reason: string
  recommendedMode: 'http' | 'websocket'
}

// Configuración de umbrales para determinar el modo de importación
const WEBSOCKET_THRESHOLDS = {
  RECORDS: 1000, // Más de 1000 registros
  FILE_SIZE: 10 * 1024 * 1024, // Más de 10MB
  ESTIMATED_TIME: 30000, // Más de 30 segundos
  COMPLEXITY_LEVELS: {
    SIMPLE: ['proveedores', 'categorias'] as const,
    MEDIUM: ['productos', 'movimientos'] as const,
    COMPLEX: ['inventario_completo', 'datos_historicos'] as const
  }
} as const

// Estimaciones de registros por tipo de archivo
const RECORDS_PER_MB = {
  EXCEL: 500, // ~500 registros por MB en Excel
  CSV: 1000,  // ~1000 registros por MB en CSV
  NUMBERS: 400 // ~400 registros por MB en Numbers
} as const

// Tiempo estimado de procesamiento por registro (en ms)
const TIME_PER_RECORD = {
  SIMPLE: 10,    // 10ms por registro para tipos simples
  MEDIUM: 25,    // 25ms por registro para tipos medios
  COMPLEX: 50    // 50ms por registro para tipos complejos
} as const

/**
 * Analiza un archivo para determinar el modo óptimo de importación
 */
export async function analyzeFile(file: File, tipo: string): Promise<ImportacionAnalysis> {
  const fileSize = file.size
  const fileExtension = getFileExtension(file.name)
  
  // 1. Estimar número de registros
  const estimatedRecords = estimateRecordsFromFile(file, fileExtension)
  
  // 2. Determinar complejidad
  const complexity = determineComplexity(tipo, estimatedRecords)
  
  // 3. Calcular tiempo estimado
  const estimatedTime = calculateEstimatedTime(estimatedRecords, complexity)
  
  // 4. Determinar si necesita WebSocket
  const needsWebSocket = determineWebSocketNeeded(fileSize, estimatedRecords, estimatedTime, complexity)
  
  // 5. Generar razón
  const reason = generateReason(needsWebSocket, fileSize, estimatedRecords, estimatedTime, complexity)
  
  // 6. Recomendar modo
  const recommendedMode = needsWebSocket ? 'websocket' : 'http'
  
  return {
    estimatedRecords,
    fileSize,
    complexity,
    estimatedTime,
    needsWebSocket,
    reason,
    recommendedMode
  }
}

/**
 * Estima el número de registros basado en el tamaño del archivo
 */
function estimateRecordsFromFile(file: File, extension: string): number {
  const sizeInMB = file.size / (1024 * 1024)
  
  let recordsPerMB: number
  switch (extension.toLowerCase()) {
    case 'xlsx':
    case 'xls':
      recordsPerMB = RECORDS_PER_MB.EXCEL
      break
    case 'csv':
      recordsPerMB = RECORDS_PER_MB.CSV
      break
    case 'numbers':
      recordsPerMB = RECORDS_PER_MB.NUMBERS
      break
    default:
      recordsPerMB = RECORDS_PER_MB.EXCEL // Default a Excel
  }
  
  return Math.round(sizeInMB * recordsPerMB)
}

/**
 * Determina la complejidad del tipo de importación
 */
function determineComplexity(tipo: string, estimatedRecords: number): 'simple' | 'medium' | 'complex' {
  // Por tipo de importación
  if (WEBSOCKET_THRESHOLDS.COMPLEXITY_LEVELS.SIMPLE.includes(tipo as 'productos' | 'proveedores' | 'movimientos')) {
    return 'simple'
  }
  
  if (WEBSOCKET_THRESHOLDS.COMPLEXITY_LEVELS.COMPLEX.includes(tipo as 'productos' | 'proveedores' | 'movimientos')) {
    return 'complex'
  }
  
  // Por número de registros
  if (estimatedRecords > 5000) {
    return 'complex'
  }
  
  if (estimatedRecords > 2000) {
    return 'medium'
  }
  
  return 'simple'
}

/**
 * Calcula el tiempo estimado de procesamiento
 */
function calculateEstimatedTime(estimatedRecords: number, complexity: 'simple' | 'medium' | 'complex'): number {
  let timePerRecord: number
  
  switch (complexity) {
    case 'simple':
      timePerRecord = TIME_PER_RECORD.SIMPLE
      break
    case 'medium':
      timePerRecord = TIME_PER_RECORD.MEDIUM
      break
    case 'complex':
      timePerRecord = TIME_PER_RECORD.COMPLEX
      break
  }
  
  return estimatedRecords * timePerRecord
}

/**
 * Determina si se necesita WebSocket
 */
function determineWebSocketNeeded(
  fileSize: number, 
  estimatedRecords: number, 
  estimatedTime: number, 
  complexity: 'simple' | 'medium' | 'complex'
): boolean {
  // Por tamaño de archivo
  if (fileSize > WEBSOCKET_THRESHOLDS.FILE_SIZE) {
    return true
  }
  
  // Por número de registros
  if (estimatedRecords > WEBSOCKET_THRESHOLDS.RECORDS) {
    return true
  }
  
  // Por tiempo estimado
  if (estimatedTime > WEBSOCKET_THRESHOLDS.ESTIMATED_TIME) {
    return true
  }
  
  // Por complejidad
  if (complexity === 'complex') {
    return true
  }
  
  return false
}

/**
 * Genera la razón para la decisión
 */
function generateReason(
  needsWebSocket: boolean,
  fileSize: number,
  estimatedRecords: number,
  estimatedTime: number,
  complexity: 'simple' | 'medium' | 'complex'
): string {
  if (needsWebSocket) {
    const reasons: string[] = []
    
    if (fileSize > WEBSOCKET_THRESHOLDS.FILE_SIZE) {
      reasons.push(`Archivo grande (${formatFileSize(fileSize)})`)
    }
    
    if (estimatedRecords > WEBSOCKET_THRESHOLDS.RECORDS) {
      reasons.push(`${estimatedRecords} registros estimados`)
    }
    
    if (estimatedTime > WEBSOCKET_THRESHOLDS.ESTIMATED_TIME) {
      reasons.push(`${Math.round(estimatedTime / 1000)}s estimados`)
    }
    
    if (complexity === 'complex') {
      reasons.push('Procesamiento complejo')
    }
    
    return `WebSocket recomendado: ${reasons.join(', ')}`
  } else {
    return `HTTP suficiente: ${estimatedRecords} registros, ${formatFileSize(fileSize)}, procesamiento ${complexity}`
  }
}

/**
 * Obtiene la extensión del archivo
 */
function getFileExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

/**
 * Formatea el tamaño del archivo
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Valida si un archivo es compatible con el análisis
 */
export function validateFileForAnalysis(file: File): { valid: boolean; error?: string } {
  const allowedExtensions = ['xlsx', 'xls', 'csv', 'numbers']
  const extension = getFileExtension(file.name).toLowerCase()
  
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Tipo de archivo no soportado: ${extension}. Tipos permitidos: ${allowedExtensions.join(', ')}`
    }
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: 'El archivo está vacío'
    }
  }
  
  if (file.size > 100 * 1024 * 1024) { // 100MB
    return {
      valid: false,
      error: 'El archivo es demasiado grande (máximo 100MB)'
    }
  }
  
  return { valid: true }
} 