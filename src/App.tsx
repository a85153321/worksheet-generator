import React from 'react'
import { AppProvider } from './app/AppContext'
import { Layout } from './app/Layout'
import './styles/app.css'

export const App: React.FC = () => {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  )
}

export default App
