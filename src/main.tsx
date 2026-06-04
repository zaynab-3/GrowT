import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './styles/pixel-system.css'
import './styles/pixel-layout.css'
import './styles/pixel-features.css'
import './styles/pixel-views.css'
import './styles/pixel-responsive.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
