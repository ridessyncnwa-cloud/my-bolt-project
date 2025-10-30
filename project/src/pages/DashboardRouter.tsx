import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CustomerPortal from './customer/CustomerPortal';
import { DriverPortal } from './driver/DriverPortal';
import { AdminPortal } from './admin/AdminPortal';
import { Car, Loader2 } from 'lucide-react';

export default function DashboardRouter() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-full p-4 shadow-lg mb-4 inline-block">
            <Car className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-gray-600 font-medium">Loading your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (!profile.role) {
    return <Navigate to="/select-role" replace />;
  }

  switch (profile.role) {
    case 'customer':
      return <CustomerPortal />;
    case 'driver':
      return <DriverPortal />;
    case 'admin':
      return <AdminPortal />;
    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-white rounded-full p-4 shadow-lg mb-4 inline-block">
              <Car className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Role Not Recognized</h2>
            <p className="text-gray-600 mb-6">
              Your account role is not properly configured. Please contact support.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      );
  }
}