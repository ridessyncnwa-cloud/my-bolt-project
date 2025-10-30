import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Car, Users } from 'lucide-react';

export default function RoleSelection() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const selectRole = async (role: 'customer' | 'driver' | 'admin') => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error selecting role:', error);
      alert('Failed to select role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Patriotic overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-red-600 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-red-600 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-auto px-4">
        <div className="text-center mb-12">
          <img src="/logo.png" alt="RideSync" className="h-32 w-32 mx-auto mb-6 drop-shadow-2xl" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to <span className="text-red-500">RideSync</span>!
          </h1>
          <p className="text-xl text-gray-300">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Customer/Rider Option */}
          <button
            onClick={() => selectRole('customer')}
            disabled={loading}
            className="group relative bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-500/30 rounded-2xl p-8 hover:border-blue-500 transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="bg-blue-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
              <Users className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">I Need a Ride</h3>
            <p className="text-gray-400">
              Book rides, track drivers, and enjoy premium transportation
            </p>
          </button>

          {/* Driver Option */}
          <button
            onClick={() => selectRole('driver')}
            disabled={loading}
            className="group relative bg-gradient-to-br from-red-900 to-red-950 border-2 border-red-500/30 rounded-2xl p-8 hover:border-red-500 transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="bg-red-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-red-500/30 transition-colors">
              <Car className="h-10 w-10 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">I Want to Drive</h3>
            <p className="text-gray-400">
              Earn money on your schedule by providing premium rides
            </p>
          </button>
        </div>

        {loading && (
          <div className="text-center mt-8">
            <p className="text-white">Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
}
