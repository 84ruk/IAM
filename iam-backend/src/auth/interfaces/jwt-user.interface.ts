export interface JwtUser {
  id?: number;
  sub?: number;
  email: string;
  rol: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR';
  empresaId: number;
  tipoIndustria?: string;
}
