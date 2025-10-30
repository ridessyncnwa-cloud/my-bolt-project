import { useState, useEffect } from 'react';
import { Users, Copy, Check, X, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createGroupRideTag, joinGroupRide, getGroupMembers, type GroupRideTag, type GroupRideMember } from '../lib/geofence';

interface GroupRidePanelProps {
  onGroupSelected?: (tagId: string, memberCount: number) => void;
}

export function GroupRidePanel({ onGroupSelected }: GroupRidePanelProps) {
  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');
  const [tag, setTag] = useState<GroupRideTag | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [members, setMembers] = useState<GroupRideMember[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tag) {
      loadMembers();
      const interval = setInterval(loadMembers, 3000);
      return () => clearInterval(interval);
    }
  }, [tag]);

  const loadMembers = async () => {
    if (!tag) return;
    try {
      const data = await getGroupMembers(tag.id);
      setMembers(data);
      if (onGroupSelected) {
        onGroupSelected(tag.id, data.length);
      }
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const handleCreateTag = async () => {
    setLoading(true);
    setError('');
    try {
      const newTag = await createGroupRideTag(4);
      setTag(newTag);
      setMode('create');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group tag');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!tagInput.trim()) {
      setError('Please enter a tag code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await joinGroupRide(tagInput.toUpperCase());

      const { data: tagData } = await supabase
        .from('group_ride_tags')
        .select('*')
        .eq('tag_code', tagInput.toUpperCase())
        .single();

      if (tagData) {
        setTag(tagData);
        setMode('join');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const copyTagCode = () => {
    if (tag) {
      navigator.clipboard.writeText(tag.tag_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTimeRemaining = () => {
    if (!tag) return '';
    const now = new Date();
    const expires = new Date(tag.expires_at);
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  if (mode === 'none') {
    return (
      <div className="bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <Users className="h-6 w-6 text-blue-400 mr-2" />
          <h3 className="text-xl font-bold text-white">Group Ride</h3>
        </div>
        <p className="text-gray-400 mb-6 text-sm">
          Ride together with friends within a 500m radius. Share a tag code to sync your pickups.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleCreateTag}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Group Tag'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-blue-950 text-gray-400">or</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value.toUpperCase())}
              placeholder="Enter Tag Code"
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-700 bg-blue-950 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none uppercase text-center text-lg tracking-wider"
              maxLength={6}
            />
            <button
              onClick={handleJoinGroup}
              disabled={loading || !tagInput.trim()}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-600/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-500/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-blue-400 mr-2" />
          <h3 className="text-xl font-bold text-white">Group Ride Active</h3>
        </div>
        <button
          onClick={() => {
            setMode('none');
            setTag(null);
            setMembers([]);
            setTagInput('');
          }}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {tag && (
        <>
          <div className="bg-blue-950/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Group Tag Code</span>
              <div className="flex items-center text-yellow-500">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-xs">{getTimeRemaining()} left</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white tracking-wider">{tag.tag_code}</span>
              <button
                onClick={copyTagCode}
                className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Group Members</span>
              <span className="text-sm font-semibold text-white">{members.length} / {tag.max_riders}</span>
            </div>

            <div className="space-y-2">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="bg-blue-950/30 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                      {index + 1}
                    </div>
                    <span className="text-white text-sm">Rider {index + 1}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    member.status === 'waiting' ? 'bg-yellow-900/30 text-yellow-400' :
                    member.status === 'matched' ? 'bg-green-900/30 text-green-400' :
                    'bg-gray-900/30 text-gray-400'
                  }`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700/30 rounded-lg">
            <p className="text-xs text-gray-400">
              <strong className="text-blue-400">Note:</strong> All riders must be within 500m of the pickup location to sync successfully.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
