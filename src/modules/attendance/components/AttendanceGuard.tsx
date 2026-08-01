/**
 * Penjaga akses Central Attendance.
 *
 * Product Launch OS dan Attendance adalah dua sistem dengan pengguna yang
 * berbeda. Supabase hanya menyediakan satu kolam kredensial (auth.users) per
 * project, sehingga pemisahan TIDAK boleh mengandalkan "punya akun atau tidak",
 * melainkan pada keanggotaan sistem masing-masing:
 *
 *   Product Launch  -> user_roles / permission launch.*
 *   Attendance      -> attendance_memberships
 *
 * Akun yang dibuat di Product Launch tidak otomatis bisa masuk Attendance,
 * begitu pula sebaliknya. Rute /attendance/* sebelumnya sama sekali tanpa
 * penjaga sehingga bisa dibuka langsung tanpa login.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AttendanceRole } from '../domain/types';
import '../attendance.css';

type AccessState =
  | { status: 'checking' }
  | { status: 'no-session' }
  | { status: 'not-member'; email: string | null }
  | { status: 'allowed'; roles: AttendanceRole[] };

/** Cek sesi + keanggotaan Attendance milik user yang sedang login. */
export function useAttendanceAccess(): AccessState {
  const [state, setState] = useState<AccessState>({ status: 'checking' });

  useEffect(() => {
    let active = true;

    async function evaluate() {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData.user;
      if (!active) return;

      if (!user) {
        setState({ status: 'no-session' });
        return;
      }

      const { data: memberships } = await supabase
        .from('attendance_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!active) return;

      if (!memberships?.length) {
        setState({ status: 'not-member', email: user.email ?? null });
        return;
      }

      setState({
        status: 'allowed',
        roles: memberships.map((membership) => membership.role as AttendanceRole),
      });
    }

    void evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { void evaluate(); });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

function Notice({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="att-app">
      <div className="att-shell" style={{ paddingTop: 48 }}>
        <div className="att-card" style={{ textAlign: 'center' }}>
          <h1 className="att-h3" style={{ marginBottom: 6 }}>{title}</h1>
          <p className="att-small" style={{ marginBottom: 16 }}>{body}</p>
          {action}
        </div>
      </div>
    </div>
  );
}

export function AttendanceGuard({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: AttendanceRole[];
}) {
  const access = useAttendanceAccess();

  if (access.status === 'checking') {
    return <Notice title="Memeriksa akses…" body="Sedang memverifikasi keanggotaan Attendance Anda." />;
  }

  if (access.status === 'no-session') {
    return (
      <Notice
        title="Perlu masuk terlebih dahulu"
        body="Silakan masuk memakai akun Attendance Anda untuk melanjutkan."
        action={
          <a className="att-btn att-btn-primary" href="/attendance/login">
            Masuk ke Attendance
          </a>
        }
      />
    );
  }

  if (access.status === 'not-member') {
    return (
      <Notice
        title="Akun ini belum terdaftar di Attendance"
        body={
          `${access.email ?? 'Akun Anda'} tidak memiliki keanggotaan pada sistem Attendance. `
          + 'Akun Product Launch OS tidak otomatis memperoleh akses Attendance. '
          + 'Hubungi admin unit untuk didaftarkan sebagai karyawan atau pengelola.'
        }
        action={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="att-btn att-btn-secondary" href="/launch/app/today">
              Ke Product Launch OS
            </a>
            <button
              type="button"
              className="att-btn att-btn-primary"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/attendance/login';
              }}
            >
              Masuk akun lain
            </button>
          </div>
        }
      />
    );
  }

  if (allowedRoles && !access.roles.some((role) => allowedRoles.includes(role))) {
    return (
      <Notice
        title="Akses pengelolaan diperlukan"
        body="Halaman ini hanya dapat dibuka oleh owner atau admin unit Attendance."
        action={
          <a className="att-btn att-btn-primary" href="/attendance/today">
            Kembali ke halaman Today
          </a>
        }
      />
    );
  }

  return <>{children}</>;
}
