import { User, CreditCard, CheckCircle } from 'lucide-react';

interface RiderInfo {
  id: string;
  full_name: string;
  profile_photo_url?: string;
  license_photo_url?: string;
  license_number?: string;
  is_verified?: boolean;
}

interface RiderInfoCardProps {
  riders: RiderInfo[];
}

export default function RiderInfoCard({ riders }: RiderInfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <User className="w-5 h-5" />
        Rider Information ({riders.length})
      </h3>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {riders.map((rider) => (
          <div key={rider.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                {rider.profile_photo_url ? (
                  <img
                    src={rider.profile_photo_url}
                    alt={rider.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
                {(rider.is_verified !== false && rider.license_number) && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">{rider.full_name}</h4>
                  {(rider.is_verified !== false && rider.license_number) && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                      Verified
                    </span>
                  )}
                </div>
                {rider.license_number && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    License: {rider.license_number}
                  </p>
                )}
              </div>
            </div>

            {rider.license_photo_url && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Driver's License</p>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <img
                    src={rider.license_photo_url}
                    alt={`${rider.full_name}'s license`}
                    className="w-full h-32 object-contain bg-gray-50"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
