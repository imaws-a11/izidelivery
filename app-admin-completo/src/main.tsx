import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './lib/useToast.tsx'
import { AuthProvider } from './context/AuthContext'
import { AdminProvider } from './context/AdminProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <AdminProvider>
          <App />
        </AdminProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
