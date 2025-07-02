import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

import { Header } from '@/components/layout/header'
import HomePage from '@/app/page'
import FlightsPage from '@/app/flights/page'
import LoginPage from '@/app/login/page'
import RegisterPage from '@/app/register/page'
import MyBookingsPage from '@/app/my-bookings/page'
import AdminDashboardPage from './app/admin-dashboard/page'
import StaffDashboardPage from './app/staff-dashboard/page'
import BookingPage from './app/booking/page'
import backgroundImage from '/images/background.jpeg'
import darkBackgroundImage from '/images/dark-background.jpeg'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const toggleDarkMode = () => {
    const body = document.body
    body.classList.toggle('dark')
    setDarkMode(!darkMode)
  }

  return (
    <div className="min-h-screen">
      <Header toggleDarkMode={toggleDarkMode} />
      <div>
        {/* Blurred Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-cover bg-center blur-sm" style={{ backgroundImage: `url(${darkMode ? darkBackgroundImage : backgroundImage})` }} />
          <div className="absolute inset-0 bg-white/40 dark:bg-gray-600/20 backdrop-blur-sm" />
        </div>
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/flights" element={<FlightsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            <Route path="/staff-dashboard" element={<StaffDashboardPage />} />
            <Route path="/booking/:flightId" element={<BookingPage />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App



