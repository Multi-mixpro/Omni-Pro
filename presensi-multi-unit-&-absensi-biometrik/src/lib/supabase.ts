import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to sync attendance record to Supabase if credentials are provided
export async function syncRecordToSupabase(record: any) {
  if (!supabase) {
    console.log('[Supabase Sync] Credentials not configured. Storing in local state.');
    return { success: false, mode: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert([
        {
          id: record.id,
          employee_id: record.employeeId,
          employee_name: record.employeeName,
          employee_code: record.employeeCode,
          unit_id: record.unitId,
          date: record.date,
          shift_name: record.shiftName,
          check_in_time: record.checkInTime,
          check_out_time: record.checkOutTime,
          status: record.status,
          geofence_status: record.geofenceStatus,
          distance_meters: record.distanceMeters,
          face_match_score: record.faceMatchScore,
          photo_url: record.photoUrl,
          location_name: record.locationName,
          notes: record.notes,
        },
      ]);

    if (error) {
      console.error('[Supabase Sync Error]', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase Connection Error]', err);
    return { success: false, error: err?.message };
  }
}
