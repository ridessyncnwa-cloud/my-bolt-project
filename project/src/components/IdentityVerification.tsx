import { useState } from 'react';
import { X, CheckCircle, XCircle, User, CreditCard, AlertTriangle } from 'lucide-react';

interface IdentityData {
  full_name: string;
  photo_url?: string;
  license_photo_url?: string;
  license_number?: string;
  customer_qr_code?: string;
  role: 'customer' | 'driver';
  membership_tier?: string;
}

interface IdentityVerificationProps {
  identityData: IdentityData;
  onConfirm: () => void;
  onReject: () => void;
  onClose: () => void;
  verifierRole: 'driver' | 'customer';
}

export function IdentityVerification({
  identityData,
  onConfirm,
  onReject,
  onClose
}: IdentityVerificationProps) {
  const [showLicenseExpanded, setShowLicenseExpanded] = useState(false);
  const isVerifyingCustomer = identityData.role === 'customer';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Verify Identity</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-white/90 mt-2">
            {isVerifyingCustomer
              ? 'Verify this person matches the photo and information below'
              : 'Verify the driver matches their license and photo'}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-600 to-blue-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {identityData.photo_url ? (
                <img
                  src={identityData.photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">{identityData.full_name}</h3>
            <div className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-medium">
              {identityData.role === 'driver' ? 'RideSync Driver' : 'RideSync Customer'}
            </div>
          </div>

          {isVerifyingCustomer && identityData.customer_qr_code && (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-800">RideSync ID</span>
              </div>
              <p className="text-xl font-mono text-gray-900 tracking-wider">
                {identityData.customer_qr_code}
              </p>
              {identityData.membership_tier && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Membership: </span>
                  {identityData.membership_tier === 'sync_plus_plus'
                    ? 'Sync++'
                    : identityData.membership_tier === 'sync_plus'
                    ? 'Sync+'
                    : 'Sync'}
                </div>
              )}
            </div>
          )}

          {!isVerifyingCustomer && identityData.license_number && (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-800">License Number</span>
              </div>
              <p className="text-xl font-mono text-gray-900 tracking-wider">
                {identityData.license_number}
              </p>
            </div>
          )}

          {!isVerifyingCustomer && identityData.license_photo_url && (
            <div className="space-y-3">
              <button
                onClick={() => setShowLicenseExpanded(!showLicenseExpanded)}
                className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl p-4 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900">
                    {showLicenseExpanded ? 'Hide License Photo' : 'View License Photo'}
                  </span>
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
              </button>

              {showLicenseExpanded && (
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={identityData.license_photo_url}
                    alt="Driver's License"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          )}

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-semibold mb-1">Safety Reminder</p>
              <p>
                Only confirm if the person in front of you matches the photo and information
                shown. If something doesn't match, reject the verification.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onReject}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold transition-colors shadow-lg"
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold transition-colors shadow-lg"
            >
              <CheckCircle className="w-5 h-5" />
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
