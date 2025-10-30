import { supabase } from './supabase';

export interface GeofenceData {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
}

export interface GroupRideTag {
  id: string;
  tag_code: string;
  created_by: string;
  max_riders: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface GroupRideMember {
  id: string;
  tag_id: string;
  user_id: string;
  ride_id?: string;
  status: 'waiting' | 'matched' | 'riding' | 'completed' | 'cancelled';
  joined_at: string;
  left_at?: string;
}

export const generateTagCode = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_tag_code');

  if (error) throw error;
  return data;
};

export const createGroupRideTag = async (maxRiders: number = 4): Promise<GroupRideTag> => {
  const tagCode = await generateTagCode();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('group_ride_tags')
    .insert({
      tag_code: tagCode,
      created_by: user.user.id,
      max_riders: maxRiders,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const joinGroupRide = async (tagCode: string): Promise<GroupRideMember> => {
  const { data: tag, error: tagError } = await supabase
    .from('group_ride_tags')
    .select('*')
    .eq('tag_code', tagCode)
    .eq('is_active', true)
    .single();

  if (tagError) throw new Error('Invalid or expired tag code');
  if (!tag) throw new Error('Tag not found');

  const now = new Date();
  if (new Date(tag.expires_at) < now) {
    throw new Error('Tag has expired');
  }

  const { count } = await supabase
    .from('group_ride_members')
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', tag.id)
    .neq('status', 'cancelled');

  if (count && count >= tag.max_riders) {
    throw new Error('Group is full');
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: existingMember } = await supabase
    .from('group_ride_members')
    .select('*')
    .eq('tag_id', tag.id)
    .eq('user_id', user.user.id)
    .neq('status', 'cancelled')
    .maybeSingle();

  if (existingMember) {
    throw new Error('Already a member of this group');
  }

  const { data, error } = await supabase
    .from('group_ride_members')
    .insert({
      tag_id: tag.id,
      user_id: user.user.id,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getGroupMembers = async (tagId: string): Promise<GroupRideMember[]> => {
  const { data, error } = await supabase
    .from('group_ride_members')
    .select('*')
    .eq('tag_id', tagId)
    .neq('status', 'cancelled')
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const isWithinGeofence = async (
  userLat: number,
  userLng: number,
  fenceLat: number,
  fenceLng: number,
  radiusMeters: number
): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_within_geofence', {
    user_lat: userLat,
    user_lng: userLng,
    fence_lat: fenceLat,
    fence_lng: fenceLng,
    radius_meters: radiusMeters,
  });

  if (error) throw error;
  return data;
};

export const createRideGeofence = async (
  rideId: string,
  centerLat: number,
  centerLng: number,
  radiusMeters: number = 500
): Promise<void> => {
  const { error } = await supabase
    .from('ride_geofences')
    .insert({
      ride_id: rideId,
      center_lat: centerLat,
      center_lng: centerLng,
      radius_meters: radiusMeters,
      is_active: true,
    });

  if (error) throw error;
};

const NWA_BOUNDS = {
  north: 36.55,
  south: 35.85,
  east: -93.95,
  west: -94.65
};

export const isPointInNWA = (lat: number, lng: number): boolean => {
  return (
    lat >= NWA_BOUNDS.south &&
    lat <= NWA_BOUNDS.north &&
    lng >= NWA_BOUNDS.west &&
    lng <= NWA_BOUNDS.east
  );
};

export const validateNWAGeofence = (
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number
): { valid: boolean; message?: string } => {
  if (!isPointInNWA(pickupLat, pickupLng)) {
    return {
      valid: false,
      message: 'Pickup location must be within Northwest Arkansas (NWA) area'
    };
  }

  if (!isPointInNWA(dropoffLat, dropoffLng)) {
    return {
      valid: false,
      message: 'Dropoff location must be within Northwest Arkansas (NWA) area'
    };
  }

  return { valid: true };
};

export const validateGeofence = async (
  tagId: string,
  pickupLat: number,
  pickupLng: number
): Promise<{ valid: boolean; message?: string }> => {
  const members = await getGroupMembers(tagId);

  if (members.length === 0) {
    return { valid: true };
  }

  const maxDistance = 500;

  for (const _member of members) {
    const isWithin = await isWithinGeofence(
      pickupLat,
      pickupLng,
      pickupLat,
      pickupLng,
      maxDistance
    );

    if (!isWithin) {
      return {
        valid: false,
        message: `All riders must be within ${maxDistance}m of the pickup location`,
      };
    }
  }

  return { valid: true };
};
