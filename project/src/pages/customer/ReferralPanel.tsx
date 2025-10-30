import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Copy, Users, Award, Share2, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

type ReferralBonus = {
  id: string;
  referred_id: string;
  bonus_amount: number;
  status: string;
  created_at: string;
};

export function ReferralPanel() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [bonuses, setBonuses] = useState<ReferralBonus[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    loadReferrals();
  }, [profile]);

  const loadReferrals = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('referral_bonuses')
      .select('*')
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setBonuses(data);
      const total = data
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + b.bonus_amount, 0);
      setTotalEarned(total);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getReferralUrl = () => {
    return `${window.location.origin}/signup?ref=${profile?.referral_code}`;
  };

  const shareFacebook = () => {
    if (profile?.membership_tier === 'sync_basic') {
      alert('Facebook sharing is available for Sync Gold and Sync Diamond members only. Upgrade to unlock this feature!');
      return;
    }
    const url = getReferralUrl();
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbShareUrl, '_blank', 'width=600,height=400');
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ridesync-referral-${profile?.referral_code}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-8 mb-6">
        <h3 className="text-2xl font-bold mb-4">Earn $5 Per Referral</h3>
        <p className="text-blue-100 mb-6">
          Share your code with friends. When they take their first ride, you automatically receive $5!
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-100 mb-2">Your Referral Code</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold tracking-wider">{profile?.referral_code}</p>
                <button
                  onClick={copyReferralCode}
                  className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <Users className="w-8 h-8 mb-2" />
                <p className="text-2xl font-bold">{bonuses.length}</p>
                <p className="text-sm text-blue-100">Total Referrals</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <Award className="w-8 h-8 mb-2" />
                <p className="text-2xl font-bold">${totalEarned.toFixed(2)}</p>
                <p className="text-sm text-blue-100">Total Earned</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center">
            <h4 className="text-gray-800 font-bold mb-3">Share Your QR Code</h4>
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <QRCodeCanvas
                id="qr-canvas"
                value={getReferralUrl()}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">Scan to join RideSync with your referral code</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={shareFacebook}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                  profile?.membership_tier === 'sync_basic'
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>{profile?.membership_tier === 'sync_basic' ? '🔒 Share on Facebook' : 'Share on Facebook'}</span>
              </button>
              <button
                onClick={downloadQR}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
            {profile?.membership_tier === 'sync_basic' && (
              <p className="text-xs text-gray-600 mt-2">
                Upgrade to Sync Gold or Sync Diamond to unlock Facebook sharing!
              </p>
            )}
          </div>
        </div>
      </div>

      {bonuses.length > 0 ? (
        <div>
          <h4 className="font-bold text-gray-800 mb-4">Referral History</h4>
          <div className="space-y-3">
            {bonuses.map((bonus) => (
              <div key={bonus.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Referral Bonus</p>
                  <p className="text-sm text-gray-600">{new Date(bonus.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">+${bonus.bonus_amount.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    bonus.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {bonus.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-2xl">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No referrals yet. Start sharing your code!</p>
        </div>
      )}
    </div>
  );
}
