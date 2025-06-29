'use client'
import { UserContextProvider } from '@/context/ServerUserContext'
import { User } from '@/types/user'

export default function AdminShell({ user, children }: { user: User, children: React.ReactNode }) {
  return <UserContextProvider user={user}>{children}</UserContextProvider>
}