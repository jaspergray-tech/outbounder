import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'OWNER' | 'MANAGER'
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: 'OWNER' | 'MANAGER'
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: 'OWNER' | 'MANAGER'
  }
}
