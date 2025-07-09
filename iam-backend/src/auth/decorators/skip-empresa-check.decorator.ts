import { SetMetadata } from '@nestjs/common';

export const SKIP_EMPRESA_CHECK_KEY = 'skipEmpresaCheck';
export const SkipEmpresaCheck = () => SetMetadata(SKIP_EMPRESA_CHECK_KEY, true); 