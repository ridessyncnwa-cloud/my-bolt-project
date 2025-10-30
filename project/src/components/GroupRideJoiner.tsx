import { useState } from 'react';
import { X, Scan, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GroupRideJoinerProps {
  onClose: () => void;
  onJoined: (groupId: string) => void;
  userProfile: any;
}

export default function GroupRideJoiner({ onClose, onJoined, userProfile }: GroupRideJoinerProps) {
  const [tagCode, setTagCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const joinGroup = async () => {
    if (!tagCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data: tag, error: tagError } = await supabase
        .from('group_ride_tags')
        .select('*, group_ride_members(*)')
        .eq('tag_code', tagCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (tagError || !tag) {
        setError('Invalid or expired group code');
        setLoading(false);
        return;
      }

      if (new Date(tag.expires_at) < new Date()) {
        setError('This group code has expired');
        setLoading(false);
        return;
      }

      const existingMember = tag.group_ride_members.find(
        (m: any) => m.user_id === userProfile.id
      );

      if (existingMember) {
        setError('You have already joined this group');
        setLoading(false);
        return;
      }

      if (tag.group_ride_members.length >= tag.max_riders) {
        setError('This group is full');
        setLoading(false);
        return;
      }

      const { error: joinError } = await supabase.from('group_ride_members').insert({
        tag_id: tag.id,
        user_id: userProfile.id,
        status: 'waiting',
      });

      if (joinError) throw joinError;

      onJoined(tag.tag_code);
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Scan className="w-6 h-6" />
              Join Group Ride
            </h2>
            <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-purple-100">Enter the group code to join</p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Code
            </label>
            <input
              type="text"
              value={tagCode}
              onChange={(e) => setTagCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-bold tracking-wider uppercase"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={joinGroup}
              disabled={loading || tagCode.length !== 6}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
