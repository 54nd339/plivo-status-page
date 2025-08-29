import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Plivo Status Page',
  description: 'Monitor the status of our services.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold leading-tight text-gray-900">
                  Plivo Status Page
                </h1>
              </div>
            </header>
            <main>
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}