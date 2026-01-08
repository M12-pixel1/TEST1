'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type Role = 'AUTHOR' | 'APPROVER'

interface AuthContextType {
  role: Role
  email: string
  setRole: (role: Role) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>('AUTHOR')
  
  const email = role === 'AUTHOR' ? 'author@test.com' : 'approver@test.com'
  
  const setRole = (newRole: Role) => {
    setRoleState(newRole)
  }

  return (
    <AuthContext.Provider value={{ role, email, setRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
