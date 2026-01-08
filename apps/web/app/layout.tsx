import type { Metadata } from 'next'
import { AuthProvider } from '@/app/lib/auth-context'
import { RoleSwitcher } from '@/app/lib/role-switcher'

export const metadata: Metadata = {
  title: 'Case Management',
  description: 'E2E MVP Case Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RoleSwitcher />
          <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '80px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
