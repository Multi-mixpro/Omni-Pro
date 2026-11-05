import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMemberActivity {
  id: string;
  full_name: string;
  username: string;
  job_title: string | null;
  avatar_url: string | null;
  last_seen_at: string | null;
  is_online: boolean;
}

const ACTIVITY_WINDOW = 30 * 60_000;
const lastActivity = new Map<string, number>();

export function useTeamActivity(currentUserId?: string) {
  const [members, setMembers] = useState<TeamMemberActivity[]>([]);
  const lastRosterRead = useRef(0);

  const recordActivity = useCallback(() => {
    if (!currentUserId) return;
    const now = Date.now();
    if (now - (lastActivity.get(currentUserId) ?? 0) < ACTIVITY_WINDOW) return;
    lastActivity.set(currentUserId, now);
    void (async () => {
      await supabase.from('profiles').update({ last_seen_at: new Date(now).toISOString() }).eq('id', currentUserId);
    })();
  }, [currentUserId]);
  useEffect(recordActivity, [recordActivity]);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, job_title, avatar_url, last_seen_at')
      .eq('is_active', true)
      .order('last_seen_at', { ascending: false, nullsFirst: false });

    if (data) {
      const now = Date.now();
      setMembers(
        data.map((m: any) => ({
          ...m,
          is_online: m.last_seen_at
            ? now - new Date(m.last_seen_at).getTime() < ACTIVITY_WINDOW
            : false,
        })),
      );
    }
  }, []);

  const onOpen = useCallback(() => {
    recordActivity();
    const now = Date.now();
    if (now - lastRosterRead.current < 60_000) return;
    lastRosterRead.current = now;
    void fetchMembers();
  }, [fetchMembers, recordActivity]);

  const onlineCount = members.filter((m) => m.is_online).length;

  return { members, onlineCount, onOpen };
}
