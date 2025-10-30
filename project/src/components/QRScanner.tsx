import { useState } from 'react';
import { X, QrCode, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { IdentityVerification } from './IdentityVerification';

interface QRScannerProps {
  onClose: () => void;
  onVerified: (userData: any) => void;
  scannerRole: 'driver' | 'customer';
}

export function QRScanner({ onClose, onVerified, scannerRole }: QRScannerProps) {
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identityData, setIdentityData] = useState<any>(null);

  const handleScan = async () => {
    if (!qrInput.trim()) {
      setError('Please enter a QR code or ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (scannerRole === 'driver') {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, customer_qr_code, role, membership_tier')
          .eq('customer_qr_code', qrInput.trim())
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Customer not found. Please check the QR code.');
          setLoading(false);
          return;
        }

        setIdentityData({
          id: data.id,
          full_name: data.full_name,
          photo_url: data.avatar_url || '',
          customer_qr_code: data.customer_qr_code,
          membership_tier: data.membership_tier,
          role: 'customer' as const
        });
      } else {
        const { data: driverProfile, error: fetchError } = await supabase
          .from('driver_profiles')
          .select(`
            id,
            qr_code,
            license_number,
            license_photo_url,
            photo_url,
            user_id,
            profiles!driver_profiles_user_id_fkey(
              full_name,
              role
            )
          `)
          .eq('qr_code', qrInput.trim())
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!driverProfile) {
          setError('Driver not found. Please check the QR code.');
          setLoading(false);
          return;
        }

        setIdentityData({
          id: driverProfile.user_id,
          full_name: (driverProfile.profiles as any)?.full_name || 'Unknown Driver',
          photo_url: driverProfile.photo_url,
          license_photo_url: driverProfile.license_photo_url,
          license_number: driverProfile.license_number,
          role: 'driver'
        });
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error scanning QR code:', err);
      setError('Failed to verify identity. Please try again.');
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onVerified(identityData);
    onClose();
  };

  const handleReject = () => {
    setIdentityData(null);
    setQrInput('');
    setError('Identity verification rejected. Please try again or contact support.');
  };

  if (identityData) {
    return (
      <IdentityVerification
        identityData={identityData}
        onConfirm={handleConfirm}
        onReject={handleReject}
        onClose={onClose}
        verifierRole={scannerRole}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Scan QR Code</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-white/90 mt-2">
            {scannerRole === 'driver'
              ? 'Scan the customer\'s QR code to verify their identity'
              : 'Scan the driver\'s QR code to verify their identity'}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="inline-block bg-gradient-to-br from-red-600 to-blue-600 rounded-2xl p-8 mb-4">
              <QrCode className="w-24 h-24 text-white" />
            </div>
            <p className="text-gray-600 text-sm">
              Enter the {scannerRole === 'driver' ? 'customer' : 'driver'} QR code or ID below
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code / ID
              </label>
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                placeholder="Enter code here..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Verify Identity
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-sm text-blue-900">
            <p className="font-semibold mb-2">How to scan:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Ask the {scannerRole === 'driver' ? 'customer' : 'driver'} to show their QR code</li>
              <li>Enter the code displayed below their QR code</li>
              <li>Verify that the photo matches the person</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
