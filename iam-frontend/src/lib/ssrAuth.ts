import { cookies } from 'next/headers'

export async function requireAuth() {
  const cookieStore = cookies()
  const jwt = cookieStore.get('jwt')?.value

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
    headers: {
      Cookie: `jwt=${jwt}`,
    },
    credentials: 'include',
    cache: 'no-store',
  })

  if (!res.ok) {
    return null
  }

  return await res.json()
} 