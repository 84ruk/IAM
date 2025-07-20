import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table 
      className={cn('w-full border-collapse', className)} 
      {...props} 
    />
  )
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead 
      className={cn('bg-gray-50', className)} 
      {...props} 
    />
  )
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody 
      className={cn('divide-y divide-gray-200', className)} 
      {...props} 
    />
  )
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr 
      className={cn('hover:bg-gray-50 transition-colors', className)} 
      {...props} 
    />
  )
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th 
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        className
      )} 
      {...props} 
    />
  )
}

export function TableCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td 
      className={cn('px-4 py-3 text-sm text-gray-900', className)} 
      {...props} 
    />
  )
} 