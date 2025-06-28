import { cookies } from 'next/headers'

export async function requireAuth() {
  try {
    const cookieStore = await cookies()
    const jwt = cookieStore.get('jwt')?.value

    if (!jwt) {
      console.log('No JWT cookie found')
      return null
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Cookie: `jwt=${jwt}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    })

    if (!res.ok) {
      console.log('Auth check failed:', res.status, res.statusText)
      return null
    }

    return await res.json()
  } catch (error) {
    console.error('Error in requireAuth:', error)
    return null
  }
} 