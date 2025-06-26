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
import backgroundImage from '@/assets/background.jpeg'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        {/* Blurred Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-cover bg-center blur-sm" style={{ backgroundImage: `url(${backgroundImage})` }} />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
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
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App



