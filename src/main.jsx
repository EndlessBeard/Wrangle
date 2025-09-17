import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ListManagerProvider } from './ListManager.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ListManagerProvider>
      <App />
    </ListManagerProvider>
  </StrictMode>,
)
