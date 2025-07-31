import { Card, CardContent } from "./Card";
import Skeleton from "./Skeleton";


export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}