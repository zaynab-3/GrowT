import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PwaInstallProvider } from './components/PwaInstallProvider.tsx'
import { startAppFreshnessChecks } from './pwaFreshness.ts'

startAppFreshnessChecks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaInstallProvider>
      <App />
    </PwaInstallProvider>
  </StrictMode>,
)
