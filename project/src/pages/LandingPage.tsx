import { Link } from 'react-router-dom';
import { Shield, Clock, Users, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const [onlineDrivers, setOnlineDrivers] = useState(0);
  const [onlineRiders, setOnlineRiders] = useState(0);

  useEffect(() => {
    const fetchOnlineCounts = async () => {
      try {
        const { count: driverCount } = await supabase
          .from('driver_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        const { count: riderCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'customer');

        setOnlineDrivers(driverCount || 0);
        setOnlineRiders(riderCount || 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchOnlineCounts();

    const interval = setInterval(fetchOnlineCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Patriotic overlay pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-red-600 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-red-600 to-transparent"></div>
      </div>

      {/* Subtle stars background */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 bg-slate-900/80 backdrop-blur-sm border-b border-red-600/30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center">
              <img src="/logo.png" alt="RideSync" className="h-10 w-10 sm:h-14 sm:w-14 mr-2 sm:mr-3" />
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-red-500 via-white to-blue-500 bg-clip-text text-transparent">
                RideSync
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2 bg-blue-900/50 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-blue-500/30">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">{onlineDrivers} Drivers</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 bg-red-900/50 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-red-500/30">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">{onlineRiders} Riders</span>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Features Section */}
        <div className="bg-slate-900/50 backdrop-blur-sm py-12 sm:py-16 md:py-20 border-b border-red-600/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Why Choose <span className="text-red-500">RideSync</span>?
              </h2>
              <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-red-600 to-blue-600 mx-auto mt-4"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {/* Safety First */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-500/30 rounded-2xl p-4 sm:p-6 h-full">
                  <div className="bg-blue-500/20 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-blue-500/30 transition-colors">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Safety First</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    Rigorous background checks and real-time tracking for your peace of mind.
                  </p>
                </div>
              </div>

              {/* Reliable Service */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-red-900 to-red-950 border-2 border-red-500/30 rounded-2xl p-4 sm:p-6 h-full">
                  <div className="bg-red-500/20 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-red-500/30 transition-colors">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Always On Time</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    Punctual pickups and efficient routes to get you there when you need to be.
                  </p>
                </div>
              </div>

              {/* Community Focus */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-500/30 rounded-2xl p-4 sm:p-6 h-full">
                  <div className="bg-blue-500/20 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-blue-500/30 transition-colors">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Community Driven</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    Supporting local drivers and connecting neighbors across America.
                  </p>
                </div>
              </div>

              {/* Premium Experience */}
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-red-900 to-red-950 border-2 border-red-500/30 rounded-2xl p-4 sm:p-6 h-full">
                  <div className="bg-red-500/20 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-red-500/30 transition-colors">
                    <Star className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Premium Quality</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    Professional drivers and exceptional service that exceeds expectations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12 sm:pb-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
              <span className="text-white">Better Rides,</span>
              <br />
              <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">Better Drivers,</span>
              <br />
              <span className="text-blue-400">That's RideSync!</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              Experience premium transportation with American pride. Safe, reliable rides
              connecting communities with professional drivers who care.
            </p>

            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <Link
                to="/signup"
                className="group relative inline-flex items-center justify-center px-8 sm:px-12 py-3 sm:py-5 text-lg sm:text-2xl font-bold text-white bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-full shadow-2xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105 border-2 border-white/20 w-full max-w-xs sm:w-auto"
              >
                <span className="relative z-10">SYNC TODAY</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-6 py-2 rounded-md text-sm sm:text-base font-medium transition-colors underline"
              >
                Sign In
              </Link>

              <p className="text-xs sm:text-sm text-gray-400">
                Join the RideSync community • No credit card required
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-red-900 via-slate-900 to-blue-900 py-12 sm:py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Experience the Difference?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-10">
              Join the RideSync family and discover premium rides with patriotic pride.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-red-600/20 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-400">
              © 2025 RideSync. Proudly serving America.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
