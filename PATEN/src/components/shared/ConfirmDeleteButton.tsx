/**
 * Product Launch OS 3.0 - Shared inline two-step delete confirm button
 * First click arms the control ("Yakin?"), second click within the window executes onConfirm.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Check } from 'lucide-react';

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  armedClassName?: string;
}

export const ConfirmDeleteButton: React.FC<ConfirmDeleteButtonProps> = ({
  onConfirm,
  label = 'Hapus',
  disabled = false,
  loading = false,
  className = 'p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50',
  armedClassName = 'inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold transition-colors',
}) => {
  const [armed, setArmed] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!armed) {
      setArmed(true);
      timeoutRef.current = window.setTimeout(() => setArmed(false), 2500);
      return;
    }
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setArmed(false);
    onConfirm();
  };

  if (armed) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={armedClassName}
        title="Klik lagi untuk konfirmasi hapus"
      >
        <Check className="w-3 h-3" />
        <span>Yakin?</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      title={label}
      aria-label={label}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
};
