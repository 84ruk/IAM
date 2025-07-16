import { BadRequestException, ForbiddenException } from '@nestjs/common';

export class InsufficientStockException extends BadRequestException {
  constructor(
    productoId: number,
    stockActual: number,
    cantidadSolicitada: number,
    productoNombre?: string,
  ) {
    const message = productoNombre
      ? `Stock insuficiente para "${productoNombre}". Stock actual: ${stockActual}, cantidad solicitada: ${cantidadSolicitada}`
      : `Stock insuficiente. Stock actual: ${stockActual}, cantidad solicitada: ${cantidadSolicitada}`;

    super({
      message,
      details: {
        code: 'INSUFFICIENT_STOCK',
        suggestion: 'Verifica el stock disponible antes de realizar la salida',
        productoId,
        stockActual,
        cantidadSolicitada,
        productoNombre,
        deficit: cantidadSolicitada - stockActual,
      },
    });
  }
}

export class ProductNotFoundException extends BadRequestException {
  constructor(productoId?: number, codigoBarras?: string) {
    const identifier = productoId
      ? `ID: ${productoId}`
      : `código de barras: ${codigoBarras}`;
    const message = `Producto no encontrado con ${identifier}`;

    super({
      message,
      details: {
        code: 'PRODUCT_NOT_FOUND',
        suggestion: 'Verifica que el producto exista y esté activo',
        productoId,
        codigoBarras,
      },
    });
  }
}

export class InvalidMovementException extends BadRequestException {
  constructor(tipo: string, motivo: string) {
    super({
      message: `Movimiento inválido: ${motivo}`,
      details: {
        code: 'INVALID_MOVEMENT',
        suggestion: 'Verifica los datos del movimiento',
        tipo,
        motivo,
      },
    });
  }
}

export class DuplicateProductException extends BadRequestException {
  constructor(field: string, value: string) {
    super({
      message: `Ya existe un producto con ${field}: ${value}`,
      details: {
        code: 'DUPLICATE_PRODUCT',
        suggestion: 'Verifica que el producto no exista ya en el sistema',
        field,
        value,
      },
    });
  }
}

export class InvalidProviderException extends BadRequestException {
  constructor(providerId: number, empresaId: number) {
    super({
      message: 'El proveedor no existe o no pertenece a tu empresa',
      details: {
        code: 'INVALID_PROVIDER',
        suggestion: 'Verifica que el proveedor esté registrado en tu empresa',
        providerId,
        empresaId,
      },
    });
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(requiredRole: string, currentRole: string, action: string) {
    super({
      message: `No tienes permisos suficientes para ${action}`,
      details: {
        code: 'INSUFFICIENT_PERMISSIONS',
        suggestion: `Se requiere rol ${requiredRole} para realizar esta acción`,
        requiredRole,
        currentRole,
        action,
      },
    });
  }
}
