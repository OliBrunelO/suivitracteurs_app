import { Navbar } from './Navbar'
import { Toaster } from 'react-hot-toast'

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: '14px' },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
    </div>
  )
}
