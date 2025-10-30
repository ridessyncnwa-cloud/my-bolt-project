import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MapPin, Users, Car, AlertCircle, LogOut, CheckCircle, XCircle, RefreshCw, Smartphone, Trash2 } from 'lucide-react';

type DriverApplication = {
  id: string;
  user_id: string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  status: string;
  created_at: string;
};

type PanicAlert = {
  id: string;
  ride_id: string;
  triggered_by_role: string;
  status: string;
  created_at: string;
};

type ErrorLog = {
  id: string;
  error_message: string;
  error_stack: string | null;
  user_id: string | null;
  page_url: string | null;
  severity: string;
  resolved: boolean;
  created_at: string;
};

type Ride = {
  id: string;
  customer_id: string;
  driver_id: string | null;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  total_amount: number;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

export function AdminPortal() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [alerts, setAlerts] = useState<PanicAlert[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [stats, setStats] = useState({ totalDrivers: 0, totalRides: 0, activeRides: 0, pwaInstalls: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [appsResult, alertsResult, errorsResult, ridesListResult, driversResult, ridesResult, activeRidesResult, pwaResult, customersResult] = await Promise.all([
      supabase.from('driver_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('panic_alerts').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('error_logs').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(20),
      supabase.from('rides').select('id, customer_id, driver_id, status, pickup_location, dropoff_location, total_amount, created_at, profiles!rides_customer_id_fkey(full_name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('driver_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('rides').select('id', { count: 'exact', head: true }),
      supabase.from('rides').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('pwa_installed', true).eq('role', 'customer'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    ]);

    if (appsResult.data) setApplications(appsResult.data);
    if (alertsResult.data) setAlerts(alertsResult.data);
    if (errorsResult.data) setErrors(errorsResult.data);
    if (ridesListResult.data) setRides(ridesListResult.data as unknown as Ride[]);

    setStats({
      totalDrivers: driversResult.count || 0,
      totalRides: ridesResult.count || 0,
      activeRides: activeRidesResult.count || 0,
      pwaInstalls: pwaResult.count || 0,
      totalCustomers: customersResult.count || 0,
    });

    setLoading(false);
  };

  const handleApplication = async (appId: string, status: 'approved' | 'rejected') => {
    const application = applications.find(a => a.id === appId);
    if (!application) return;

    const { error } = await supabase
      .from('driver_applications')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id,
      })
      .eq('id', appId);

    if (!error) {
      if (status === 'approved') {
        await supabase.from('driver_profiles').insert({
          user_id: application.user_id,
          qr_code: `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          vehicle_info: {
            make: application.vehicle_make,
            model: application.vehicle_model,
            year: application.vehicle_year,
          },
        });

        await supabase
          .from('profiles')
          .update({ role: 'driver' })
          .eq('id', application.user_id);
      }

      setApplications(applications.filter(a => a.id !== appId));
    }
  };

  const resolveError = async (errorId: string) => {
    const { error } = await supabase
      .from('error_logs')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: profile?.id,
      })
      .eq('id', errorId);

    if (!error) {
      setErrors(errors.filter(e => e.id !== errorId));
    }
  };

  const deleteRide = async (rideId: string) => {
    if (!confirm('Are you sure you want to delete this ride? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', rideId);

    if (!error) {
      setRides(rides.filter(r => r.id !== rideId));
      alert('Ride deleted successfully');
    } else {
      alert('Failed to delete ride: ' + error.message);
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
                <p className="text-xs text-blue-200">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="font-semibold">{profile?.full_name}</p>
                <p className="text-xs text-blue-200">Administrator</p>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Car className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.totalDrivers}</span>
            </div>
            <p className="text-gray-600">Total Drivers</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.totalRides}</span>
            </div>
            <p className="text-gray-600">Total Rides</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.activeRides}</span>
            </div>
            <p className="text-gray-600">Active Rides</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Smartphone className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.pwaInstalls}</span>
            </div>
            <p className="text-gray-600">PWA Installs</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-cyan-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.totalCustomers}</span>
            </div>
            <p className="text-gray-600">Total Customers</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">PWA Adoption Rate</h3>
              <p className="text-sm text-gray-600">Percentage of customers with app installed on home screen</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">
                {stats.totalCustomers > 0 ? Math.round((stats.pwaInstalls / stats.totalCustomers) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {stats.pwaInstalls} of {stats.totalCustomers} customers
              </div>
            </div>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <h2 className="text-xl font-bold text-red-900">Active Panic Alerts</h2>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-white rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {alert.triggered_by_role.toUpperCase()} Panic Alert
                    </p>
                    <p className="text-sm text-gray-600">{new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Respond
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Driver Applications</h2>

          {applications.length === 0 ? (
            <div className="text-center py-8">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No pending applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        Driver Application
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>License:</strong> {app.license_number}</p>
                        <p><strong>Vehicle:</strong> {app.vehicle_year} {app.vehicle_make} {app.vehicle_model}</p>
                        <p><strong>Applied:</strong> {new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApplication(app.id, 'approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleApplication(app.id, 'rejected')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-full font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Ride Requests</h2>

          {rides.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No rides found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => {
                const rel = ride.profiles;
                const customerName = Array.isArray(rel)
                  ? (rel[0]?.full_name ?? 'Unknown Customer')
                  : (rel?.full_name ?? 'Unknown Customer');
                const statusColors = {
                  requested: 'bg-yellow-100 text-yellow-700',
                  active: 'bg-green-100 text-green-700',
                  completed: 'bg-blue-100 text-blue-700',
                  cancelled: 'bg-red-100 text-red-700',
                };

                return (
                  <div key={ride.id} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[ride.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>
                            {ride.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(ride.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mb-2">{customerName}</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><strong>Pickup:</strong> {ride.pickup_location}</p>
                          <p><strong>Dropoff:</strong> {ride.dropoff_location}</p>
                          <p><strong>Amount:</strong> ${ride.total_amount.toFixed(2)}</p>
                          <p><strong>Driver Assigned:</strong> {ride.driver_id ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteRide(ride.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-full font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Ride</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Errors</h2>

          {errors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <p className="text-gray-600">No unresolved errors</p>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.map((error) => (
                <div key={error.id} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          error.severity === 'error' ? 'bg-red-100 text-red-700' :
                          error.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {error.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(error.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">{error.error_message}</p>
                      {error.page_url && (
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Page:</strong> {error.page_url}
                        </p>
                      )}
                      {error.error_stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            View Stack Trace
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                            {error.error_stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => resolveError(error.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-full font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Resolved</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
