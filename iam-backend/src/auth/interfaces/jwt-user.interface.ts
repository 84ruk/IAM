export interface JwtUser {
  sub: number;
  email: string;
  rol: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR';
  empresaId: number;
  tipoIndustria: string;
}
