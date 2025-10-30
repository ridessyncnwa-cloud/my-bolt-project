import { useState, useEffect } from 'react';
import { DollarSign, Clock, TrendingUp, Users, Crown, Zap, QrCode, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MapWithAutocomplete } from '../../components/MapWithAutocomplete';
import { createRideGeofence, validateNWAGeofence, isPointInNWA } from '../../lib/geofence';
import { calculateDistance, estimateDuration } from '../../lib/routeOptimization';
import { QRScanner } from '../../components/QRScanner';
import DriverInfoCard from '../../components/DriverInfoCard';
import GroupRideCreator from '../../components/GroupRideCreator';
import { StrangerInfoCard } from '../../components/StrangerInfoCard';

type Location = {
  lat: number;
  lng: number;
  address: string;
};

type RouteInfo = {
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
};

export function RideBooking() {
  const { profile } = useAuth();
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasOnlineDrivers] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [matchedDriver, setMatchedDriver] = useState<any>(null);
  const [showGroupQR, setShowGroupQR] = useState(false);
  const [rideId, setRideId] = useState<string | null>(null);
  const [matchWithStranger, setMatchWithStranger] = useState(false);
  const [preferredDriverGender, setPreferredDriverGender] = useState<'any' | 'male' | 'female'>('any');
  const [isPreferredDriver, setIsPreferredDriver] = useState(false);
  const [scannedMembers, setScannedMembers] = useState<number>(0);
  const [allPaid, setAllPaid] = useState(false);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [rideStatus, setRideStatus] = useState<'booking' | 'searching' | 'tracking' | 'completed'>('booking');
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [distanceToPickup, setDistanceToPickup] = useState<number>(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [preferDriver, setPreferDriver] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [invitedPhones, setInvitedPhones] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [driverOnAnotherRide, setDriverOnAnotherRide] = useState(false);
  const [driverAvailableIn, setDriverAvailableIn] = useState<number>(0);
  const [pickupInNWA, setPickupInNWA] = useState(true);
  const [dropoffInNWA, setDropoffInNWA] = useState(true);
  const [matchedStranger, setMatchedStranger] = useState<any>(null);
  const [strangerPickupOrder, setStrangerPickupOrder] = useState<'customer_first' | 'stranger_first'>('customer_first');
  const [aiMessage, setAiMessage] = useState<string>('');
  const [showDiscountOffer, setShowDiscountOffer] = useState(false);
  const [discountOffer, setDiscountOffer] = useState<any>(null);
  const [waitTime, setWaitTime] = useState<number>(0);

  const membershipTier = profile?.membership_tier || 'sync_basic';

  const getGroupRate = (tier: string, count: number, isStrangerMatch: boolean = false) => {
    let baseRate;
    if (tier === 'sync_diamond') {
      if (isStrangerMatch && count === 1) return 0.50;
      if (count === 1) baseRate = 0.55;
      else if (count === 2) baseRate = 0.50;
      else if (count === 3) baseRate = 0.45;
      else baseRate = 0.40;
    } else if (tier === 'sync_gold') {
      if (isStrangerMatch && count === 1) return 0.60;
      if (count === 1) baseRate = 0.65;
      else if (count === 2) baseRate = 0.60;
      else if (count === 3) baseRate = 0.55;
      else baseRate = 0.50;
    } else {
      if (isStrangerMatch && count === 1) return 0.70;
      if (count === 1) baseRate = 0.75;
      else if (count === 2) baseRate = 0.70;
      else if (count === 3) baseRate = 0.65;
      else baseRate = 0.60;
    }
    return baseRate;
  };

  const getIndividualPlatformFee = (tier: string) => {
    return tier === 'sync_diamond' ? 0 : tier === 'sync_gold' ? 1.5 : 3.0;
  };

  const calculateMemberCost = (member: any) => {
    const memberRate = getGroupRate(member.membership_tier, passengerCount);
    const memberFee = getIndividualPlatformFee(member.membership_tier);
    const memberBase = routeInfo ? (routeInfo.duration / passengerCount) * memberRate : 0;
    return memberBase + memberFee;
  };

  const rate = getGroupRate(membershipTier, passengerCount, matchWithStranger);
  const platformFee = getIndividualPlatformFee(membershipTier);

  const baseCost = routeInfo ? (routeInfo.duration / passengerCount) * rate : null;
  const estimatedCost = baseCost ? baseCost + platformFee : null;

  const regularRate = getGroupRate(membershipTier, passengerCount, false);
  const strangerSavings = matchWithStranger && passengerCount === 1 ?
    routeInfo ? routeInfo.duration * (regularRate - rate) : 0 : 0;

  const calculateRoute = () => {
    if (!pickupLocation || !dropoffLocation) {
      setRouteInfo(null);
      return;
    }

    const distanceMiles = calculateDistance(
      pickupLocation.lat,
      pickupLocation.lng,
      dropoffLocation.lat,
      dropoffLocation.lng,
      'miles'
    );

    const durationMinutes = estimateDuration(distanceMiles);

    setRouteInfo({
      distance: distanceMiles,
      duration: durationMinutes,
      distanceText: `${distanceMiles.toFixed(1)} miles`,
      durationText: `${Math.round(durationMinutes)} min`
    });
  };

  useEffect(() => {
    calculateRoute();
  }, [pickupLocation, dropoffLocation]);

  useEffect(() => {
    if (rideId && (rideStatus === 'searching' || rideStatus === 'tracking')) {
      const updateLocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              await supabase
                .from('rides')
                .update({
                  customer_current_lat: latitude,
                  customer_current_lng: longitude,
                  last_location_update: new Date().toISOString()
                })
                .eq('id', rideId);
            },
            (error) => {
              console.error('Error getting location:', error);
            },
            { enableHighAccuracy: true }
          );
        }
      };

      updateLocation();
      const intervalId = setInterval(updateLocation, 5000);

      return () => clearInterval(intervalId);
    }
  }, [rideId, rideStatus]);

  const handleSendInvite = async () => {
    if (!phoneNumber.trim()) return;

    if (invitedPhones.includes(phoneNumber)) {
      alert('This phone number has already been invited!');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('phone', phoneNumber)
      .maybeSingle();

    if (!profile) {
      alert('No Sync member found. Send them the link to sign up at RideSync!');
    } else {
      alert(`Invite sent to ${profile.full_name}!`);
    }

    setInvitedPhones([...invitedPhones, phoneNumber]);
    setPhoneNumber('');
  };

  const handlePayment = async () => {
    setShowPayment(true);
  };

  const handleCompletePayment = () => {
    setPaymentComplete(true);
    setShowPayment(false);
  };

  const handleSyncRide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation || !dropoffLocation) return;

    const geofenceValidation = validateNWAGeofence(
      pickupLocation.lat,
      pickupLocation.lng,
      dropoffLocation.lat,
      dropoffLocation.lng
    );

    if (!geofenceValidation.valid) {
      alert(geofenceValidation.message);
      return;
    }

    if (passengerCount > 1) {
      setShowGroupCreator(true);
    } else {
      handlePayment();
    }
  };

  const handleSyncDriver = async () => {
    if (!pickupLocation || !dropoffLocation) return;

    setLoading(true);

    try {
      console.log('[Customer] Creating ride request...');
      const { data: ride, error } = await supabase.from('rides').insert({
        customer_id: profile?.id,
        pickup_location: pickupLocation.address,
        pickup_lat: pickupLocation.lat,
        pickup_lng: pickupLocation.lng,
        dropoff_location: dropoffLocation.address,
        dropoff_lat: dropoffLocation.lat,
        dropoff_lng: dropoffLocation.lng,
        customer_current_lat: pickupLocation.lat,
        customer_current_lng: pickupLocation.lng,
        customer_photo_url: profile?.profile_photo_url || profile?.avatar_url,
        ride_type: 'standard',
        rate_per_minute: rate,
        status: 'requested',
        tracking_link: `TRACK-${Math.random().toString(36).substring(7).toUpperCase()}`,
        total_amount: estimatedCost || 0
      }).select().single();

      if (error) throw error;

      console.log('[Customer] Ride created:', ride);

      if (ride) {
        await supabase.from('ride_passengers').insert({
          ride_id: ride.id,
          customer_id: profile?.id,
          passenger_count: passengerCount
        });

        await createRideGeofence(
          ride.id,
          pickupLocation.lat,
          pickupLocation.lng,
          500
        );

        if (passengerCount > 1 || groupMembers.length > 1) {
          setRideId(ride.id);
          setShowGroupQR(true);
        } else {
          setRideId(ride.id);
          setRideStatus('searching');
        }
      }
    } catch (error) {
      console.error('Error booking ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverVerified = (driverData: any) => {
    console.log('Driver verified:', driverData);
    alert(`Driver ${driverData.full_name} verified successfully!`);
  };

  const handleGroupCreated = (_groupId: string, members: any[]) => {
    setGroupMembers(members);
    setPassengerCount(members.length);
    setShowGroupCreator(false);
    handlePayment();
  };

  const handleMemberScan = () => {
    setScannedMembers(prev => prev + 1);
  };

  const handleGroupPayment = () => {
    setAllPaid(true);
  };

  const handleAcceptDiscount = async () => {
    if (!discountOffer || !rideId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-ride-coordinator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apply_discount',
          rideId,
          discountedAmount: discountOffer.discountedAmount,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Discount applied! Your new total is $${discountOffer.discountedAmount.toFixed(2)}`);
        setShowDiscountOffer(false);
      }
    } catch (error) {
      console.error('Error applying discount:', error);
    }
  };

  const handleCancelRide = async () => {
    if (!rideId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-ride-coordinator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel_with_refund',
          rideId,
          customerId: profile?.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setShowDiscountOffer(false);
        setRideStatus('booking');
        setRideId(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
    }
  };

  useEffect(() => {
    if (!rideId) return;

    let pollCount = 0;

    const checkAICoordinator = async () => {
      pollCount++;

      // Check for driver assignment
      const { data: ride } = await supabase
        .from('rides')
        .select(`
          *,
          profiles!rides_driver_id_fkey (
            id,
            full_name,
            profile_photo_url,
            avatar_url
          ),
          driver_profiles!rides_driver_id_fkey (
            license_photo_url,
            license_number,
            vehicle_info,
            rating
          )
        `)
        .eq('id', rideId)
        .maybeSingle();

      // Check if ride was cancelled (no drivers)
      if (ride && ride.status === 'cancelled') {
        setAiMessage(ride.cancelled_reason || 'Ride cancelled');
        setRideStatus('booking');
        setLoading(false);
        alert(ride.cancelled_reason || 'Ride has been cancelled');
        return;
      }

      // Check if driver accepted
      if (ride && ride.driver_id && ride.status === 'active') {
        const driverProfile = Array.isArray(ride.profiles) ? (ride.profiles.length > 0 ? ride.profiles[0] : null) : ride.profiles;
        const driverData = ride.driver_profiles ? (Array.isArray(ride.driver_profiles) ? (ride.driver_profiles.length > 0 ? ride.driver_profiles[0] : null) : ride.driver_profiles) : null;

        if (driverProfile && driverData) {
          const vehicleInfo = (driverData.vehicle_info || {}) as any;

          setMatchedDriver({
            id: driverProfile.id,
            full_name: driverProfile.full_name || 'Driver',
            profile_photo_url: driverProfile.profile_photo_url || driverProfile.avatar_url,
            license_photo_url: driverData.license_photo_url || '',
            license_number: driverData.license_number || 'N/A',
            vehicle_make: vehicleInfo?.make || 'N/A',
            vehicle_model: vehicleInfo?.model || 'N/A',
            vehicle_year: vehicleInfo?.year || 2023,
            vehicle_color: vehicleInfo?.color || 'N/A',
            rating: parseFloat(driverData.rating) || 5.0,
          });
          setSuccess(false);
          setRideStatus('tracking');
          setAiMessage('');
        } else if (driverProfile) {
          // Driver profile exists but no driver_profiles data yet
          console.log('Driver profile exists but driver data not loaded yet');
        }
        return;
      }

      // Every 30 seconds (15 polls at 2s each), check with AI coordinator
      if (pollCount % 15 === 0) {
        try {
          // First check if any drivers are active
          const { data: activeDrivers } = await supabase
            .from('driver_profiles')
            .select('id')
            .eq('is_active', true)
            .limit(1);

          if (!activeDrivers || activeDrivers.length === 0) {
            // No drivers available - cancel and refund
            await supabase
              .from('rides')
              .update({
                status: 'cancelled',
                cancelled_reason: 'No drivers available at this time',
                cancelled_at: new Date().toISOString(),
                refund_issued: true,
              })
              .eq('id', rideId);

            setAiMessage('No drivers are currently available. Your ride has been cancelled and you will be refunded.');
            setRideStatus('booking');
            setRideId(null);
            setLoading(false);
            alert('No drivers are currently available. Your ride has been cancelled and you will be refunded.');
            return;
          }

          // Check wait time
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-ride-coordinator`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'check_wait_time',
              rideId,
              customerId: profile?.id,
            }),
          });

          const result = await response.json();
          console.log('[AI Coordinator]', result);

          if (result.action === 'offer_discount') {
            setDiscountOffer(result);
            setShowDiscountOffer(true);
            setWaitTime(result.waitMinutes);
          } else if (result.action === 'continue_waiting') {
            setWaitTime(result.waitMinutes);
          }
        } catch (error) {
          console.error('Error checking with AI coordinator:', error);
        }
      }
    };

    const pollForDriver = setInterval(checkAICoordinator, 2000);
    checkAICoordinator();

    return () => clearInterval(pollForDriver);
  }, [rideId, profile]);

  const handleSyncWithDriver = async () => {
    setShowGroupQR(false);
    setSuccess(true);

    try {
      if (pickupLocation && dropoffLocation && profile) {
        const { data: ride, error } = await supabase
          .from('rides')
          .insert({
            customer_id: profile.id,
            pickup_location: pickupLocation.address,
            pickup_lat: pickupLocation.lat,
            pickup_lng: pickupLocation.lng,
            dropoff_location: dropoffLocation.address,
            dropoff_lat: dropoffLocation.lat,
            dropoff_lng: dropoffLocation.lng,
            status: 'requested',
            ride_type: 'standard',
            rate_per_minute: 0.75,
            is_emergency: false,
            total_amount: estimatedCost || 0
          })
          .select()
          .single();

        if (!error && ride) {
          setRideId(ride.id);
        }
      }
    } catch (error) {
      console.error('Error creating ride:', error);
    }
  };


  const handleTipSubmit = async () => {
    if (tipAmount > 0 && rideId && profile?.id) {
      try {
        const { data: driverProfile } = await supabase
          .from('driver_profiles')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (driverProfile) {
          const { error } = await supabase.from('ride_tips').insert({
            ride_id: rideId,
            customer_id: profile.id,
            driver_id: driverProfile.id,
            amount: tipAmount
          });

          if (error) {
            console.error('Error submitting tip:', error);
          } else {
            console.log('Tip submitted successfully!');
          }
        }
      } catch (error) {
        console.error('Error submitting tip:', error);
      }
    }
    setShowTipModal(false);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    if (rating > 0 && rideId && profile?.id) {
      try {
        const { data: driverProfile } = await supabase
          .from('driver_profiles')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (driverProfile) {
          const { error } = await supabase.from('driver_reviews').insert({
            ride_id: rideId,
            customer_id: profile.id,
            driver_id: driverProfile.id,
            rating: rating,
            review_text: reviewText || null
          });

          if (error) {
            console.error('Error submitting review:', error);
          } else {
            console.log('Review submitted successfully!');
          }

          if (preferDriver) {
            const { error: prefError } = await supabase
              .from('customer_preferences')
              .upsert({
                customer_id: profile.id,
                preferred_driver_id: driverProfile.id,
                updated_at: new Date().toISOString()
              });

            if (prefError) {
              console.error('Error saving preferred driver:', prefError);
            } else {
              console.log('Preferred driver saved successfully!');
            }
          }
        }
      } catch (error) {
        console.error('Error submitting review:', error);
      }
    }
    setShowReviewModal(false);
    setMatchedDriver(null);
    setMatchedStranger(null);
    setStrangerPickupOrder('customer_first');
    setPickupLocation(null);
    setDropoffLocation(null);
    setRouteInfo(null);
    setPassengerCount(1);
    setRideStatus('booking');
    setRating(0);
    setMatchWithStranger(false);
    setIsPreferredDriver(false);
    setDriverLocation(null);
    setDistanceToPickup(0);
    setDriverOnAnotherRide(false);
    setDriverAvailableIn(0);
    setRideId(null);
    setReviewText('');
    setTipAmount(0);
    setScannedMembers(0);
    setAllPaid(false);
    setGroupMembers([]);
  };

  useEffect(() => {
    if (driverOnAnotherRide && driverAvailableIn > 0) {
      const timer = setInterval(() => {
        setDriverAvailableIn(prev => {
          if (prev <= 1) {
            setDriverOnAnotherRide(false);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);

      return () => clearInterval(timer);
    }
  }, [driverOnAnotherRide, driverAvailableIn]);

  useEffect(() => {
    if (rideStatus === 'tracking' && driverLocation && pickupLocation) {
      const interval = setInterval(() => {
        setDriverLocation(prev => {
          if (!prev) return prev;
          const targetLat = pickupLocation.lat;
          const targetLng = pickupLocation.lng;
          const newLat = prev.lat + (targetLat - prev.lat) * 0.1;
          const newLng = prev.lng + (targetLng - prev.lng) * 0.1;
          const distance = calculateDistance(newLat, newLng, targetLat, targetLng, 'miles');
          setDistanceToPickup(distance);

          if (distance < 0.05) {
            clearInterval(interval);
            setTimeout(() => {
              setRideStatus('completed');
              setShowTipModal(true);
            }, 2000);
          }

          return { lat: newLat, lng: newLng, address: prev.address };
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [rideStatus]);

  if (rideStatus === 'searching') {
    return (
      <div className="w-full flex items-center justify-center min-h-96">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Syncing Your Driver...</h2>
          <p className="text-gray-600 mb-4">We're matching you with the best available driver in your area.</p>
          {waitTime > 0 && (
            <p className="text-sm text-gray-500 mb-4">Wait time: {waitTime} minutes</p>
          )}
          {aiMessage && (
            <p className="text-orange-600 font-semibold mb-4">{aiMessage}</p>
          )}
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {showDiscountOffer && discountOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Special Offer!</h3>
              <p className="text-gray-600 mb-6">{discountOffer.message}</p>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Original:</span>
                  <span className="text-gray-500 line-through">${discountOffer.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-semibold">New Price:</span>
                  <span className="text-green-600 font-bold text-xl">${discountOffer.discountedAmount.toFixed(2)}</span>
                </div>
                <div className="text-center mt-2">
                  <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Save ${(discountOffer.originalAmount - discountOffer.discountedAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAcceptDiscount}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Accept Discount
                </button>
                <button
                  onClick={handleCancelRide}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Cancel & Refund
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // "Driver Accepted" state is handled by the tracking view

  if (rideStatus === 'tracking' && matchedDriver) {
    return (
      <div className="w-full">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Your Driver is On The Way!</h2>
            <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700">En Route</span>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <DriverInfoCard driver={matchedDriver} />

            {matchedStranger && strangerPickupOrder && (
              <StrangerInfoCard
                strangerName={matchedStranger.full_name}
                strangerPhotoUrl={matchedStranger.profile_photo_url}
                strangerPickupLocation={matchedStranger.pickup_location}
                strangerDropoffLocation={matchedStranger.dropoff_location}
                pickupOrder={strangerPickupOrder}
                distanceBetweenPickups={matchedStranger.distanceBetweenPickups}
              />
            )}
          </div>

          {driverOnAnotherRide && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-5 mb-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                <h3 className="text-xl font-bold">Driver Currently on Another Sync Ride</h3>
              </div>
              <p className="text-sm text-orange-50 mb-3">
                {matchedDriver.full_name} is completing another ride and will head to your location next.
              </p>
              <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                <p className="text-sm text-orange-50 mb-1">Estimated Available In</p>
                <p className="text-4xl font-bold">{driverAvailableIn} min</p>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Distance to Pickup</p>
                <p className="text-4xl font-bold">{distanceToPickup.toFixed(2)} miles</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Estimated Arrival</p>
                <p className="text-4xl font-bold">{Math.ceil(distanceToPickup * 3)} min</p>
              </div>
            </div>
            <div className="mt-4 bg-blue-400 bg-opacity-30 rounded-lg p-3">
              <p className="text-sm text-center">
                Your ride will cost approximately ${estimatedCost?.toFixed(2)}
              </p>
            </div>
          </div>

          {driverLocation && pickupLocation && (
            <div className="h-96 rounded-2xl overflow-hidden border-4 border-gray-200">
              <MapWithAutocomplete
                onPickupChange={() => {}}
                onDropoffChange={() => {}}
                pickupLocation={pickupLocation}
                dropoffLocation={driverLocation}
                showRoute={true}
              />
            </div>
          )}

          <div className="mt-6 bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-600 mb-2"><strong>Pickup:</strong> {pickupLocation?.address}</p>
            <p className="text-sm text-gray-600"><strong>Dropoff:</strong> {dropoffLocation?.address}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-end gap-3 mb-6">
        <button
          onClick={() => setShowGroupCreator(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg"
        >
          <Users className="w-5 h-5" />
          Create Group
        </button>
        {!isPreferredDriver && (
          <button
            onClick={() => setShowQRScanner(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg"
          >
            <QrCode className="w-5 h-5" />
            Verify Driver
          </button>
        )}
        {isPreferredDriver && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-full px-6 py-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Preferred Driver - No Verification Needed</span>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700">
          Ride synced successfully! A driver will accept your ride shortly.
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Upgrade to Sync Together</h3>
            <p className="text-gray-600 mb-6">
              To sync rides with other passengers and save even more, upgrade to Sync+ or Sync++!
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-4 border-2 border-yellow-400">
                <div className="flex items-center mb-2">
                  <Zap className="w-6 h-6 text-yellow-600 mr-2" />
                  <h4 className="font-bold text-gray-800">Sync+ - $5/month</h4>
                </div>
                <ul className="text-sm text-gray-700 space-y-1 ml-8">
                  <li>• $1.50 platform fee (50% savings)</li>
                  <li>• $0.65/min fare rate (13% savings)</li>
                  <li>• $0.55 per sync ride</li>
                  <li>• Sync rides with other members</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl p-4 border-2 border-slate-400">
                <div className="flex items-center mb-2">
                  <Crown className="w-6 h-6 text-slate-700 mr-2" />
                  <h4 className="font-bold text-gray-800">Sync++ - $10/month</h4>
                </div>
                <ul className="text-sm text-gray-700 space-y-1 ml-8">
                  <li>• NO platform fees (save $3 per ride!)</li>
                  <li>• $0.50/min fare rate (33% savings)</li>
                  <li>• $0.45 per sync ride</li>
                  <li>• Sync rides with other members</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-full font-semibold transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-yellow-600 to-slate-600 hover:from-yellow-700 hover:to-slate-700 text-white py-3 rounded-full font-semibold transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-6 p-4 bg-blue-50 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Rate</p>
                <p className="text-2xl font-bold text-blue-900">${rate.toFixed(2)}/min</p>
                {membershipTier === 'sync_diamond' && (
                  <p className="text-sm font-semibold text-green-600">No platform fees!</p>
                )}
              </div>
              {membershipTier === 'sync_basic' && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Save 33% + waive fees</p>
                  <p className="text-sm font-semibold text-blue-600">from $5/month</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSyncRide} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Passengers
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setPassengerCount(count);
                      if (count > 1) {
                        setMatchWithStranger(false);
                      }
                    }}
                    className={`py-3 rounded-lg font-semibold transition-colors ${
                      passengerCount === count
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="w-5 h-5 mx-auto mb-1" />
                    {count}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                All Sync members can ride together and split costs! Max 4 per car.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-1">Sync Together</h4>
              <p className="text-xs text-gray-600 italic mb-4">
                Ride with others who fit your comfort level and save together
              </p>

              <div className="space-y-3">
                <div className={`p-2 rounded-lg ${passengerCount > 1 ? 'bg-gray-100 opacity-60' : matchWithStranger ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">Rider Gender</span>
                      </div>
                      {passengerCount > 1 && (
                        <p className="text-xs text-gray-500 mt-1">Only available for solo rides</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMatchWithStranger(!matchWithStranger)}
                      disabled={passengerCount > 1}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        passengerCount > 1 ? 'bg-gray-300 cursor-not-allowed' : matchWithStranger ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          matchWithStranger && passengerCount === 1 ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {matchWithStranger && passengerCount === 1 && (
                    <div className="mt-2">
                      <div className="grid grid-cols-3 gap-1 mb-2">
                        {(['any', 'male', 'female'] as const).map((gender) => (
                          <button
                            key={gender}
                            type="button"
                            onClick={() => setPreferredDriverGender(gender)}
                            className={`py-1.5 px-2 rounded text-xs font-semibold transition-colors capitalize ${
                              preferredDriverGender === gender
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            {gender}
                          </button>
                        ))}
                      </div>
                      {strangerSavings > 0 && (
                        <p className="text-xs text-green-700 font-semibold">
                          Save ${strangerSavings.toFixed(2)} (${(regularRate - rate).toFixed(2)}/min savings) when matched!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Driver Gender</p>
                  <div className="grid grid-cols-3 gap-1">
                    {(['any', 'male', 'female'] as const).map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setPreferredDriverGender(gender)}
                        className={`py-1.5 px-2 rounded text-xs font-semibold transition-colors capitalize ${
                          preferredDriverGender === gender
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {routeInfo && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-gray-800 mb-3">Trip Preview</h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Distance</p>
                    <p className="font-bold text-gray-800">{routeInfo.distanceText}</p>
                  </div>

                  <div className="bg-white rounded-xl p-3 text-center">
                    <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="font-bold text-gray-800">{routeInfo.durationText}</p>
                  </div>

                  <div className="bg-white rounded-xl p-3 text-center">
                    <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Est. Cost</p>
                    <p className="font-bold text-green-600">
                      ${estimatedCost?.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 text-xs">
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Your Share ({routeInfo ? (routeInfo.duration / passengerCount).toFixed(1) : '0'} min @ ${rate}/min)</span>
                      <span className="font-semibold">${baseCost?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Platform Fee</span>
                      <span className="font-semibold">
                        {platformFee === 0 ? (
                          <span className="text-green-600">WAIVED!</span>
                        ) : (
                          `$${platformFee.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-900 font-bold border-t pt-2">
                      <span>Your Total</span>
                      <span className="text-green-600">${estimatedCost?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 border-t pt-2">
                      <span>Driver Earnings (100%)</span>
                      <span className="font-semibold text-blue-600">
                        ${baseCost?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 border-t pt-2">
                    <strong>100% to Driver:</strong> Drivers keep the entire ride fare.
                    {membershipTier === 'sync_diamond'
                      ? ' Platform fee waived with Sync Diamond!'
                      : membershipTier !== 'sync_basic'
                      ? ' Upgrade to Sync Diamond to waive platform fees!'
                      : ' Upgrade to save 33% on fares and waive platform fees!'}
                  </p>
                </div>

                {membershipTier !== 'sync_diamond' && routeInfo && (
                  <div className="bg-white rounded-xl p-4 mt-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-center">Compare Membership Prices</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className={`rounded-lg p-3 border-2 ${membershipTier === 'sync_basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                        <p className="text-xs text-gray-600 text-center mb-1">Sync Basic</p>
                        <p className="text-lg font-bold text-gray-800 text-center">
                          ${((routeInfo.duration / passengerCount) * 0.75 + 3.0).toFixed(2)}
                        </p>
                        {membershipTier === 'sync_basic' && (
                          <p className="text-xs text-blue-600 text-center mt-1">Current</p>
                        )}
                      </div>

                      <div className={`rounded-lg p-3 border-2 ${membershipTier === 'sync_gold' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
                        <p className="text-xs text-gray-600 text-center mb-1">Sync Gold</p>
                        <p className="text-lg font-bold text-yellow-700 text-center">
                          ${((routeInfo.duration / passengerCount) * 0.65 + 1.5).toFixed(2)}
                        </p>
                        {membershipTier === 'sync_gold' ? (
                          <p className="text-xs text-yellow-600 text-center mt-1">Current</p>
                        ) : (
                          <>
                            <p className="text-xs text-green-600 text-center mt-1">Save ${(((routeInfo.duration / passengerCount) * 0.75 + 3.0) - ((routeInfo.duration / passengerCount) * 0.65 + 1.5)).toFixed(2)}</p>
                            {membershipTier === 'sync_basic' && (
                              <button
                                type="button"
                                className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1 px-2 rounded font-semibold"
                                onClick={() => alert('Visit Membership tab to upgrade to Sync Gold for $5/month!')}
                              >
                                Upgrade
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <div className="rounded-lg p-3 border-2 border-slate-400 bg-slate-50">
                        <p className="text-xs text-gray-600 text-center mb-1">Sync Diamond</p>
                        <p className="text-lg font-bold text-slate-700 text-center">
                          ${((routeInfo.duration / passengerCount) * 0.55).toFixed(2)}
                        </p>
                        <p className="text-xs text-green-600 text-center mt-1">Save ${(((routeInfo.duration / passengerCount) * 0.75 + 3.0) - ((routeInfo.duration / passengerCount) * 0.55)).toFixed(2)}</p>
                        {membershipTier !== 'sync_diamond' && (
                          <button
                            type="button"
                            className="w-full mt-2 bg-slate-600 hover:bg-slate-700 text-white text-xs py-1 px-2 rounded font-semibold"
                            onClick={() => alert('Visit Membership tab to upgrade to Sync Diamond for $10/month!')}
                          >
                            Upgrade
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Upgrade now to save on this ride and all future rides!
                    </p>
                  </div>
                )}
              </div>
            )}

            {!paymentComplete ? (
              <button
                type="submit"
                disabled={loading || !pickupLocation || !dropoffLocation}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-4 rounded-full font-semibold text-lg transition-colors"
              >
                {hasOnlineDrivers ? 'Sync Ride' : 'No Drivers Available'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSyncDriver}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-full font-semibold text-lg transition-colors"
              >
                {loading ? 'Syncing Driver...' : 'Sync My Driver'}
              </button>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-100 rounded-2xl overflow-hidden" style={{ height: '600px' }}>
            <MapWithAutocomplete
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              onPickupChange={(location) => {
                setPickupLocation(location);
                setPickupInNWA(isPointInNWA(location.lat, location.lng));
              }}
              onDropoffChange={(location) => {
                setDropoffLocation(location);
                setDropoffInNWA(isPointInNWA(location.lat, location.lng));
              }}
            />
          </div>

          <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-300">
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-full p-1.5">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Service Area: NWA Only</p>
              </div>
            </div>
          </div>

          {pickupLocation && !pickupInNWA && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <p className="text-red-800 font-semibold">Pickup location is outside NWA service area</p>
              <p className="text-red-600 text-sm">Please select a pickup location within Northwest Arkansas</p>
            </div>
          )}

          {dropoffLocation && !dropoffInNWA && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <p className="text-red-800 font-semibold">Dropoff location is outside NWA service area</p>
              <p className="text-red-600 text-sm">Please select a dropoff location within Northwest Arkansas</p>
            </div>
          )}

          {matchedStranger && (
            <div className="animate-fade-in">
              <StrangerInfoCard
                strangerName={matchedStranger.full_name}
                strangerPhotoUrl={matchedStranger.profile_photo_url}
                strangerPickupLocation={matchedStranger.pickup_location}
                strangerDropoffLocation={matchedStranger.dropoff_location}
                pickupOrder={strangerPickupOrder}
                distanceBetweenPickups={matchedStranger.distanceBetweenPickups}
              />
            </div>
          )}

          {matchedDriver && (
            <div className="animate-fade-in">
              <DriverInfoCard driver={matchedDriver} />
            </div>
          )}
        </div>
      </div>

      {showQRScanner && (
        <QRScanner
          onClose={() => setShowQRScanner(false)}
          onVerified={handleDriverVerified}
          scannerRole="customer"
        />
      )}

      {showGroupQR && rideId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              {!allPaid ? 'Invite Group Members' : 'Ready to Sync!'}
            </h3>

            {!allPaid ? (
              <>
                <p className="text-gray-600 mb-6 text-center">
                  Enter phone numbers to invite members to your group ride
                </p>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite by Phone Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleSendInvite}
                      disabled={!phoneNumber.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Send Invite
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Member must have an active Sync account
                  </p>

                  {invitedPhones.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Invited Members:</p>
                      <div className="space-y-2">
                        {invitedPhones.map((phone, index) => (
                          <div key={index} className="bg-white rounded-lg p-2 text-sm text-gray-700">
                            {phone}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Group Members</span>
                    <span className="text-sm font-bold text-blue-600">{scannedMembers} / {passengerCount} synced</span>
                  </div>

                  <div className="flex gap-2">
                    {Array.from({ length: passengerCount }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-2 rounded-full ${
                          i < scannedMembers ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleMemberScan}
                    disabled={scannedMembers >= passengerCount}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-full font-semibold transition-colors"
                  >
                    Simulate Member Scan ({scannedMembers}/{passengerCount})
                  </button>
                </div>

                {scannedMembers === passengerCount && (
                  <div className="bg-green-50 rounded-xl p-6 mb-4 border-2 border-green-200 animate-fade-in">
                    <h4 className="font-bold text-green-800 mb-3 text-center">All Members Joined!</h4>
                    <p className="text-sm text-gray-700 mb-4 text-center">
                      Everyone can now pay their share to complete the booking
                    </p>

                    <div className="space-y-2 mb-4">
                      {groupMembers.length > 0 ? (
                        groupMembers.map((member) => {
                          const memberCost = calculateMemberCost(member);
                          return (
                            <div key={member.id} className="bg-white rounded-lg p-3 flex justify-between items-center">
                              <div>
                                <span className="text-sm text-gray-700 font-medium">{member.full_name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({member.membership_tier === 'sync_diamond' ? 'SYNC DIAMOND' : member.membership_tier === 'sync_gold' ? 'SYNC GOLD' : 'SYNC BASIC'})
                                </span>
                              </div>
                              <span className="text-sm font-bold text-green-600">${memberCost.toFixed(2)}</span>
                            </div>
                          );
                        })
                      ) : (
                        Array.from({ length: passengerCount }).map((_, i) => (
                          <div key={i} className="bg-white rounded-lg p-3 flex justify-between items-center">
                            <span className="text-sm text-gray-700">Member {i + 1}</span>
                            <span className="text-sm font-bold text-green-600">${estimatedCost?.toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={handleGroupPayment}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-full font-semibold text-lg transition-colors"
                    >
                      Complete Payment
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>

                <h4 className="font-bold text-gray-800 text-xl mb-2">Payment Complete!</h4>
                <p className="text-gray-600 mb-6">All {passengerCount} members have paid</p>

                <button
                  onClick={handleSyncWithDriver}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-full font-semibold text-lg transition-colors"
                >
                  Sync with My Driver
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowGroupQR(false);
                setScannedMembers(0);
                setAllPaid(false);
                setRideId(null);
              }}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-full font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showGroupCreator && (
        <GroupRideCreator
          onClose={() => setShowGroupCreator(false)}
          onGroupCreated={handleGroupCreated}
          creatorProfile={profile}
        />
      )}

      {showTipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Tip Your Driver</h3>
            <p className="text-gray-600 mb-6">
              {matchedDriver?.full_name} provided great service! Show your appreciation with a tip.
            </p>

            <div className="grid grid-cols-5 gap-3 mb-6">
              {[1, 2, 3, 4, 5].map(amount => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(amount)}
                  className={`py-4 rounded-xl font-bold text-lg transition-all ${
                    tipAmount === amount
                      ? 'bg-green-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Amount</label>
              <input
                type="number"
                value={tipAmount || ''}
                onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter custom amount"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTipAmount(0);
                  setShowTipModal(false);
                  setShowReviewModal(true);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-full font-semibold transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleTipSubmit}
                disabled={tipAmount <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-full font-semibold transition-colors"
              >
                Tip ${tipAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Rate Your Ride</h3>
            <p className="text-gray-600 mb-6">
              How was your experience with {matchedDriver?.full_name}?
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-12 h-12 ${
                      star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Leave a Review (Optional)</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setPreferDriver(!preferDriver)}
                  className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferDriver ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferDriver ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Prefer This Driver</p>
                  <p className="text-xs text-gray-600 mt-1">
                    We'll prioritize matching you with {matchedDriver?.full_name} for future rides when they're online
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRating(0);
                  setReviewText('');
                  setShowReviewModal(false);
                  setMatchedDriver(null);
                  setPickupLocation(null);
                  setDropoffLocation(null);
                  setRouteInfo(null);
                  setPassengerCount(1);
                  setRideStatus('booking');
                  setScannedMembers(0);
                  setAllPaid(false);
                  setRideId(null);
                  setGroupMembers([]);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-full font-semibold transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={rating === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-full font-semibold transition-colors"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && estimatedCost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Payment</h3>
            <p className="text-gray-600 mb-6">
              Complete your payment to book this ride
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700">Ride Cost</span>
                <span className="font-bold text-gray-900">${baseCost?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700">Platform Fee</span>
                <span className="font-bold text-gray-900">
                  {platformFee === 0 ? (
                    <span className="text-green-600">WAIVED!</span>
                  ) : (
                    `$${platformFee.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-green-600">${estimatedCost?.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-full font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompletePayment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition-colors"
              >
                Pay ${estimatedCost?.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
