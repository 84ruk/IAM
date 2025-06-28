import { DatabaseExceptionFilter } from '../common/filters/database-exception.filter';
import { JwtExceptionFilter } from '../common/filters/jwt-exception.filter';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';


export const globalFilters = [
  new DatabaseExceptionFilter(), //DatabaseExceptionFilter - Captura errores de base de datos y negocio
  new JwtExceptionFilter(), //JwtExceptionFilter - Captura errores de autenticación
  new GlobalExceptionFilter(), //GlobalExceptionFilter - Captura errores no manejados (último recurso)
];


export const moduleFilters = {
  auth: [new JwtExceptionFilter()],
  dashboard: [new DatabaseExceptionFilter()],
  productos: [new DatabaseExceptionFilter()],
  movimientos: [new DatabaseExceptionFilter()],
};

  
export const endpointFilters = {
  'dashboard/stock-chart': [new DatabaseExceptionFilter()],
  'auth/login': [new JwtExceptionFilter()],
  'productos/:id': [new DatabaseExceptionFilter()],
}; 