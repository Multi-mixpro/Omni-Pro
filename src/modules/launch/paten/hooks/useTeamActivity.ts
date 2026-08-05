import { useEffect, useRef, useState } from 'react';
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

const HEARTBEAT_INTERVAL = 60_000; // 1 min
const ONLINE_THRESHOLD = 3 * 60_000; // 3 min

export function useTeamActivity(currentUserId?: string) {
  const [members, setMembers] = useState<TeamMemberActivity[]>([]);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!currentUserId) return;

    async function fetchMembers() {
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
              ? now - new Date(m.last_seen_at).getTime() < ONLINE_THRESHOLD
              : false,
          })),
        );
      }
    }

    async function heartbeat() {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', currentUserId!);
    }

    heartbeat();
    fetchMembers();

    heartbeatRef.current = setInterval(() => {
      heartbeat();
      fetchMembers();
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [currentUserId]);

  const onlineCount = members.filter((m) => m.is_online).length;

  return { members, onlineCount };
}
