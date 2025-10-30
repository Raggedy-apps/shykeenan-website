import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './react-app/App.jsx'
import './styles/index.css'
import './styles/neon-theme.css'
import './styles/react-app.css'

// Initialize the React application
ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)