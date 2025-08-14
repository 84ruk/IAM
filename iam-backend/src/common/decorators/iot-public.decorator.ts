import { SetMetadata } from '@nestjs/common';

export const IS_IOT_PUBLIC_KEY = 'isIotPublic';
export const IoTPublic = () => SetMetadata(IS_IOT_PUBLIC_KEY, true);

