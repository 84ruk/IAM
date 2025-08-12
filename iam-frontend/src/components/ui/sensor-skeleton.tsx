'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function SensorCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-all duration-300 animate-pulse bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-gray-200" />
              <Skeleton className="h-3 w-24 bg-gray-200" />
            </div>
          </div>
          <Skeleton className="w-6 h-6 rounded bg-gray-200" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado del sensor */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20 bg-gray-200" />
          <Skeleton className="h-6 w-16 rounded-full bg-gray-200" />
        </div>
        
        {/* Información de ubicación */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 bg-gray-200" />
          <Skeleton className="h-3 w-28 bg-gray-200" />
        </div>
        
        {/* Última lectura */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 bg-gray-200" />
            <Skeleton className="h-4 w-8 bg-gray-200" />
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20 bg-gray-200" />
          <Skeleton className="h-8 w-20 bg-gray-200" />
          <Skeleton className="h-8 w-20 bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SensorGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SensorCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function SensorStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="hover:shadow-md transition-all duration-300 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded bg-gray-200" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 bg-gray-200" />
                <Skeleton className="h-6 w-12 bg-gray-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
