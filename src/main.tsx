import { WorldProvider } from 'koota/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DatabaseProvider } from './db/DatabaseProvider'
import { ecsWorld } from './ecs/world'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WorldProvider world={ecsWorld}>
      <DatabaseProvider>
        <App />
      </DatabaseProvider>
    </WorldProvider>
  </React.StrictMode>
)
