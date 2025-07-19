import { SetMetadata } from '@nestjs/common';

export const FINANCIAL_ACCESS_KEY = 'requiresFinancialAccess';

/**
 * Decorador para marcar endpoints que requieren acceso a datos financieros
 * @param requiresAccess - Si el endpoint requiere acceso a datos financieros
 */
export const FinancialAccess = (requiresAccess: boolean = true) =>
  SetMetadata(FINANCIAL_ACCESS_KEY, requiresAccess);

/**
 * Decorador para marcar endpoints que requieren acceso completo a datos financieros
 * (solo ADMIN y SUPERADMIN)
 */
export const FullFinancialAccess = () => SetMetadata(FINANCIAL_ACCESS_KEY, true);

/**
 * Decorador para marcar endpoints que requieren acceso limitado a datos financieros
 * (ADMIN, SUPERADMIN y EMPLEADO - sin precios de compra)
 */
export const LimitedFinancialAccess = () => SetMetadata(FINANCIAL_ACCESS_KEY, true);

/**
 * Decorador para marcar endpoints que NO requieren acceso a datos financieros
 */
export const NoFinancialAccess = () => SetMetadata(FINANCIAL_ACCESS_KEY, false); 