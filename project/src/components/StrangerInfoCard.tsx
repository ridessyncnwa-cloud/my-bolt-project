import { User, MapPin, Navigation, CheckCircle } from 'lucide-react';

interface StrangerInfoCardProps {
  strangerName: string;
  strangerPhotoUrl?: string;
  strangerPickupLocation: string;
  strangerDropoffLocation: string;
  pickupOrder: 'customer_first' | 'stranger_first';
  distanceBetweenPickups: number;
  isVerified?: boolean;
}

export function StrangerInfoCard({
  strangerName,
  strangerPhotoUrl,
  strangerPickupLocation,
  strangerDropoffLocation,
  pickupOrder,
  distanceBetweenPickups,
  isVerified = true
}: StrangerInfoCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-300 shadow-lg">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative">
          {strangerPhotoUrl ? (
            <img
              src={strangerPhotoUrl}
              alt={strangerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-800">Matched Rider</h3>
            {isVerified && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                Verified
              </span>
            )}
          </div>
          <p className="text-lg font-semibold text-purple-700">{strangerName}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-semibold text-gray-600">Pickup Order</p>
          </div>
          <p className="text-sm font-medium text-gray-800">
            {pickupOrder === 'customer_first' ? 'You will be picked up first' : 'They will be picked up first'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {distanceBetweenPickups.toFixed(1)} miles between pickups
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600 mb-1">Their Pickup</p>
              <p className="text-sm text-gray-800 truncate">{strangerPickupLocation}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600 mb-1">Their Dropoff</p>
              <p className="text-sm text-gray-800 truncate">{strangerDropoffLocation}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-blue-100 border border-blue-300 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          <span className="font-semibold">Shared Ride:</span> Driver will optimize the route for both pickups and dropoffs.
        </p>
      </div>
    </div>
  );
}
