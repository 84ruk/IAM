import { Injectable, Logger } from '@nestjs/common';

// ✅ EVENTOS DEL DOMINIO - Tenant Management
export interface TenantCreatedEvent {
  tenantId: number;
  tenantName: string;
  createdAt: Date;
  metadata: {
    industry: string;
    plan: string;
  };
}

export interface TenantUpdatedEvent {
  tenantId: number;
  updatedFields: string[];
  updatedAt: Date;
  metadata: {
    previousData: any;
    newData: any;
  };
}

export interface TenantDeactivatedEvent {
  tenantId: number;
  deactivatedAt: Date;
  reason: string;
}

export interface UserCreatedEvent {
  tenantId: number;
  userId: number;
  userEmail: string;
  userRole: string;
  createdAt: Date;
}

export interface TenantSetupCompletedEvent {
  tenantId: number;
  adminUserId: number;
  setupCompletedAt: Date;
}

@Injectable()
export class TenantEventBus {
  private readonly logger = new Logger(TenantEventBus.name);

  // ✅ PUBLICACIÓN DE EVENTOS
  async publishTenantCreated(event: TenantCreatedEvent): Promise<void> {
    this.logger.log(`📢 Evento: TenantCreated - Inquilino ${event.tenantId} creado`);
    
    // En una implementación real, aquí se publicaría a Kafka/RabbitMQ
    // Por ahora, simulamos la publicación
    await this.publishToEventBus('tenant.created', event);
    
    // Notificar a otros microservicios
    await this.notifyInventoryService(event);
    await this.notifyAnalyticsService(event);
  }

  async publishTenantUpdated(event: TenantUpdatedEvent): Promise<void> {
    this.logger.log(`📢 Evento: TenantUpdated - Inquilino ${event.tenantId} actualizado`);
    
    await this.publishToEventBus('tenant.updated', event);
    
    // Notificar cambios relevantes
    if (event.updatedFields.includes('industria')) {
      await this.notifyInventoryService(event);
    }
  }

  async publishTenantDeactivated(event: TenantDeactivatedEvent): Promise<void> {
    this.logger.log(`📢 Evento: TenantDeactivated - Inquilino ${event.tenantId} desactivado`);
    
    await this.publishToEventBus('tenant.deactivated', event);
    
    // Notificar a todos los microservicios para limpiar datos
    await this.notifyAllServices(event);
  }

  async publishUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`📢 Evento: UserCreated - Usuario ${event.userId} creado para inquilino ${event.tenantId}`);
    
    await this.publishToEventBus('user.created', event);
    
    // Notificar al servicio de analytics para tracking
    await this.notifyAnalyticsService(event);
  }

  async publishTenantSetupCompleted(event: TenantSetupCompletedEvent): Promise<void> {
    this.logger.log(`📢 Evento: TenantSetupCompleted - Configuración completada para inquilino ${event.tenantId}`);
    
    await this.publishToEventBus('tenant.setup.completed', event);
    
    // Notificar a todos los servicios para inicializar datos
    await this.notifyAllServices(event);
  }

  // ✅ MÉTODOS PRIVADOS PARA COMUNICACIÓN ENTRE MICROSERVICIOS
  private async publishToEventBus(topic: string, event: any): Promise<void> {
    // Simulación de publicación a bus de eventos
    this.logger.debug(`📤 Publicando evento ${topic}:`, JSON.stringify(event, null, 2));
    
    // En producción, aquí se usaría:
    // - Kafka para eventos de dominio
    // - RabbitMQ para mensajes de comando
    // - Redis para eventos de cache
  }

  private async notifyInventoryService(event: any): Promise<void> {
    this.logger.debug(`📡 Notificando a Inventory Service sobre evento:`, event.tenantId);
    
    // En producción, aquí se haría una llamada HTTP o se publicaría un evento
    // await this.httpService.post('http://inventory-service/events', event);
  }

  private async notifyAnalyticsService(event: any): Promise<void> {
    this.logger.debug(`📡 Notificando a Analytics Service sobre evento:`, event.tenantId);
    
    // En producción, aquí se haría una llamada HTTP o se publicaría un evento
    // await this.httpService.post('http://analytics-service/events', event);
  }

  private async notifyAllServices(event: any): Promise<void> {
    this.logger.debug(`📡 Notificando a todos los servicios sobre evento:`, event.tenantId);
    
    // Notificar a todos los microservicios relevantes
    const services = [
      'inventory-service',
      'order-service', 
      'analytics-service',
      'admin-service'
    ];
    
    // En producción, se harían llamadas paralelas a todos los servicios
    // await Promise.all(services.map(service => 
    //   this.httpService.post(`http://${service}/events`, event)
    // ));
  }

  // ✅ MÉTODOS PARA CONSUMO DE EVENTOS (para otros microservicios)
  async handleInventoryEvent(event: any): Promise<void> {
    this.logger.log(`📥 Recibiendo evento de Inventory Service:`, event);
    
    // Procesar eventos relacionados con inventario
    switch (event.type) {
      case 'product.created':
        await this.handleProductCreated(event);
        break;
      case 'movement.registered':
        await this.handleMovementRegistered(event);
        break;
      default:
        this.logger.warn(`Evento no manejado: ${event.type}`);
    }
  }

  async handleOrderEvent(event: any): Promise<void> {
    this.logger.log(`📥 Recibiendo evento de Order Service:`, event);
    
    // Procesar eventos relacionados con pedidos
    switch (event.type) {
      case 'order.created':
        await this.handleOrderCreated(event);
        break;
      case 'order.completed':
        await this.handleOrderCompleted(event);
        break;
      default:
        this.logger.warn(`Evento no manejado: ${event.type}`);
    }
  }

  // ✅ MANEJADORES DE EVENTOS ESPECÍFICOS
  private async handleProductCreated(event: any): Promise<void> {
    this.logger.log(`🔄 Procesando producto creado para inquilino ${event.tenantId}`);
    // Lógica específica para productos creados
  }

  private async handleMovementRegistered(event: any): Promise<void> {
    this.logger.log(`🔄 Procesando movimiento registrado para inquilino ${event.tenantId}`);
    // Lógica específica para movimientos registrados
  }

  private async handleOrderCreated(event: any): Promise<void> {
    this.logger.log(`🔄 Procesando pedido creado para inquilino ${event.tenantId}`);
    // Lógica específica para pedidos creados
  }

  private async handleOrderCompleted(event: any): Promise<void> {
    this.logger.log(`🔄 Procesando pedido completado para inquilino ${event.tenantId}`);
    // Lógica específica para pedidos completados
  }
} 