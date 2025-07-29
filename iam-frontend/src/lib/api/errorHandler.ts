/**
 * Servicio para manejar y traducir errores del backend
 * Proporciona mensajes claros y útiles para el usuario
 */

export interface BackendError {
  statusCode: number;
  message: string;
  error?: string;
  details?: any;
}

export interface ValidationError {
  property: string;
  value: any;
  constraints: string[];
  children?: ValidationError[];
}

export interface UserFriendlyError {
  title?: string;
  message: string;
  details?: string[];
  suggestions?: string[];
  type: 'validation' | 'file' | 'system' | 'network' | 'auth';
  code?: string;
}

export class ErrorHandlerService {
  /**
   * Convierte errores del backend en mensajes amigables para el usuario
   */
  static parseBackendError(error: any): UserFriendlyError {
    if (!error) {
      return {
        message: 'Error desconocido',
        type: 'system',
        code: 'UNKNOWN_ERROR'
      }
    }

    // Si ya es un UserFriendlyError, devolverlo
    if (error.userFriendlyError) {
      return error.userFriendlyError
    }

    // Parsear errores de respuesta HTTP
    if (error.response?.data) {
      const backendError = error.response.data
      
      return {
        message: backendError.message || 'Error del servidor',
        type: 'system',
        code: backendError.code || 'BACKEND_ERROR',
        details: backendError.details || null
      }
    }

    // Parsear errores de red
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        type: 'network',
        code: 'NETWORK_ERROR'
      }
    }

    // Error por defecto
    return {
      message: error.message || 'Error desconocido',
      type: 'system',
      code: 'UNKNOWN_ERROR'
    }
  }

  /**
   * Parsea errores de validación específicos del backend
   */
  private static parseValidationError(error: any): UserFriendlyError {
    const message = error.message || '';
    const details = error.details || [];

    // Error específico de opciones
    if (message.includes('opciones -> property opciones should not exist')) {
      return {
        title: 'Error en las opciones de importación',
        message: 'Las opciones de importación no están configuradas correctamente.',
        details: [
          'El campo "opciones" no debe estar presente en la solicitud',
          'Verifica que estés enviando los datos en el formato correcto'
        ],
        suggestions: [
          'Usa el formulario de importación para configurar las opciones',
          'No modifiques manualmente los datos de la solicitud',
          'Si el problema persiste, recarga la página'
        ],
        type: 'validation'
      };
    }

    // Error de archivo requerido
    if (message.includes('No se proporcionó ningún archivo')) {
      return {
        title: 'Archivo requerido',
        message: 'Debes seleccionar un archivo para importar.',
        suggestions: [
          'Haz clic en "Seleccionar archivo" y elige tu archivo Excel',
          'Asegúrate de que el archivo no esté vacío',
          'Verifica que el archivo sea de tipo Excel (.xlsx, .xls) o CSV'
        ],
        type: 'file'
      };
    }

    // Error de tipo de archivo
    if (message.includes('Tipo de archivo no válido')) {
      return {
        title: 'Tipo de archivo no soportado',
        message: 'El archivo que intentas subir no es del tipo correcto.',
        details: [
          'Formatos soportados: Excel (.xlsx, .xls), Numbers (.numbers), CSV (.csv)',
          'Verifica que el archivo no esté corrupto'
        ],
        suggestions: [
          'Convierte tu archivo a formato Excel (.xlsx)',
          'Si usas Numbers, exporta como Excel',
          'Verifica que el archivo no esté dañado'
        ],
        type: 'file'
      };
    }

    // Error de empresa no asignada
    if (message.includes('Usuario no tiene empresa asignada')) {
      return {
        title: 'Empresa no configurada',
        message: 'Tu cuenta no está asociada a una empresa.',
        suggestions: [
          'Contacta al administrador de tu empresa',
          'Verifica que tu cuenta esté correctamente configurada'
        ],
        type: 'auth'
      };
    }

    // Error de tipo de importación
    if (message.includes('Tipo de importación no válido')) {
      return {
        title: 'Tipo de importación inválido',
        message: 'El tipo de importación seleccionado no es válido.',
        details: [
          'Tipos válidos: productos, proveedores, movimientos',
          'Verifica que hayas seleccionado el tipo correcto'
        ],
        suggestions: [
          'Selecciona el tipo de importación correcto',
          'Verifica que el archivo corresponda al tipo seleccionado'
        ],
        type: 'validation'
      };
    }

    // Error de validación de datos
    if (details.length > 0) {
      const validationDetails = details.map((detail: any) => {
        if (typeof detail === 'string') return detail;
        if (detail.property && detail.constraints) {
          return `${detail.property}: ${detail.constraints.join(', ')}`;
        }
        return detail.message || detail;
      });

      return {
        title: 'Datos de importación inválidos',
        message: 'Los datos del archivo no cumplen con los requisitos de validación.',
        details: validationDetails,
        suggestions: [
          'Revisa el formato de los datos en tu archivo',
          'Descarga la plantilla de ejemplo para ver el formato correcto',
          'Verifica que todos los campos requeridos estén completos'
        ],
        type: 'validation'
      };
    }

    // Error de validación genérico
    return {
      title: 'Error de validación',
      message: message || 'Los datos proporcionados no son válidos.',
      suggestions: [
        'Verifica que todos los campos sean correctos',
        'Revisa el formato de los datos',
        'Descarga la plantilla de ejemplo para referencia'
      ],
      type: 'validation'
    };
  }

  /**
   * Parsea errores específicos de importación
   */
  static parseImportError(error: any, tipo: string): UserFriendlyError {
    const baseError = this.parseBackendError(error);

    // Personalizar según el tipo de importación
    switch (tipo) {
      case 'productos':
        return {
          ...baseError,
          title: `Error en importación de productos - ${baseError.title}`,
          suggestions: [
            ...baseError.suggestions || [],
            'Verifica que el archivo contenga: nombre, stock, precio de compra, precio de venta',
            'Asegúrate de que los precios sean números válidos',
            'Verifica que el stock sea un número entero mayor o igual a 0'
          ]
        };

      case 'proveedores':
        return {
          ...baseError,
          title: `Error en importación de proveedores - ${baseError.title}`,
          suggestions: [
            ...baseError.suggestions || [],
            'Verifica que el archivo contenga: nombre, email (opcional), teléfono (opcional)',
            'Asegúrate de que el email tenga formato válido si está presente',
            'Verifica que el nombre no esté duplicado'
          ]
        };

      case 'movimientos':
        return {
          ...baseError,
          title: `Error en importación de movimientos - ${baseError.title}`,
          suggestions: [
            ...baseError.suggestions || [],
            'Verifica que el archivo contenga: productoId, tipo (ENTRADA/SALIDA), cantidad, fecha',
            'Asegúrate de que el productoId exista en tu inventario',
            'Verifica que la cantidad sea un número entero mayor a 0',
            'Asegúrate de que la fecha tenga formato válido (YYYY-MM-DD)'
          ]
        };

      default:
        return baseError;
    }
  }

  /**
   * Obtiene sugerencias específicas según el tipo de error
   */
  static getSuggestionsByErrorType(type: string): string[] {
    switch (type) {
      case 'validation':
        return [
          'Revisa el formato de los datos en tu archivo',
          'Descarga la plantilla de ejemplo para ver el formato correcto',
          'Verifica que todos los campos requeridos estén completos',
          'Asegúrate de que los tipos de datos sean correctos'
        ];

      case 'file':
        return [
          'Verifica que el archivo no esté corrupto',
          'Asegúrate de que el formato sea compatible',
          'Reduce el tamaño del archivo si es necesario',
          'Intenta con un archivo diferente'
        ];

      case 'system':
        return [
          'Intenta nuevamente en unos minutos',
          'Recarga la página e intenta de nuevo',
          'Verifica tu conexión a internet',
          'Si el problema persiste, contacta soporte'
        ];

      case 'network':
        return [
          'Verifica tu conexión a internet',
          'Intenta nuevamente en unos minutos',
          'Verifica que el servidor esté disponible',
          'Si el problema persiste, contacta soporte'
        ];

      case 'auth':
        return [
          'Inicia sesión nuevamente',
          'Verifica que tu sesión no haya expirado',
          'Contacta al administrador si el problema persiste'
        ];

      default:
        return [
          'Intenta nuevamente',
          'Verifica que todos los datos sean correctos',
          'Si el problema persiste, contacta soporte'
        ];
    }
  }
} 