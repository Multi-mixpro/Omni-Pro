import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  label: string;
  pending?: boolean;
  onConfirm: () => void;
}

/** Two-step delete so a stray tap on mobile cannot destroy recorded work. */
export function DeleteButton({ label, pending = false, onConfirm }: DeleteButtonProps) {
  const [armed, setArmed] = useState(false);

  if (pending) return <span className="row-delete is-pending" aria-live="polite"><Loader2 size={15} className="spin" /></span>;

  if (armed) {
    return (
      <span className="row-delete-confirm">
        <button type="button" className="confirm-yes" onClick={() => { setArmed(false); onConfirm(); }}>Hapus</button>
        <button type="button" className="confirm-no" onClick={() => setArmed(false)}>Batal</button>
      </span>
    );
  }

  return <button type="button" className="row-delete" aria-label={`Hapus ${label}`} title={`Hapus ${label}`} onClick={() => setArmed(true)}><Trash2 size={15} /></button>;
}
