import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DatabaseProvider } from './db/DatabaseProvider'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DatabaseProvider>
      <App />
    </DatabaseProvider>
  </React.StrictMode>
)
