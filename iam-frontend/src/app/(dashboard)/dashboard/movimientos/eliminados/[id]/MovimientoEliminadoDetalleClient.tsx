"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { FormErrorAlert } from '@/components/ui/FormErrorAlert';
import VolverAtras from '@/components/ui/VolverAtras';
import { Movimiento } from '@/types/movimiento';
import { Package, Calendar, MessageCircle, FileText, Eye, CheckCircle, XCircle, Mail, Phone, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MovimientoEliminadoDetalleClient() {
  const params = useParams();
  const router = useRouter();
  const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurando, setRestaurando] = useState(false);

  useEffect(() => {
    const fetchMovimiento = async () => {
      try {
        const response = await fetch(`/api/movimientos/eliminados/${params.id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Error al cargar el movimiento');
        }

        const data = await response.json();
        setMovimiento(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchMovimiento();
    }
  }, [params.id]);

  const handleRestaurar = async () => {
    if (!movimiento) return;

    setRestaurando(true);
    try {
      const response = await fetch(`/api/movimientos/${movimiento.id}/restaurar`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al restaurar el movimiento');
      }

      // Redirigir a la página de movimientos
      router.push('/dashboard/movimientos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restaurar');
    } finally {
      setRestaurando(false);
    }
  };

  const handleEliminarPermanente = async () => {
    if (!movimiento || !confirm('¿Estás seguro de que quieres eliminar permanentemente este movimiento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/movimientos/${movimiento.id}/permanent`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar permanentemente');
      }

      // Redirigir a la papelera
      router.push('/dashboard/movimientos/eliminados');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES');
  };

  const getTipoInfo = (tipo: 'ENTRADA' | 'SALIDA') => {
    return tipo === 'ENTRADA' 
      ? { 
          color: 'bg-green-100 text-green-700', 
          icon: '↓', 
          text: 'Entrada'
        }
      : { 
          color: 'bg-red-100 text-red-700', 
          icon: '↑', 
          text: 'Salida'
        }
  };

  const getStockStatus = (stock: number, stockMinimo: number) => {
    if (stock <= 0) {
      return { color: 'bg-red-100 text-red-700', text: 'Sin stock' };
    } else if (stock <= stockMinimo) {
      return { color: 'bg-yellow-100 text-yellow-700', text: 'Stock bajo' };
    } else {
      return { color: 'bg-green-100 text-green-700', text: 'Stock normal' };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !movimiento) {
    return (
      <div className="container mx-auto p-6">
        <VolverAtras href="/dashboard/movimientos/eliminados" label="Volver a papelera" />
        <FormErrorAlert errors={[error || 'Movimiento no encontrado']} />
      </div>
    );
  }

  const tipoInfo = getTipoInfo(movimiento.tipo);
  const stockStatus = movimiento.producto ? getStockStatus(movimiento.producto.stock, movimiento.producto.stockMinimo) : null;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <VolverAtras href="/dashboard/movimientos/eliminados" label="Volver a papelera" />
        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          Detalles del Movimiento Eliminado
        </h1>
        <p className="text-gray-600 mt-2">
          ID: {movimiento.id} - Estado: Eliminado
        </p>
      </div>

      <div className="grid gap-6">
        {/* Información del Movimiento */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Información del Movimiento</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Cantidad</p>
                  <p className="font-medium text-lg">{movimiento.cantidad} {movimiento.producto?.unidad}</p>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full font-medium",
                  tipoInfo.color
                )}>
                  {tipoInfo.icon} {tipoInfo.text}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha y hora</p>
                  <p className="font-medium">{formatearFecha(movimiento.fecha)}</p>
                </div>
              </div>

              {movimiento.motivo && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Motivo</p>
                    <p className="font-medium">{movimiento.motivo}</p>
                  </div>
                </div>
              )}

              {movimiento.descripcion && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Descripción</p>
                    <p className="font-medium italic">{movimiento.descripcion}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información del Producto */}
        {movimiento.producto && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Información del Producto</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">{movimiento.producto.nombre}</h3>
                  {movimiento.producto.descripcion && (
                    <p className="text-gray-600 text-sm mb-3">{movimiento.producto.descripcion}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Stock actual</p>
                    <span className={cn(
                      "inline-flex px-2 py-1 text-xs rounded-full font-medium",
                      stockStatus?.color
                    )}>
                      {movimiento.producto.stock} {movimiento.producto.unidad}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stock mínimo</p>
                    <p className="font-medium">{movimiento.producto.stockMinimo} {movimiento.producto.unidad}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Precio compra</p>
                    <p className="font-medium">${movimiento.producto.precioCompra.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precio venta</p>
                    <p className="font-medium">${movimiento.producto.precioVenta.toFixed(2)}</p>
                  </div>
                </div>

                {movimiento.producto.etiquetas && movimiento.producto.etiquetas.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Etiquetas</p>
                    <div className="flex flex-wrap gap-1">
                      {movimiento.producto.etiquetas.map((etiqueta, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium border border-blue-200"
                        >
                          {etiqueta}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {movimiento.producto.codigoBarras && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Código de barras</p>
                    <p className="font-mono text-sm">{movimiento.producto.codigoBarras}</p>
                  </div>
                )}

                {movimiento.producto.sku && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">SKU</p>
                    <p className="font-mono text-sm">{movimiento.producto.sku}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
                    movimiento.producto.estado === 'ACTIVO' 
                      ? 'bg-green-100 text-green-700'
                      : movimiento.producto.estado === 'INACTIVO'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  )}>
                    {movimiento.producto.estado === 'ACTIVO' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {movimiento.producto.estado}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información del proveedor */}
        {movimiento.producto?.proveedor && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Proveedor</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">{movimiento.producto.proveedor.nombre}</h3>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
                    movimiento.producto.proveedor.estado === 'ACTIVO' 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {movimiento.producto.proveedor.estado === 'ACTIVO' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {movimiento.producto.proveedor.estado}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movimiento.producto.proveedor.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{movimiento.producto.proveedor.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {movimiento.producto.proveedor.telefono && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Teléfono</p>
                        <p className="font-medium">{movimiento.producto.proveedor.telefono}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Acciones</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleRestaurar}
                disabled={restaurando}
                className="flex items-center gap-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-700 disabled:text-gray-500 font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {restaurando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Restaurar Movimiento
                  </>
                )}
              </Button>
              <Button
                onClick={handleEliminarPermanente}
                className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Permanentemente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 