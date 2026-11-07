import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from '@/app/router/simpleRouter';
import { signOut } from './useAuth';

export function AccountSignOut({ className, name }: { className?: string; name?: string }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div>
    <button type="button" className={className} disabled={pending} title={name ? 'Keluar dari akun ' + name : undefined}
      onClick={async () => {
        setPending(true);
        setFailed(false);
        try { await signOut(); navigate('/launch/login', { replace: true }); }
        catch { setFailed(true); }
        finally { setPending(false); }
      }}>
      <LogOut size={16} aria-hidden="true" /> {pending ? 'Keluar…' : 'Keluar'}
    </button>
    {failed && <p role="alert" className="mt-1 text-xs text-rose-700">Belum bisa keluar. Coba lagi.</p>}
  </div>;
}
