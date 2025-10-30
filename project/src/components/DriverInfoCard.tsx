import { User, CreditCard, Star } from 'lucide-react';

interface DriverInfo {
  id: string;
  full_name: string;
  profile_photo_url?: string;
  license_photo_url?: string;
  license_number?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  rating?: number;
}

interface DriverInfoCardProps {
  driver: DriverInfo;
}

export default function DriverInfoCard({ driver }: DriverInfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <User className="w-5 h-5" />
        Your Driver
      </h3>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {driver.profile_photo_url ? (
              <img
                src={driver.profile_photo_url}
                alt={driver.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-gray-900">{driver.full_name}</h4>
            {driver.rating && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium text-gray-700">{driver.rating.toFixed(1)}</span>
              </div>
            )}
            {driver.license_number && (
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <CreditCard className="w-4 h-4" />
                License: {driver.license_number}
              </p>
            )}
          </div>
        </div>

        {(driver.vehicle_make || driver.vehicle_model) && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700">Vehicle</p>
            <p className="text-gray-900">
              {driver.vehicle_year && `${driver.vehicle_year} `}
              {driver.vehicle_color && `${driver.vehicle_color} `}
              {driver.vehicle_make} {driver.vehicle_model}
            </p>
          </div>
        )}

        {driver.license_photo_url && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Driver's License</p>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <img
                src={driver.license_photo_url}
                alt={`${driver.full_name}'s license`}
                className="w-full h-40 object-contain bg-gray-50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
