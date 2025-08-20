-- CreateEnum
CREATE TYPE "TipoDestinatarioAlerta" AS ENUM ('EMAIL', 'SMS', 'AMBOS');

-- CreateEnum
CREATE TYPE "SeveridadAlerta" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "TipoIndustria" AS ENUM ('GENERICA', 'ROPA', 'ALIMENTOS', 'ELECTRONICA', 'FARMACIA');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'EMPLEADO', 'PROVEEDOR', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO', 'MEDICAMENTO', 'SUPLEMENTO', 'EQUIPO_MEDICO', 'CUIDADO_PERSONAL', 'BIOLOGICO', 'MATERIAL_QUIRURGICO', 'SOFTWARE', 'HARDWARE');

-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('UNIDAD', 'KILO', 'LITRO', 'CAJA', 'PAQUETE', 'KILOGRAMO', 'LITROS', 'METRO', 'METROS', 'GRAMO', 'GRAMOS', 'MILILITRO', 'MILILITROS', 'CENTIMETRO', 'CENTIMETROS', 'LICENCIA');

-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('ACTIVO', 'INACTIVO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "EstadoProveedor" AS ENUM ('ACTIVO', 'INACTIVO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "EstadoMovimiento" AS ENUM ('ACTIVO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'ENVIADO', 'RECIBIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoPrecioMovimiento" AS ENUM ('COMPRA', 'VENTA', 'AJUSTE', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "SensorTipo" AS ENUM ('TEMPERATURA', 'HUMEDAD', 'PRESION', 'PESO');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "emailContacto" TEXT,
    "direccion" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "TipoIndustria" "TipoIndustria" NOT NULL DEFAULT 'GENERICA',

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authProvider" TEXT NOT NULL DEFAULT 'local',
    "googleId" TEXT,
    "setupCompletado" BOOLEAN NOT NULL DEFAULT false,
    "telefono" TEXT,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "empresaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedorId" INTEGER,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "codigoBarras" TEXT,
    "humedadOptima" DOUBLE PRECISION,
    "rfid" TEXT,
    "sku" TEXT,
    "temperaturaOptima" DOUBLE PRECISION,
    "ubicacion" TEXT,
    "ubicacionId" INTEGER,
    "precioCompra" DOUBLE PRECISION NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "stockMinimo" INTEGER NOT NULL DEFAULT 10,
    "color" TEXT,
    "talla" TEXT,
    "tipoProducto" "TipoProducto" NOT NULL DEFAULT 'GENERICO',
    "unidad" "UnidadMedida" NOT NULL DEFAULT 'UNIDAD',
    "estado" "EstadoProducto" NOT NULL DEFAULT 'ACTIVO',
    "etiquetas" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" SERIAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "proveedorId" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,
    "tipo" "TipoMovimiento" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "empresaId" INTEGER NOT NULL,
    "estado" "EstadoMovimiento" NOT NULL DEFAULT 'ACTIVO',
    "precioTotal" DOUBLE PRECISION,
    "precioUnitario" DOUBLE PRECISION,
    "tipoPrecio" "TipoPrecioMovimiento",

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "empresaId" INTEGER NOT NULL,
    "estado" "EstadoProveedor" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoInventario" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fechaPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresaId" INTEGER NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "PedidoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "jti" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistedToken" (
    "id" SERIAL NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'manual_revocation',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistedToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorAuth" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT[],
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastUsed" TIMESTAMP(3),
    "lastUsedBackupCode" TIMESTAMP(3),
    "enabledAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "backupCodesRegeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "userId" INTEGER,
    "userEmail" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedIP" (
    "id" SERIAL NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "empresaId" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "SensorTipo" NOT NULL,
    "descripcion" TEXT,
    "ubicacionId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "configuracion" JSONB,
    "dispositivoIoTId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorLectura" (
    "id" SERIAL NOT NULL,
    "tipo" "SensorTipo" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "sensorId" INTEGER,
    "productoId" INTEGER,
    "ubicacionId" INTEGER,
    "empresaId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorLectura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" INTEGER,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresaId" INTEGER,
    "empresaName" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaHistorial" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" "SeveridadAlerta" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "productoId" INTEGER,
    "productoNombre" TEXT,
    "sensorId" INTEGER,
    "valor" TEXT,
    "ubicacionId" INTEGER,
    "destinatarios" TEXT[],
    "estado" TEXT NOT NULL DEFAULT 'ENVIADA',
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLectura" TIMESTAMP(3),
    "fechaResolucion" TIMESTAMP(3),
    "condicionActivacion" JSONB,
    "emailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionAlerta" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "tipoAlerta" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "frecuencia" TEXT NOT NULL,
    "ventanaEsperaMinutos" INTEGER,
    "umbralCritico" JSONB,
    "configuracionNotificacion" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionAlerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinatarioAlerta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "tipo" "TipoDestinatarioAlerta" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "DestinatarioAlerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionAlertaDestinatario" (
    "id" SERIAL NOT NULL,
    "configuracionAlertaId" INTEGER NOT NULL,
    "destinatarioId" INTEGER NOT NULL,

    CONSTRAINT "ConfiguracionAlertaDestinatario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroEnvioSMS" (
    "id" SERIAL NOT NULL,
    "mensajeId" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "codigoError" TEXT,
    "alertaId" INTEGER,

    CONSTRAINT "RegistroEnvioSMS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "contenidoHtml" TEXT NOT NULL,
    "contenidoTexto" TEXT,
    "variables" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSDeliveryLog" (
    "id" SERIAL NOT NULL,
    "messageId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "provider" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "alertaId" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispositivoIoT" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ESP32',
    "ubicacionId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "configuracion" JSONB,
    "wifiSSID" TEXT,
    "wifiPassword" TEXT,
    "apiBaseUrl" TEXT,
    "apiToken" TEXT,
    "apiEndpoint" TEXT,
    "sensoresConfigurados" JSONB,
    "intervaloLecturas" INTEGER DEFAULT 30000,
    "ultimaLectura" TIMESTAMP(3),
    "ultimaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispositivoIoT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiEvento" (
    "id" SERIAL NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "KpiEvento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_rfc_key" ON "Empresa"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_rol_idx" ON "Usuario"("empresaId", "rol");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_activo_idx" ON "Usuario"("empresaId", "activo");

-- CreateIndex
CREATE INDEX "Usuario_rol_activo_idx" ON "Usuario"("rol", "activo");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_googleId_idx" ON "Usuario"("googleId");

-- CreateIndex
CREATE INDEX "Usuario_setupCompletado_idx" ON "Usuario"("setupCompletado");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigoBarras_key" ON "Producto"("codigoBarras");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_rfid_key" ON "Producto"("rfid");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_sku_key" ON "Producto"("sku");

-- CreateIndex
CREATE INDEX "Producto_empresaId_etiquetas_idx" ON "Producto"("empresaId", "etiquetas");

-- CreateIndex
CREATE INDEX "Producto_empresaId_estado_idx" ON "Producto"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Producto_empresaId_stock_idx" ON "Producto"("empresaId", "stock");

-- CreateIndex
CREATE INDEX "Producto_empresaId_tipoProducto_idx" ON "Producto"("empresaId", "tipoProducto");

-- CreateIndex
CREATE INDEX "Producto_proveedorId_idx" ON "Producto"("proveedorId");

-- CreateIndex
CREATE INDEX "Producto_ubicacionId_idx" ON "Producto"("ubicacionId");

-- CreateIndex
CREATE INDEX "Producto_codigoBarras_idx" ON "Producto"("codigoBarras");

-- CreateIndex
CREATE INDEX "Producto_sku_idx" ON "Producto"("sku");

-- CreateIndex
CREATE INDEX "Producto_rfid_idx" ON "Producto"("rfid");

-- CreateIndex
CREATE INDEX "Producto_nombre_idx" ON "Producto"("nombre");

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_fecha_idx" ON "MovimientoInventario"("empresaId", "fecha" DESC);

-- CreateIndex
CREATE INDEX "MovimientoInventario_productoId_fecha_idx" ON "MovimientoInventario"("productoId", "fecha" DESC);

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_estado_idx" ON "MovimientoInventario"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "MovimientoInventario_tipo_fecha_idx" ON "MovimientoInventario"("tipo", "fecha" DESC);

-- CreateIndex
CREATE INDEX "MovimientoInventario_tipoPrecio_fecha_idx" ON "MovimientoInventario"("tipoPrecio", "fecha" DESC);

-- CreateIndex
CREATE INDEX "MovimientoInventario_proveedorId_idx" ON "MovimientoInventario"("proveedorId");

-- CreateIndex
CREATE INDEX "Proveedor_empresaId_estado_idx" ON "Proveedor"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Proveedor_empresaId_nombre_idx" ON "Proveedor"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "Proveedor_email_idx" ON "Proveedor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_empresaId_nombre_key" ON "Proveedor"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_empresaId_email_key" ON "Proveedor"("empresaId", "email");

-- CreateIndex
CREATE INDEX "PedidoInventario_empresaId_estado_idx" ON "PedidoInventario"("empresaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_jti_idx" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_is_revoked_idx" ON "refresh_tokens"("is_revoked");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedToken_jti_key" ON "BlacklistedToken"("jti");

-- CreateIndex
CREATE INDEX "BlacklistedToken_userId_idx" ON "BlacklistedToken"("userId");

-- CreateIndex
CREATE INDEX "BlacklistedToken_jti_idx" ON "BlacklistedToken"("jti");

-- CreateIndex
CREATE INDEX "BlacklistedToken_expiresAt_idx" ON "BlacklistedToken"("expiresAt");

-- CreateIndex
CREATE INDEX "BlacklistedToken_reason_idx" ON "BlacklistedToken"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorAuth_userId_key" ON "TwoFactorAuth"("userId");

-- CreateIndex
CREATE INDEX "TwoFactorAuth_isEnabled_idx" ON "TwoFactorAuth"("isEnabled");

-- CreateIndex
CREATE INDEX "TwoFactorAuth_setupCompleted_idx" ON "TwoFactorAuth"("setupCompleted");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_idx" ON "SecurityEvent"("type");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_ipAddress_idx" ON "SecurityEvent"("ipAddress");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_idx" ON "SecurityEvent"("severity");

-- CreateIndex
CREATE INDEX "SecurityEvent_timestamp_idx" ON "SecurityEvent"("timestamp");

-- CreateIndex
CREATE INDEX "BlockedIP_ipAddress_idx" ON "BlockedIP"("ipAddress");

-- CreateIndex
CREATE INDEX "BlockedIP_expiresAt_idx" ON "BlockedIP"("expiresAt");

-- CreateIndex
CREATE INDEX "Ubicacion_empresaId_idx" ON "Ubicacion"("empresaId");

-- CreateIndex
CREATE INDEX "Ubicacion_empresaId_activa_idx" ON "Ubicacion"("empresaId", "activa");

-- CreateIndex
CREATE INDEX "Sensor_ubicacionId_idx" ON "Sensor"("ubicacionId");

-- CreateIndex
CREATE INDEX "Sensor_empresaId_idx" ON "Sensor"("empresaId");

-- CreateIndex
CREATE INDEX "Sensor_tipo_idx" ON "Sensor"("tipo");

-- CreateIndex
CREATE INDEX "Sensor_dispositivoIoTId_idx" ON "Sensor"("dispositivoIoTId");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_nombre_ubicacionId_key" ON "Sensor"("nombre", "ubicacionId");

-- CreateIndex
CREATE INDEX "SensorLectura_sensorId_fecha_idx" ON "SensorLectura"("sensorId", "fecha");

-- CreateIndex
CREATE INDEX "SensorLectura_ubicacionId_fecha_idx" ON "SensorLectura"("ubicacionId", "fecha");

-- CreateIndex
CREATE INDEX "SensorLectura_empresaId_fecha_idx" ON "SensorLectura"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "SensorLectura_tipo_fecha_idx" ON "SensorLectura"("tipo", "fecha");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_empresaId_idx" ON "AuditLog"("empresaId");

-- CreateIndex
CREATE INDEX "AlertaHistorial_empresaId_idx" ON "AlertaHistorial"("empresaId");

-- CreateIndex
CREATE INDEX "AlertaHistorial_tipo_idx" ON "AlertaHistorial"("tipo");

-- CreateIndex
CREATE INDEX "AlertaHistorial_estado_idx" ON "AlertaHistorial"("estado");

-- CreateIndex
CREATE INDEX "AlertaHistorial_fechaEnvio_idx" ON "AlertaHistorial"("fechaEnvio" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionAlerta_sensorId_key" ON "ConfiguracionAlerta"("sensorId");

-- CreateIndex
CREATE INDEX "ConfiguracionAlerta_empresaId_idx" ON "ConfiguracionAlerta"("empresaId");

-- CreateIndex
CREATE INDEX "ConfiguracionAlerta_tipoAlerta_idx" ON "ConfiguracionAlerta"("tipoAlerta");

-- CreateIndex
CREATE INDEX "DestinatarioAlerta_empresaId_idx" ON "DestinatarioAlerta"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "DestinatarioAlerta_empresaId_email_key" ON "DestinatarioAlerta"("empresaId", "email");

-- CreateIndex
CREATE INDEX "ConfiguracionAlertaDestinatario_configuracionAlertaId_idx" ON "ConfiguracionAlertaDestinatario"("configuracionAlertaId");

-- CreateIndex
CREATE INDEX "ConfiguracionAlertaDestinatario_destinatarioId_idx" ON "ConfiguracionAlertaDestinatario"("destinatarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionAlertaDestinatario_configuracionAlertaId_desti_key" ON "ConfiguracionAlertaDestinatario"("configuracionAlertaId", "destinatarioId");

-- CreateIndex
CREATE INDEX "RegistroEnvioSMS_alertaId_idx" ON "RegistroEnvioSMS"("alertaId");

-- CreateIndex
CREATE INDEX "RegistroEnvioSMS_estado_idx" ON "RegistroEnvioSMS"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_name_key" ON "NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "NotificationTemplate_name_idx" ON "NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "NotificationTemplate_tipo_idx" ON "NotificationTemplate"("tipo");

-- CreateIndex
CREATE INDEX "SMSDeliveryLog_empresaId_idx" ON "SMSDeliveryLog"("empresaId");

-- CreateIndex
CREATE INDEX "SMSDeliveryLog_messageId_idx" ON "SMSDeliveryLog"("messageId");

-- CreateIndex
CREATE INDEX "SMSDeliveryLog_status_idx" ON "SMSDeliveryLog"("status");

-- CreateIndex
CREATE INDEX "SMSDeliveryLog_timestamp_idx" ON "SMSDeliveryLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoIoT_deviceId_key" ON "DispositivoIoT"("deviceId");

-- CreateIndex
CREATE INDEX "DispositivoIoT_deviceId_idx" ON "DispositivoIoT"("deviceId");

-- CreateIndex
CREATE INDEX "DispositivoIoT_ubicacionId_idx" ON "DispositivoIoT"("ubicacionId");

-- CreateIndex
CREATE INDEX "DispositivoIoT_empresaId_idx" ON "DispositivoIoT"("empresaId");

-- CreateIndex
CREATE INDEX "DispositivoIoT_tipo_idx" ON "DispositivoIoT"("tipo");

-- CreateIndex
CREATE INDEX "DispositivoIoT_activo_idx" ON "DispositivoIoT"("activo");

-- CreateIndex
CREATE INDEX "KpiEvento_ubicacionId_idx" ON "KpiEvento"("ubicacionId");

-- CreateIndex
CREATE INDEX "KpiEvento_tipo_idx" ON "KpiEvento"("tipo");

-- CreateIndex
CREATE INDEX "KpiEvento_evento_idx" ON "KpiEvento"("evento");

-- CreateIndex
CREATE INDEX "KpiEvento_timestamp_idx" ON "KpiEvento"("timestamp");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoInventario" ADD CONSTRAINT "PedidoInventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoInventario" ADD CONSTRAINT "PedidoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoInventario" ADD CONSTRAINT "PedidoInventario_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_dispositivoIoTId_fkey" FOREIGN KEY ("dispositivoIoTId") REFERENCES "DispositivoIoT"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorLectura" ADD CONSTRAINT "SensorLectura_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorLectura" ADD CONSTRAINT "SensorLectura_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorLectura" ADD CONSTRAINT "SensorLectura_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorLectura" ADD CONSTRAINT "SensorLectura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaHistorial" ADD CONSTRAINT "AlertaHistorial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaHistorial" ADD CONSTRAINT "AlertaHistorial_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaHistorial" ADD CONSTRAINT "AlertaHistorial_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaHistorial" ADD CONSTRAINT "AlertaHistorial_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionAlerta" ADD CONSTRAINT "ConfiguracionAlerta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionAlerta" ADD CONSTRAINT "ConfiguracionAlerta_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinatarioAlerta" ADD CONSTRAINT "DestinatarioAlerta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionAlertaDestinatario" ADD CONSTRAINT "ConfiguracionAlertaDestinatario_configuracionAlertaId_fkey" FOREIGN KEY ("configuracionAlertaId") REFERENCES "ConfiguracionAlerta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionAlertaDestinatario" ADD CONSTRAINT "ConfiguracionAlertaDestinatario_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "DestinatarioAlerta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroEnvioSMS" ADD CONSTRAINT "RegistroEnvioSMS_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "AlertaHistorial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSDeliveryLog" ADD CONSTRAINT "SMSDeliveryLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSDeliveryLog" ADD CONSTRAINT "SMSDeliveryLog_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "AlertaHistorial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispositivoIoT" ADD CONSTRAINT "DispositivoIoT_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispositivoIoT" ADD CONSTRAINT "DispositivoIoT_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiEvento" ADD CONSTRAINT "KpiEvento_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
