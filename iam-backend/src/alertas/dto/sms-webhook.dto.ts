import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum SMSDeliveryStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  UNDELIVERED = 'undelivered',
  CANCELED = 'canceled',
}

export class SMSWebhookDto {
  @IsString()
  messageId: string;

  @IsEnum(SMSDeliveryStatus)
  status: SMSDeliveryStatus;

  @IsOptional()
  @IsString()
  errorCode?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}

export class SMSDeliveryLog {
  id: number;
  messageId: string;
  to: string;
  status: SMSDeliveryStatus;
  errorCode?: string;
  errorMessage?: string;
  provider: string;
  empresaId: number;
  alertaId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSWebhookResponse {
  success: boolean;
  message: string;
  webhookId?: string;
} 