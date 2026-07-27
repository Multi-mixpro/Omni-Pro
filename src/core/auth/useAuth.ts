import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/modules/launch/domain/types';

const AUTH_KEY = ['product-launch-auth'] as const;

export interface AuthState {
  session: Session | null;
  profile: Profile | null;
  permissions: string[];
}

async function loadAuth(): Promise<AuthState> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { session: null, profile: null, permissions: [] };

  const [{ data: profile, error: profileError }, { data: permissions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', data.session.user.id).maybeSingle(),
    supabase.rpc('my_permissions'),
  ]);

  if (profileError) throw profileError;
  return {
    session: data.session,
    profile: (profile as Profile | null) ?? null,
    permissions: ((permissions as Array<{ code: string }> | null) ?? []).map(item => item.code),
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: AUTH_KEY, queryFn: loadAuth });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: AUTH_KEY });
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return query;
}

export async function signIn(identifier: string, password: string) {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized || !password) throw new Error('Username/email dan password wajib diisi.');

  let email = normalized;
  if (!normalized.includes('@')) {
    const { data, error } = await supabase.rpc('resolve_login_email', { p_identifier: normalized });
    if (error || !data) throw new Error('Username tidak ditemukan atau belum aktif.');
    email = String(data);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Login gagal. Periksa username/email dan password Anda.');
}

export async function signOut() {
  await supabase.auth.signOut();
}
