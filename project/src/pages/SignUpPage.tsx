import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Car, Mail, Lock, User, Eye, EyeOff, AlertCircle, Gift, Camera, CheckCircle } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<Blob | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<Blob | null>(null);
  const [showProfileCamera, setShowProfileCamera] = useState(false);
  const [showLicenseCamera, setShowLicenseCamera] = useState(false);
  const [signupStep, setSignupStep] = useState(1);

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
    }
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setSignupStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profilePhoto) {
      setError('Please take a profile photo');
      return;
    }

    if (!licensePhoto) {
      setError('Please take a photo of your license');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signupError) throw signupError;
      if (!authData.user) throw new Error('No user returned from signup');

      if (authData.session === null) {
        setError('Please check your email to confirm your account, then log in.');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      await new Promise(resolve => setTimeout(resolve, 1000));

      const profilePhotoExt = 'jpg';
      const licensePhotoExt = 'jpg';
      const profilePhotoPath = `${userId}/profile.${profilePhotoExt}`;
      const licensePhotoPath = `${userId}/license.${licensePhotoExt}`;

      const { error: profileUploadError } = await supabase.storage
        .from('profile-photos')
        .upload(profilePhotoPath, profilePhoto, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (profileUploadError) throw profileUploadError;

      const { error: licenseUploadError } = await supabase.storage
        .from('license-photos')
        .upload(licensePhotoPath, licensePhoto, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (licenseUploadError) throw licenseUploadError;

      const { data: { publicUrl: profileUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(profilePhotoPath);

      const { data: { publicUrl: licenseUrl } } = supabase.storage
        .from('license-photos')
        .getPublicUrl(licensePhotoPath);

      let referrerId = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode.toUpperCase())
          .maybeSingle();

        if (referrer) {
          referrerId = referrer.id;
        }
      }

      const updateData: any = {
        full_name: fullName,
        profile_photo_url: profileUrl,
        license_photo_url: licenseUrl,
      };

      if (referrerId) {
        updateData.referred_by = referrerId;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (profileError) throw profileError;

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during signup');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 relative overflow-hidden">
      {/* Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <div className="text-9xl font-bold text-gray-400 transform rotate-12">
          RideSync
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-white rounded-full p-2 sm:p-3 shadow-lg">
                <Car className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Join RideSync Today
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {signupStep === 1 ? 'Create your account and start your premium transportation journey' : 'Complete your profile with photos'}
            </p>
            <div className="flex justify-center space-x-2 mt-4">
              <div className={`h-2 w-16 rounded-full transition-colors ${signupStep === 1 ? 'bg-blue-600' : 'bg-green-600'}`}></div>
              <div className={`h-2 w-16 rounded-full transition-colors ${signupStep === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
          </div>

          {/* Sign Up Form */}
          <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}

            {signupStep === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4 sm:space-y-5">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none relative block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full pl-9 sm:pl-10 pr-11 sm:pr-12 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none relative block w-full pl-9 sm:pl-10 pr-11 sm:pr-12 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Referral Code Field */}
              <div>
                <label htmlFor="referralCode" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="appearance-none relative block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter referral code for bonus"
                    readOnly={searchParams.get('ref') !== null}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Have a friend's referral code? Enter it to get started with bonus credits!
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 sm:mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-600">
                  I accept the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-800">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-800">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-white bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Continue to Photos'
                  )}
                </button>
              </div>
            </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-3">
                  Profile Photo *
                </label>
                <button
                  type="button"
                  onClick={() => setShowProfileCamera(true)}
                  className={`w-full flex items-center justify-center space-x-3 py-4 px-4 border-2 border-dashed rounded-xl transition-all ${
                    profilePhoto
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-blue-500 bg-gray-50'
                  }`}
                >
                  {profilePhoto ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="font-medium text-green-700">Photo Captured</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-gray-400" />
                      <span className="text-gray-600">Take Profile Photo</span>
                    </>
                  )}
                </button>
              </div>

              {/* License Photo */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-3">
                  Driver's License Photo *
                </label>
                <button
                  type="button"
                  onClick={() => setShowLicenseCamera(true)}
                  className={`w-full flex items-center justify-center space-x-3 py-4 px-4 border-2 border-dashed rounded-xl transition-all ${
                    licensePhoto
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-blue-500 bg-gray-50'
                  }`}
                >
                  {licensePhoto ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="font-medium text-green-700">License Captured</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-gray-400" />
                      <span className="text-gray-600">Take License Photo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 border border-transparent text-white bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      const { error } = await signUp(email, password, fullName, referralCode);
                      if (error) throw error;
                      navigate('/dashboard');
                    } catch (error: any) {
                      console.error('Signup error:', error);
                      setError(error.message || 'An error occurred during signup');
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-2 px-4 text-xs text-gray-500 hover:text-gray-700 transition-all disabled:opacity-50"
                >
                  Skip Photos (Testing Only)
                </button>
              </div>
            </form>
            )}

            {/* Footer Links */}
            <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
              <div className="border-t border-gray-200 pt-4 sm:pt-6 text-center">
                <p className="text-xs sm:text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    Sign in to RideSync
                  </Link>
                </p>
              </div>

              <div className="text-center">
                <Link
                  to="/"
                  className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>

          {/* Patriotic Footer Message */}
          <div className="text-center mt-6 sm:mt-8">
            <p className="text-xs sm:text-sm text-gray-500">
              Join the RideSync community - Proudly American, Globally Inspired
            </p>
          </div>
        </div>
      </div>

      {/* Camera Modals */}
      {showProfileCamera && (
        <CameraCapture
          title="Take Your Profile Photo"
          instructions="Position your face in the center and capture a clear photo"
          onCapture={(blob) => {
            setProfilePhoto(blob);
            setShowProfileCamera(false);
          }}
          onClose={() => setShowProfileCamera(false)}
        />
      )}

      {showLicenseCamera && (
        <CameraCapture
          title="Capture Your Driver's License"
          instructions="Make sure all information on your license is clearly visible"
          onCapture={(blob) => {
            setLicensePhoto(blob);
            setShowLicenseCamera(false);
          }}
          onClose={() => setShowLicenseCamera(false)}
        />
      )}
    </div>
  );
}