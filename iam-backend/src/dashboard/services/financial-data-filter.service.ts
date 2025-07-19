import { Injectable, Logger } from '@nestjs/common';
import { Rol } from '@prisma/client';

export interface FinancialDataFilterOptions {
  includePurchasePrices?: boolean;
  includeSalePrices?: boolean;
  includeMargins?: boolean;
  includeCosts?: boolean;
  includeRevenue?: boolean;
  includeProfitability?: boolean;
  maskSensitiveData?: boolean;
}

@Injectable()
export class FinancialDataFilterService {
  private readonly logger = new Logger(FinancialDataFilterService.name);

  /**
   * Determina las opciones de filtrado basadas en el rol del usuario
   */
  getFilterOptions(userRole: Rol, accessLevel: 'full' | 'limited'): FinancialDataFilterOptions {
    switch (userRole) {
      case 'SUPERADMIN':
      case 'ADMIN':
        return {
          includePurchasePrices: true,
          includeSalePrices: true,
          includeMargins: true,
          includeCosts: true,
          includeRevenue: true,
          includeProfitability: true,
          maskSensitiveData: false,
        };

      case 'EMPLEADO':
        return {
          includePurchasePrices: false, // No mostrar precios de compra
          includeSalePrices: true,      // Mostrar precios de venta
          includeMargins: false,        // No mostrar márgenes (requiere precios de compra)
          includeCosts: false,          // No mostrar costos
          includeRevenue: true,         // Mostrar ingresos
          includeProfitability: false,  // No mostrar rentabilidad
          maskSensitiveData: true,      // Enmascarar datos sensibles
        };

      case 'PROVEEDOR':
        return {
          includePurchasePrices: false,
          includeSalePrices: false,
          includeMargins: false,
          includeCosts: false,
          includeRevenue: false,
          includeProfitability: false,
          maskSensitiveData: true,
        };

      default:
        this.logger.warn(`Rol no reconocido: ${userRole}, aplicando filtros más restrictivos`);
        return {
          includePurchasePrices: false,
          includeSalePrices: false,
          includeMargins: false,
          includeCosts: false,
          includeRevenue: false,
          includeProfitability: false,
          maskSensitiveData: true,
        };
    }
  }

  /**
   * Filtra datos de productos según el nivel de acceso
   */
  filterProductData(product: any, options: FinancialDataFilterOptions): any {
    const filteredProduct = { ...product };

    if (!options.includePurchasePrices) {
      delete filteredProduct.precioCompra;
      delete filteredProduct.purchasePrice;
    }

    if (!options.includeSalePrices) {
      delete filteredProduct.precioVenta;
      delete filteredProduct.salePrice;
    }

    if (options.maskSensitiveData) {
      // Enmascarar datos sensibles con valores aproximados
      if (filteredProduct.precioVenta) {
        filteredProduct.precioVenta = this.maskPrice(filteredProduct.precioVenta);
      }
      if (filteredProduct.precioCompra) {
        filteredProduct.precioCompra = this.maskPrice(filteredProduct.precioCompra);
      }
    }

    return filteredProduct;
  }

  /**
   * Filtra KPIs financieros según el nivel de acceso
   */
  filterFinancialKPIs(kpis: any, options: FinancialDataFilterOptions): any {
    const filteredKPIs = { ...kpis };

    if (!options.includeMargins) {
      delete filteredKPIs.margenPromedio;
      delete filteredKPIs.margenBruto;
      delete filteredKPIs.margenNeto;
      delete filteredKPIs.margenPorColeccion;
    }

    if (!options.includeCosts) {
      delete filteredKPIs.valorTotalInventario;
      delete filteredKPIs.costoVentas;
      delete filteredKPIs.costoAlmacenamiento;
      delete filteredKPIs.costoOportunidad;
    }

    if (!options.includeRevenue) {
      delete filteredKPIs.ingresosVentas;
      delete filteredKPIs.capitalTrabajo;
    }

    if (!options.includeProfitability) {
      delete filteredKPIs.roiInventario;
      delete filteredKPIs.rentabilidadPorProducto;
      delete filteredKPIs.rentabilidadPorCategoria;
    }

    if (options.maskSensitiveData) {
      // Enmascarar valores financieros sensibles
      Object.keys(filteredKPIs).forEach(key => {
        if (typeof filteredKPIs[key] === 'number' && filteredKPIs[key] > 0) {
          filteredKPIs[key] = this.maskFinancialValue(filteredKPIs[key]);
        }
      });
    }

    return filteredKPIs;
  }

  /**
   * Filtra datos del dashboard según el nivel de acceso
   */
  filterDashboardData(dashboardData: any, options: FinancialDataFilterOptions): any {
    const filteredData = { ...dashboardData };

    // Filtrar KPIs principales
    if (filteredData.kpis) {
      filteredData.kpis = this.filterFinancialKPIs(filteredData.kpis, options);
    }

    // Filtrar productos
    if (filteredData.productos && Array.isArray(filteredData.productos)) {
      filteredData.productos = filteredData.productos.map(product =>
        this.filterProductData(product, options)
      );
    }

    // Filtrar datos de stock crítico (sin precios)
    if (filteredData.stockCritico && Array.isArray(filteredData.stockCritico)) {
      filteredData.stockCritico = filteredData.stockCritico.map(item => ({
        nombre: item.nombre,
        stock: item.stock,
        stockMinimo: item.stockMinimo,
      }));
    }

    return filteredData;
  }

  /**
   * Enmascara un precio para ocultar el valor exacto
   */
  private maskPrice(price: number): number {
    // Redondear a múltiplos de 10 y agregar variación
    const rounded = Math.round(price / 10) * 10;
    const variation = Math.floor(Math.random() * 20) - 10; // ±10
    return Math.max(0, rounded + variation);
  }

  /**
   * Enmascara un valor financiero para ocultar el valor exacto
   */
  private maskFinancialValue(value: number): number {
    // Redondear a múltiplos de 100 y agregar variación
    const rounded = Math.round(value / 100) * 100;
    const variation = Math.floor(Math.random() * 200) - 100; // ±100
    return Math.max(0, rounded + variation);
  }

  /**
   * Valida si un usuario puede acceder a datos financieros específicos
   */
  canAccessFinancialData(userRole: Rol, dataType: 'purchase_prices' | 'sale_prices' | 'margins' | 'costs' | 'revenue'): boolean {
    switch (userRole) {
      case 'SUPERADMIN':
      case 'ADMIN':
        return true;

      case 'EMPLEADO':
        return dataType === 'sale_prices' || dataType === 'revenue';

      case 'PROVEEDOR':
        return false;

      default:
        return false;
    }
  }
} 