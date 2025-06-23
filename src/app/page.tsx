import { FlightSearchForm } from '@/components/forms/flight-search-form'
import { Plane, Clock, Shield, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find Your Perfect Flight
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-blue-100">
              Search, compare, and book flights from airlines around the world. 
              Your journey begins with the perfect flight.
            </p>
          </div>
        </div>
      </section>

      {/* Search Form Section */}
      <section className="relative -mt-12 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FlightSearchForm />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Why Choose FlightBooker?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              We make booking flights simple, secure, and affordable
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Plane className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Wide Selection
              </h3>
              <p className="mt-2 text-gray-600">
                Access to flights from major airlines worldwide
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Real-time Updates
              </h3>
              <p className="mt-2 text-gray-600">
                Live flight information and instant booking confirmation
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Secure Booking
              </h3>
              <p className="mt-2 text-gray-600">
                Your personal and payment information is always protected
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Best Prices
              </h3>
              <p className="mt-2 text-gray-600">
                Compare prices across airlines to find the best deals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Popular Destinations
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Discover amazing places around the world
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { city: 'New York', country: 'USA', image: '🗽' },
              { city: 'Paris', country: 'France', image: '🗼' },
              { city: 'Tokyo', country: 'Japan', image: '🏯' },
              { city: 'London', country: 'UK', image: '🏰' },
              { city: 'Dubai', country: 'UAE', image: '🏢' },
              { city: 'Sydney', country: 'Australia', image: '🌊' },
            ].map((destination, index) => (
              <div 
                key={index}
                className="relative overflow-hidden rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="text-4xl mb-3">{destination.image}</div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {destination.city}
                </h3>
                <p className="text-gray-600">{destination.country}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
