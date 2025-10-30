import { useState } from 'react';
import { Users, X, Send, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GroupRideMember {
  id: string;
  full_name: string;
  membership_tier: string;
  phone: string;
}

interface GroupRideCreatorProps {
  onClose: () => void;
  onGroupCreated: (groupId: string, members: GroupRideMember[]) => void;
  creatorProfile: any;
}

export default function GroupRideCreator({ onClose, onGroupCreated, creatorProfile }: GroupRideCreatorProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [invitedMembers, setInvitedMembers] = useState<GroupRideMember[]>([]);
  const [loading, setLoading] = useState(false);

  const sendSMSInvite = async () => {
    if (!phoneNumber.trim()) return;

    try {
      setLoading(true);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, membership_tier, phone')
        .eq('phone', phoneNumber)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        alert('No Sync member found with this phone number. They need to sign up first!');
        return;
      }

      if (invitedMembers.some(m => m.phone === phoneNumber)) {
        alert('This member has already been invited!');
        return;
      }

      setInvitedMembers([...invitedMembers, profile as GroupRideMember]);
      alert(`Invite sent to ${profile.full_name}! They will be notified in the app.`);
      setPhoneNumber('');
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = (phone: string) => {
    setInvitedMembers(invitedMembers.filter((m) => m.phone !== phone));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (invitedMembers.length === 0) {
      alert('Please invite at least one member to create a group ride');
      return;
    }

    try {
      const tagCode = generateTagCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      const allMembers: GroupRideMember[] = [
        {
          id: creatorProfile.id,
          full_name: creatorProfile.full_name,
          membership_tier: creatorProfile.membership_tier,
          phone: creatorProfile.phone || '',
        },
        ...invitedMembers,
      ];

      const { data: tag, error: tagError } = await supabase
        .from('group_ride_tags')
        .insert({
          tag_code: tagCode,
          created_by: creatorProfile.id,
          max_riders: allMembers.length,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (tagError) throw tagError;

      for (const member of allMembers) {
        await supabase.from('group_ride_members').insert({
          tag_id: tag.id,
          user_id: member.id,
          status: 'invited',
        });
      }

      onGroupCreated(tagCode, allMembers);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group ride');
    }
  };

  const generateTagCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const totalMembers = invitedMembers.length + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Create Group Ride
            </h2>
            <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-blue-100">Invite members via SMS to join your group ride</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
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
                onClick={sendSMSInvite}
                disabled={loading || !phoneNumber.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Sending...' : 'Invite'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Member must have an active Sync account
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-3">
              Group Members ({totalMembers})
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900">{creatorProfile.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {creatorProfile.membership_tier === 'sync_diamond'
                      ? 'SYNC DIAMOND'
                      : creatorProfile.membership_tier === 'sync_gold'
                      ? 'SYNC GOLD'
                      : 'SYNC BASIC'} (Host)
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-600" />
              </div>

              {invitedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900">{member.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {member.membership_tier === 'sync_diamond'
                        ? 'SYNC DIAMOND'
                        : member.membership_tier === 'sync_gold'
                        ? 'SYNC GOLD'
                        : 'SYNC BASIC'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(member.phone)}
                    className="text-red-600 hover:bg-red-50 rounded-full p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>How it works:</strong> Each member pays based on their membership tier.
              Sync Basic members still pay platform fees, while Sync Gold and Sync Diamond members
              get their discounted rates.
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Next Step:</strong> After creating the group, you'll proceed to payment.
              All invited members will be notified and can join the ride.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-full font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invitedMembers.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 rounded-full font-semibold transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
