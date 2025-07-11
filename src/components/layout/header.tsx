import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { User, LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

const NO_HEADER_PAGES = ['/login', '/register'];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (NO_HEADER_PAGES.includes(location.pathname)) {
    return null;
  }

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-app bg-app shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {theme === 'dark' ? (
                <img src="/dark_icon_transparent.png" alt="FlightBooker" className="h-12 w-12" />
              ) : (
                <img src="/icon_transparent.png" alt="FlightBooker" className="h-12 w-12" />
              )}
              {theme === 'dark' ? (
                <span className="text-xl font-bold text-foreground">FlightBooker</span>
              ) : (
                <div className="flex items-center space-x-0.2">
                  <span className="text-xl font-bold text-blue-900">Flight</span>
                  <span className="text-xl font-bold text-blue-400">Booker</span>
                </div>
              )}
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/flights" 
              className="text-secondary-foreground hover:text-blue-600 px-3 py-2 text-sm font-medium"
            >
              Search Flights
            </Link>
            {isAuthenticated && (
              <Link 
                to="/my-bookings" 
                className="text-secondary-foreground hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                My Bookings
              </Link>
            )}
            {user?.role === 'ROLE_ADMIN' && (
              <Link 
                to="/admin-dashboard" 
                className="text-secondary-foreground hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                Admin Dashboard
              </Link>
            )}
            {user?.role === 'ROLE_AIRLINE_STAFF' && (
              <Link 
                to="/staff-dashboard" 
                className="text-secondary-foreground hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                Staff Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-secondary-foreground hover:text-blue-600">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2"> 
                  <User className="h-4 w-4 text-secondary-foreground" />
                  <span className="text-sm text-secondary-foreground">{user?.firstName} {user?.lastName}</span>
                </div>
                <Button
                  size="sm" 
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="secondary" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    <div className="pt-16"/>
    </>
  )
} 