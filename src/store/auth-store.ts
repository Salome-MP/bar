import { create } from 'zustand'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  role: string
  bar_id: string | null
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isLoading: boolean
  initialized: boolean
  setTokens: (access: string, refresh: string) => void
  fetchUser: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    bar_name: string
    first_name: string
    last_name: string
    email: string
    password: string
    phone?: string
  }) => Promise<void>
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null,
  user: null,
  isLoading: false,
  initialized: false,

  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    set({ accessToken: access, refreshToken: refresh })
  },

  fetchUser: async () => {
    try {
      const token = get().accessToken
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      set({ user: data })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, accessToken: null, refreshToken: null })
    }
  },

  login: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    get().setTokens(data.access_token, data.refresh_token)
    await get().fetchUser()
  },

  register: async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (!res.ok) throw new Error('Register failed')
    const data = await res.json()
    get().setTokens(data.access_token, data.refresh_token)
    await get().fetchUser()
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ accessToken: null, refreshToken: null, user: null })
  },

  hydrate: async () => {
    const token = get().accessToken
    if (token) {
      set({ isLoading: true })
      await get().fetchUser()
      set({ isLoading: false, initialized: true })
    } else {
      set({ isLoading: false, initialized: true })
    }
  },
}))
