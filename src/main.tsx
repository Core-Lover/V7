import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Web3ModalProvider } from './contexts/Web3ModalProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Web3ModalProvider>
        <App />
      </Web3ModalProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
