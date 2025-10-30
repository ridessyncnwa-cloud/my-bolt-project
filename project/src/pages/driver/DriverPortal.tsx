import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MapPin, DollarSign, Star, LogOut, TrendingUp, RefreshCw, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { DriverMap } from '../../components/DriverMap';
import { QRScanner } from '../../components/QRScanner';
import RiderInfoCard from '../../components/RiderInfoCard';

type DriverProfile = {
  id: string;
  is_active: boolean;
  rating: number;
  total_rides: number;
  total_earnings: number;
};

type RideRequest = {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  estimated_fare: number;
  riders: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
    license_photo_url?: string;
    license_number?: string;
    is_verified?: boolean;
  }[];
};

export function DriverPortal() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<RideRequest | null>(null);

  useEffect(() => {
    loadDriverProfile();
    requestNotificationPermission();
  }, [profile]);

  useEffect(() => {
    console.log('[Driver] Polling useEffect triggered', {
      isActive: driverProfile?.is_active,
      hasPendingRequest: !!pendingRequest,
      profile: !!profile
    });

    if (!driverProfile?.is_active || pendingRequest) {
      console.log('[Driver] Not polling - driver not active or has pending request');
      return;
    }

    console.log('[Driver] Starting ride polling (every 5s)');
    const pollForRides = setInterval(() => {
      checkForNewRides();
    }, 5000);

    checkForNewRides();

    return () => {
      console.log('[Driver] Stopping ride polling');
      clearInterval(pollForRides);
    };
  }, [driverProfile?.is_active, pendingRequest, profile]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  const loadDriverProfile = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (data) {
      setDriverProfile(data);
    }
    setLoading(false);
  };

  const toggleActive = async () => {
    if (!driverProfile) return;

    const newActiveStatus = !driverProfile.is_active;
    console.log('[Driver] Toggling active status to:', newActiveStatus);

    const { error } = await supabase
      .from('driver_profiles')
      .update({ is_active: newActiveStatus })
      .eq('id', driverProfile.id);

    if (!error) {
      console.log('[Driver] Active status updated successfully');
      setDriverProfile({ ...driverProfile, is_active: newActiveStatus });
    } else {
      console.error('[Driver] Error updating active status:', error);
    }
  };

  const switchRole = async (newRole: 'customer' | 'driver' | 'admin') => {
    if (!profile) return;

    setSwitchingRole(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
    } catch (error) {
      console.error('Error switching role:', error);
      alert('Failed to switch role. Please try again.');
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleCustomerVerified = (customerData: any) => {
    console.log('Customer verified:', customerData);
    alert(`Customer ${customerData.full_name} verified successfully!`);
  };

  const checkForNewRides = async () => {
    if (!profile) return;

    console.log('[Driver] Checking for new rides...');

    const { data: rides, error } = await supabase
      .from('rides')
      .select(`
        id,
        pickup_location,
        dropoff_location,
        total_amount,
        matched_stranger_id,
        matched_stranger_name,
        matched_stranger_photo_url,
        matched_stranger_pickup_location,
        matched_stranger_dropoff_location,
        status,
        customer_id,
        declined_by_drivers,
        profiles!rides_customer_id_fkey (
          full_name,
          profile_photo_url,
          license_photo_url,
          license_number
        )
      `)
      .eq('status', 'requested')
      .is('driver_id', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    console.log('[Driver] Ride query result:', { rides, error });

    if (rides && !error) {
      // RLS policy already filters out declined rides, so this ride is available
      const riders: RideRequest['riders'] = [];

      const profileData = Array.isArray(rides.profiles) ? (rides.profiles.length > 0 ? rides.profiles[0] : null) : rides.profiles;
      if (profileData) {
        riders.push({
          id: rides.customer_id,
          full_name: profileData.full_name || 'Customer',
          profile_photo_url: profileData.profile_photo_url || undefined,
          license_photo_url: profileData.license_photo_url || undefined,
          license_number: profileData.license_number || undefined,
          is_verified: true,
        });
      }

      if (rides.matched_stranger_id && rides.matched_stranger_name) {
        riders.push({
          id: rides.matched_stranger_id,
          full_name: rides.matched_stranger_name,
          profile_photo_url: rides.matched_stranger_photo_url || undefined,
          license_photo_url: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=400',
          license_number: 'DL-VERIFIED',
          is_verified: true,
        });
      }

      setPendingRequest({
        id: rides.id,
        pickup_location: rides.pickup_location,
        dropoff_location: rides.dropoff_location,
        estimated_fare: rides.total_amount || 25.50,
        riders,
      });
    }
  };

  const handleAcceptRide = async () => {
    if (!pendingRequest || !profile) return;

    console.log('[Driver] Attempting to accept ride:', {
      rideId: pendingRequest.id,
      driverId: profile.id,
      driverUserId: profile.user_id
    });

    try {
      const { data, error } = await supabase
        .from('rides')
        .update({
          driver_id: profile.id,
          status: 'active',
          accepted_at: new Date().toISOString()
        })
        .eq('id', pendingRequest.id)
        .select();

      console.log('[Driver] Accept result:', { data, error });

      if (error) throw error;

      alert('Ride accepted! Navigate to pickup location.');
      setPendingRequest(null);
    } catch (error) {
      console.error('Error accepting ride:', error);
      alert(`Failed to accept ride: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDeclineRide = async () => {
    if (!pendingRequest || !profile) return;

    console.log('[Driver] Attempting to decline ride:', {
      rideId: pendingRequest.id,
      rideStatus: pendingRequest.status,
      rideDriverId: pendingRequest.driver_id,
      driverProfileId: profile.id,
      driverUserId: profile.user_id,
      authUserId: (await supabase.auth.getUser()).data.user?.id
    });

    try {
      const { data: currentRide, error: fetchError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', pendingRequest.id)
        .single();

      console.log('[Driver] Current ride full data:', { currentRide, fetchError });

      if (fetchError) throw fetchError;

      const declinedByDrivers = currentRide?.declined_by_drivers || [];
      console.log('[Driver] Current declined list:', declinedByDrivers);
      console.log('[Driver] Adding user_id to declined:', profile.user_id);
      declinedByDrivers.push(profile.user_id);
      console.log('[Driver] New declined list:', declinedByDrivers);

      const { data, error } = await supabase
        .from('rides')
        .update({
          declined_by_drivers: declinedByDrivers
        })
        .eq('id', pendingRequest.id)
        .select();

      console.log('[Driver] Decline result:', { data, error, errorDetails: error?.details, errorHint: error?.hint, errorCode: error?.code });

      if (error) throw error;

      console.log('[Driver] Ride declined, added to declined list');
      setPendingRequest(null);
    } catch (error) {
      console.error('Error declining ride:', error);
      alert(`Failed to decline ride: ${error.message || 'Please try again.'}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!driverProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Driver Application Pending</h2>
          <p className="text-gray-600 mb-6">
            Your driver application is being reviewed. You'll receive access to the driver portal once approved.
          </p>
          <button
            onClick={signOut}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold">RideSync</h1>
                <p className="text-xs text-blue-200">Driver Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="font-semibold">{profile?.full_name}</p>
                <p className="text-xs text-blue-200">
                  {driverProfile.is_active ? (
                    <span className="text-green-300">Active</span>
                  ) : (
                    <span className="text-gray-300">Offline</span>
                  )}
                </p>
              </div>

              <div className="flex gap-1 bg-blue-800 rounded-lg p-1">
                <button
                  onClick={() => switchRole('customer')}
                  disabled={switchingRole || profile?.role === 'customer'}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    profile?.role === 'customer'
                      ? 'bg-white text-blue-900'
                      : 'text-blue-200 hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {switchingRole ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Rider'}
                </button>
                <button
                  onClick={() => switchRole('driver')}
                  disabled={switchingRole || profile?.role === 'driver'}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    profile?.role === 'driver'
                      ? 'bg-white text-blue-900'
                      : 'text-blue-200 hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {switchingRole ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Driver'}
                </button>
                <button
                  onClick={() => switchRole('admin')}
                  disabled={switchingRole || profile?.role === 'admin'}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    profile?.role === 'admin'
                      ? 'bg-white text-blue-900'
                      : 'text-blue-200 hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {switchingRole ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Admin'}
                </button>
              </div>

              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-800">
                ${driverProfile.total_earnings.toFixed(2)}
              </span>
            </div>
            <p className="text-gray-600">Total Earnings</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">
                {driverProfile.total_rides}
              </span>
            </div>
            <p className="text-gray-600">Total Rides</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-800">
                {driverProfile.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-gray-600">Rating</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {driverProfile.is_active ? 'You Are Active' : 'You Are Offline'}
            </h2>
            <p className="text-gray-600 mb-8">
              {driverProfile.is_active
                ? 'You will receive ride requests from nearby customers'
                : 'Toggle active to start receiving ride requests'}
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={toggleActive}
                className={`px-12 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 ${
                  driverProfile.is_active
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {driverProfile.is_active ? 'Go Offline' : 'Go Active'}
              </button>

              <button
                onClick={() => setShowQRScanner(true)}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white rounded-full text-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <QrCode className="w-6 h-6" />
                Scan Customer
              </button>
            </div>

            {driverProfile.is_active && !pendingRequest && (
              <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-blue-900 font-semibold">
                  Waiting for ride requests...
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  You'll be notified when a customer requests a ride nearby
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-8">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Live Map with Hot Spots</h3>
              <p className="text-xs text-red-100">Red zones show areas with high rider demand</p>
            </div>
            {driverProfile.is_active && (
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold">Live Updates</span>
              </div>
            )}
          </div>
          <div style={{ height: '500px' }}>
            <DriverMap isActive={driverProfile.is_active} />
          </div>
        </div>
      </div>

      {showQRScanner && (
        <QRScanner
          onClose={() => setShowQRScanner(false)}
          onVerified={handleCustomerVerified}
          scannerRole="driver"
        />
      )}

      {pendingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
              <h2 className="text-2xl font-bold mb-2">New Ride Request!</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Estimated Fare</p>
                  <p className="text-3xl font-bold">${pendingRequest.estimated_fare.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Pickup</p>
                    <p className="font-semibold text-gray-900">{pendingRequest.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Dropoff</p>
                    <p className="font-semibold text-gray-900">{pendingRequest.dropoff_location}</p>
                  </div>
                </div>
              </div>

              <RiderInfoCard riders={pendingRequest.riders} />

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleDeclineRide}
                  className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Decline
                </button>
                <button
                  onClick={handleAcceptRide}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
