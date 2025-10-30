import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MapPin, Clock, DollarSign } from 'lucide-react';

type Ride = {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  rate_per_minute: number;
  duration_minutes: number;
  total_amount: number;
  created_at: string;
};

export function RideHistory() {
  const { profile } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, [profile]);

  const loadRides = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setRides(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading rides...</div>;
  }

  if (rides.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No rides yet. Book your first ride!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {rides.map((ride) => (
          <div key={ride.id} className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-start mb-2">
                  <MapPin className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">{ride.pickup_location}</p>
                    <p className="text-sm text-gray-600 mt-1">{ride.dropoff_location}</p>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                ride.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {ride.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{new Date(ride.created_at).toLocaleDateString()}</span>
                </div>
                {ride.duration_minutes > 0 && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{ride.duration_minutes} min</span>
                  </div>
                )}
              </div>
              {ride.total_amount > 0 && (
                <div className="flex items-center font-semibold text-gray-800">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span>{ride.total_amount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
