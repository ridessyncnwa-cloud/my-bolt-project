import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Car,
  User,
  History,
  Crown,
  Users,
  LogOut,
  Menu,
  X,
  Star,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { RideBooking } from './RideBooking';
import { RideHistory } from './RideHistory';
import { MembershipPanel } from './MembershipPanel';
import { ReferralPanel } from './ReferralPanel';
import { ProfileSettings } from './ProfileSettings';

type TabType = 'booking' | 'history' | 'membership' | 'referrals' | 'profile';

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState<TabType>('booking');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    requestNotificationPermission();
    requestLocationPermission();

    const checkExpiredRides = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-decline-expired-rides`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();
        console.log('Auto-decline check:', result);
      } catch (error) {
        console.error('Error checking expired rides:', error);
      }
    };

    checkExpiredRides();
    const interval = setInterval(checkExpiredRides, 60000);

    return () => clearInterval(interval);
  }, []);

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

  const requestLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        await navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Location permission granted:', position.coords);
          },
          (error) => {
            console.error('Location permission denied:', error);
          }
        );
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  const tabs = [
    { id: 'booking' as TabType, label: 'Sync a Ride', icon: Car, color: 'text-blue-600' },
    { id: 'history' as TabType, label: 'Ride History', icon: History, color: 'text-green-600' },
    { id: 'membership' as TabType, label: 'Membership', icon: Crown, color: 'text-yellow-600' },
    { id: 'referrals' as TabType, label: 'Referrals', icon: Users, color: 'text-purple-600' },
    { id: 'profile' as TabType, label: 'Profile', icon: User, color: 'text-gray-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'booking':
        return <RideBooking />;
      case 'history':
        return <RideHistory />;
      case 'membership':
        return <MembershipPanel />;
      case 'referrals':
        return <ReferralPanel />;
      case 'profile':
        return <ProfileSettings />;
      default:
        return <RideBooking />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-red-600/30 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-red-600/30">
          <div className="flex items-center">
            <img src="/logo.png" alt="RideSync" className="h-12 w-12 mr-2" />
            <span className="text-xl font-bold text-white">RideSync</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-red-600/30">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-full p-2">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name}
              </p>
              <div className="flex items-center mt-1">
                <Crown className="h-3 w-3 text-yellow-500 mr-1" />
                <p className="text-xs text-gray-400">
                  {profile?.membership_tier === 'sync_diamond'
                    ? 'Sync Diamond Member'
                    : profile?.membership_tier === 'sync_gold'
                    ? 'Sync Gold Member'
                    : 'Sync Basic Member'}
                </p>
              </div>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="mt-3">
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase">Switch Role</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => switchRole('customer')}
                disabled={switchingRole || profile?.role === 'customer'}
                className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                  profile?.role === 'customer'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white border border-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {switchingRole ? <RefreshCw className="h-3 w-3 mx-auto animate-spin" /> : 'Rider'}
              </button>
              <button
                onClick={() => switchRole('driver')}
                disabled={switchingRole || profile?.role === 'driver'}
                className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                  profile?.role === 'driver'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white border border-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {switchingRole ? <RefreshCw className="h-3 w-3 mx-auto animate-spin" /> : 'Driver'}
              </button>
              <button
                onClick={() => switchRole('admin')}
                disabled={switchingRole || profile?.role === 'admin'}
                className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                  profile?.role === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white border border-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {switchingRole ? <RefreshCw className="h-3 w-3 mx-auto animate-spin" /> : 'Admin'}
              </button>
            </div>
          </div>

          {/* Member Status */}
          {profile?.membership_tier === 'sync_gold' && (
            <div className="mt-3 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-600/30 rounded-lg p-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-xs font-medium text-yellow-400">
                  Sync Gold Benefits Active
                </span>
              </div>
            </div>
          )}
          {profile?.membership_tier === 'sync_diamond' && (
            <div className="mt-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 border border-slate-500/30 rounded-lg p-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-slate-300 mr-2" />
                <span className="text-xs font-medium text-slate-200">
                  Sync Diamond Benefits Active
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-xl transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-red-900/50 to-blue-900/50 text-white border-l-4 border-red-500'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon className={`mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-red-400' : 'text-gray-500'}`} />
              {tab.label}
              {tab.id === 'membership' && !profile?.is_member && (
                <Crown className="ml-auto h-4 w-4 text-yellow-500" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-red-600/30 p-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-slate-950 border-b border-red-600/30">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white mr-4"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-white">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h1>
            </div>

            <div className="flex items-center space-x-4">

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 hover:bg-slate-800 rounded-lg p-2 transition-colors"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-full p-1">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-white">
                      {profile?.full_name}
                    </p>
                    <p className="text-xs text-gray-400">Customer Portal</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-red-600/30 rounded-lg shadow-xl py-2 z-50">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-slate-800 hover:text-white"
                    >
                      <User className="mr-3 h-4 w-4" />
                      Profile
                    </button>

                    <div className="border-t border-red-600/30 my-2"></div>

                    <div className="px-4 py-2">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Switch Role</p>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            switchRole('customer');
                            setDropdownOpen(false);
                          }}
                          disabled={switchingRole || profile?.role === 'customer'}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                            profile?.role === 'customer'
                              ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white'
                              : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {switchingRole ? 'Switching...' : 'Rider'}
                        </button>
                        <button
                          onClick={() => {
                            switchRole('driver');
                            setDropdownOpen(false);
                          }}
                          disabled={switchingRole || profile?.role === 'driver'}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                            profile?.role === 'driver'
                              ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white'
                              : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {switchingRole ? 'Switching...' : 'Driver'}
                        </button>
                        <button
                          onClick={() => {
                            switchRole('admin');
                            setDropdownOpen(false);
                          }}
                          disabled={switchingRole || profile?.role === 'admin'}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                            profile?.role === 'admin'
                              ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white'
                              : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {switchingRole ? 'Switching...' : 'Admin'}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-red-600/30 my-2"></div>

                    <button
                      onClick={() => {
                        handleSignOut();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}