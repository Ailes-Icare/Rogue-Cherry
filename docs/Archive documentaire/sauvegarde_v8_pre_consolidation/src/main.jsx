import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { MessageBoxProvider } from './context/MessageBoxContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MessageBoxProvider>
      <App />
    </MessageBoxProvider>
  </React.StrictMode>,
)
