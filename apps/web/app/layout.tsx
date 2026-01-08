import type { Metadata } from 'next'
import { AuthProvider } from '@/app/lib/auth'
import { AuthBar } from '@/app/components/AuthBar'

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
          <AuthBar />
          <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '80px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
