import { SetMetadata } from '@nestjs/common';

export const EMPRESA_REQUIRED_KEY = 'empresaRequired';
export const EmpresaRequired = () => SetMetadata(EMPRESA_REQUIRED_KEY, true);
