'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={`stats-skeleton-${i}`} className="skeleton-pulse hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-gray-100">
                <Skeleton className="w-5 h-5 rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
