import { Routes, Route } from 'react-router-dom'
import './App.css'

import { Header } from '@/components/layout/header'
import HomePage from '@/app/page'
import FlightsPage from '@/app/flights/page'
import LoginPage from '@/app/login/page'
import RegisterPage from '@/app/register/page'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/flights" element={<FlightsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  )
}

export default App 



