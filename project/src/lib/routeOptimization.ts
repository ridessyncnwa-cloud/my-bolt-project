import { supabase } from './supabase';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Ride {
  id: string;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_location: string;
  dropoff_lat: number;
  dropoff_lng: number;
  customer_id: string;
  status: string;
  created_at: string;
}

export interface RouteSegment {
  from: Location;
  to: Location;
  distance: number;
  duration: number;
}

export interface OptimizedRoute {
  rides: Ride[];
  totalDistance: number;
  totalDuration: number;
  segments: RouteSegment[];
  efficiency: number;
}

const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_MILES = 3958.8;

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  unit: 'km' | 'miles' = 'miles'
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const radius = unit === 'km' ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;

  return radius * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function estimateDuration(distanceMiles: number, considerTraffic: boolean = true): number {
  const currentHour = new Date().getHours();
  let avgSpeedMph = 30;

  if (considerTraffic) {
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19)) {
      avgSpeedMph = 18;
    } else if (currentHour >= 22 || currentHour <= 5) {
      avgSpeedMph = 40;
    } else {
      avgSpeedMph = 28;
    }
  }

  return (distanceMiles / avgSpeedMph) * 60;
}

export function findNearestRide(
  currentLat: number,
  currentLng: number,
  availableRides: Ride[]
): Ride | null {
  if (availableRides.length === 0) return null;

  let nearestRide = availableRides[0];
  let minDistance = calculateDistance(
    currentLat,
    currentLng,
    nearestRide.pickup_lat,
    Number(nearestRide.pickup_lng)
  );

  for (let i = 1; i < availableRides.length; i++) {
    const ride = availableRides[i];
    const distance = calculateDistance(
      currentLat,
      currentLng,
      Number(ride.pickup_lat),
      Number(ride.pickup_lng)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestRide = ride;
    }
  }

  return nearestRide;
}

export function optimizeRouteForDriver(
  driverLat: number,
  driverLng: number,
  availableRides: Ride[]
): OptimizedRoute | null {
  if (availableRides.length === 0) return null;

  const orderedRides: Ride[] = [];
  const remainingRides = [...availableRides];
  let currentLat = driverLat;
  let currentLng = driverLng;
  let totalDistance = 0;
  let totalDuration = 0;
  const segments: RouteSegment[] = [];

  while (remainingRides.length > 0) {
    const nearestRide = findNearestRide(currentLat, currentLng, remainingRides);
    if (!nearestRide) break;

    const pickupDistance = calculateDistance(
      currentLat,
      currentLng,
      Number(nearestRide.pickup_lat),
      Number(nearestRide.pickup_lng)
    );

    segments.push({
      from: { lat: currentLat, lng: currentLng, address: 'Current Location' },
      to: {
        lat: Number(nearestRide.pickup_lat),
        lng: Number(nearestRide.pickup_lng),
        address: nearestRide.pickup_location,
      },
      distance: pickupDistance,
      duration: estimateDuration(pickupDistance),
    });

    const rideDistance = calculateDistance(
      Number(nearestRide.pickup_lat),
      Number(nearestRide.pickup_lng),
      Number(nearestRide.dropoff_lat),
      Number(nearestRide.dropoff_lng)
    );

    segments.push({
      from: {
        lat: Number(nearestRide.pickup_lat),
        lng: Number(nearestRide.pickup_lng),
        address: nearestRide.pickup_location,
      },
      to: {
        lat: Number(nearestRide.dropoff_lat),
        lng: Number(nearestRide.dropoff_lng),
        address: nearestRide.dropoff_location,
      },
      distance: rideDistance,
      duration: estimateDuration(rideDistance),
    });

    totalDistance += pickupDistance + rideDistance;
    totalDuration += estimateDuration(pickupDistance) + estimateDuration(rideDistance);

    currentLat = Number(nearestRide.dropoff_lat);
    currentLng = Number(nearestRide.dropoff_lng);

    orderedRides.push(nearestRide);
    remainingRides.splice(remainingRides.indexOf(nearestRide), 1);
  }

  const directDistance = availableRides.reduce((sum, ride) => {
    return (
      sum +
      calculateDistance(
        driverLat,
        driverLng,
        Number(ride.pickup_lat),
        Number(ride.pickup_lng)
      ) +
      calculateDistance(
        Number(ride.pickup_lat),
        Number(ride.pickup_lng),
        Number(ride.dropoff_lat),
        Number(ride.dropoff_lng)
      )
    );
  }, 0);

  const efficiency = directDistance > 0 ? (directDistance / totalDistance) * 100 : 100;

  return {
    rides: orderedRides,
    totalDistance,
    totalDuration,
    segments,
    efficiency,
  };
}

export async function getOptimalRideForDriver(
  _driverId: string,
  driverLat: number,
  driverLng: number,
  maxDistanceMiles: number = 10
): Promise<Ride | null> {
  const { data: rides, error } = await supabase
    .from('rides')
    .select('*')
    .eq('status', 'requested')
    .is('driver_id', null);

  if (error || !rides || rides.length === 0) {
    return null;
  }

  const nearbyRides = rides.filter((ride) => {
    const distance = calculateDistance(
      driverLat,
      driverLng,
      Number(ride.pickup_lat),
      Number(ride.pickup_lng)
    );
    return distance <= maxDistanceMiles;
  });

  if (nearbyRides.length === 0) return null;

  nearbyRides.sort((a, b) => {
    const distA = calculateDistance(
      driverLat,
      driverLng,
      Number(a.pickup_lat),
      Number(a.pickup_lng)
    );
    const distB = calculateDistance(
      driverLat,
      driverLng,
      Number(b.pickup_lat),
      Number(b.pickup_lng)
    );
    return distA - distB;
  });

  return nearbyRides[0];
}

export function calculateFairPrice(
  _distanceMiles: number,
  durationMinutes: number,
  ratePerMinute: number,
  isMember: boolean = false
): {
  basePrice: number;
  memberDiscount: number;
  platformFee: number;
  finalPrice: number;
  estimatedDriverEarnings: number;
} {
  const basePrice = durationMinutes * ratePerMinute;
  const memberDiscount = isMember ? basePrice * 0.13 : 0;
  const platformFee = isMember ? 1.50 : 3.00;
  const finalPrice = basePrice - memberDiscount + platformFee;

  const estimatedDriverEarnings = basePrice - memberDiscount;

  return {
    basePrice,
    memberDiscount,
    platformFee,
    finalPrice,
    estimatedDriverEarnings,
  };
}

export async function matchDriverWithOptimalRide(
  driverId: string,
  driverLat: number,
  driverLng: number
): Promise<{ ride: Ride; distance: number; duration: number } | null> {
  const optimalRide = await getOptimalRideForDriver(driverId, driverLat, driverLng);

  if (!optimalRide) return null;

  const distance = calculateDistance(
    driverLat,
    driverLng,
    Number(optimalRide.pickup_lat),
    Number(optimalRide.pickup_lng)
  );

  const duration = estimateDuration(distance);

  return {
    ride: optimalRide,
    distance,
    duration,
  };
}

export interface StrangerMatchRoute {
  pickupOrder: 'customer_first' | 'stranger_first';
  totalDistance: number;
  totalDuration: number;
  customerPickupToStrangerPickup: number;
  isRouteEfficient: boolean;
  segments: {
    driverToFirstPickup: number;
    firstPickupToSecondPickup: number;
    secondPickupToFirstDropoff: number;
    firstDropoffToSecondDropoff: number;
  };
}

export function optimizeStrangerMatchRoute(
  driverLat: number,
  driverLng: number,
  customer1PickupLat: number,
  customer1PickupLng: number,
  customer1DropoffLat: number,
  customer1DropoffLng: number,
  customer2PickupLat: number,
  customer2PickupLng: number,
  customer2DropoffLat: number,
  customer2DropoffLng: number
): StrangerMatchRoute {
  const distDriverToC1 = calculateDistance(driverLat, driverLng, customer1PickupLat, customer1PickupLng);
  const distDriverToC2 = calculateDistance(driverLat, driverLng, customer2PickupLat, customer2PickupLng);

  const distC1ToC2 = calculateDistance(customer1PickupLat, customer1PickupLng, customer2PickupLat, customer2PickupLng);
  const distC2ToC1 = distC1ToC2;

  const distC1DropToC2Drop = calculateDistance(customer1DropoffLat, customer1DropoffLng, customer2DropoffLat, customer2DropoffLng);
  const distC2DropToC1Drop = distC1DropToC2Drop;

  const route1TotalDist = distDriverToC1 + distC1ToC2 +
    calculateDistance(customer2PickupLat, customer2PickupLng, customer1DropoffLat, customer1DropoffLng) +
    distC1DropToC2Drop;

  const route2TotalDist = distDriverToC2 + distC2ToC1 +
    calculateDistance(customer1PickupLat, customer1PickupLng, customer2DropoffLat, customer2DropoffLng) +
    distC2DropToC1Drop;

  const pickupOrder: 'customer_first' | 'stranger_first' = route1TotalDist <= route2TotalDist ? 'customer_first' : 'stranger_first';
  const totalDistance = Math.min(route1TotalDist, route2TotalDist);
  const totalDuration = estimateDuration(totalDistance);

  const maxReasonableDetour = 2.0;
  const isRouteEfficient = distC1ToC2 <= maxReasonableDetour;

  return {
    pickupOrder,
    totalDistance,
    totalDuration,
    customerPickupToStrangerPickup: distC1ToC2,
    isRouteEfficient,
    segments: pickupOrder === 'customer_first' ? {
      driverToFirstPickup: distDriverToC1,
      firstPickupToSecondPickup: distC1ToC2,
      secondPickupToFirstDropoff: calculateDistance(customer2PickupLat, customer2PickupLng, customer1DropoffLat, customer1DropoffLng),
      firstDropoffToSecondDropoff: distC1DropToC2Drop
    } : {
      driverToFirstPickup: distDriverToC2,
      firstPickupToSecondPickup: distC2ToC1,
      secondPickupToFirstDropoff: calculateDistance(customer1PickupLat, customer1PickupLng, customer2DropoffLat, customer2DropoffLng),
      firstDropoffToSecondDropoff: distC2DropToC1Drop
    }
  };
}
