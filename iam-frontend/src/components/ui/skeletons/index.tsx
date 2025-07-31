import { memo } from 'react'

// Skeleton para el dashboard
export const DashboardSkeleton = memo(() => (
  <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="md:hidden flex items-center px-3 py-2 bg-white border-b border-gray-100 shadow-sm">
        <div className="mr-2 w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="text-base font-semibold text-[#8E94F2]">IAM</div>
      </div>
      <div className="hidden md:block px-3 sm:px-6 py-3 sm:py-4 bg-white shadow-sm border-b border-gray-100">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB]">
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
      </main>
    </div>
  </div>
))

// Skeleton para Recharts
export const RechartsSkeleton = memo(() => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
))

// Skeleton para cards
export const CardSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
    <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
  </div>
))

// Skeleton para tablas
export const TableSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
    </div>
    <div className="divide-y divide-gray-200">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
))

// Skeleton para formularios
export const FormSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="h-6 bg-gray-200 rounded animate-pulse mb-6"></div>
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
    <div className="mt-6 flex space-x-3">
      <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
      <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
    </div>
  </div>
))

// Skeleton para navegación
export const NavigationSkeleton = memo(() => (
  <div className="bg-white border-b border-gray-200">
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="ml-4 h-6 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
))

// Skeleton para sidebar
export const SidebarSkeleton = memo(() => (
  <div className="w-64 bg-white border-r border-gray-200">
    <div className="p-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse mb-6"></div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  </div>
))

// Asignar displayName para debugging
DashboardSkeleton.displayName = 'DashboardSkeleton'
RechartsSkeleton.displayName = 'RechartsSkeleton'
CardSkeleton.displayName = 'CardSkeleton'
TableSkeleton.displayName = 'TableSkeleton'
FormSkeleton.displayName = 'FormSkeleton'
NavigationSkeleton.displayName = 'NavigationSkeleton'
SidebarSkeleton.displayName = 'SidebarSkeleton' 