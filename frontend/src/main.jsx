import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// intro.js CSS imported globally so the tour styles are available
import 'intro.js/introjs.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)