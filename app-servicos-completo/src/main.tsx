import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './lib/useToast.tsx'
import { AppProviders } from './Providers.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AppProviders>
        <App />
      </AppProviders>
    </ToastProvider>
  </StrictMode>,
)
