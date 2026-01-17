import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpatialNavigationProvider } from './core/navigation'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpatialNavigationProvider>
      <App />
    </SpatialNavigationProvider>
  </StrictMode>,
)
