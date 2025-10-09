import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function apiFetch<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(input, { ...init, headers })
  let data: any = null
  try { data = await res.json() } catch {}

  if (!res.ok) {
    const message = data?.error || `Request failed: ${res.status}`
    if (typeof window !== 'undefined' && (res.status === 401 || res.status === 403)) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } catch {}
      try {
        window.location.href = '/'
      } catch {}
    }
    throw new Error(message)
  }
  return data as T
}
