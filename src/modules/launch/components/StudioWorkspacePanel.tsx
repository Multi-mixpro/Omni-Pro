import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Eye, GripVertical, MoreHorizontal, Pin, UserRound } from 'lucide-react';

export type StudioPanelState = 'complete' | 'incomplete' | 'review' | 'locked';

interface StudioWorkspacePanelProps {
  id: string;
  index: number;
  icon: ReactNode;
  title: string;
  subtitle: string;
  metric: string;
  completeness: number;
  missingCount: number;
  owner?: string | null;
  state?: StudioPanelState;
  expanded: boolean;
  active?: boolean;
  pinned?: boolean;
  onToggle: () => void;
  onPin: () => void;
  onResult?: () => void;
  children: ReactNode;
}

const stateLabel: Record<StudioPanelState, string> = {
  complete: 'Lengkap',
  incomplete: 'Perlu dilengkapi',
  review: 'Perlu review',
  locked: 'Terkunci',
};

export function StudioWorkspacePanel({
  id, index, icon, title, subtitle, metric, completeness, missingCount, owner,
  state = 'incomplete', expanded, active, pinned, onToggle, onPin, onResult, children,
}: StudioWorkspacePanelProps) {
  return (
    <section id={id} className={`studio-work-panel state-${state} ${expanded ? 'is-expanded' : ''} ${active ? 'is-active' : ''}`}>
      <div className="studio-work-panel-head">
        <button type="button" className="studio-panel-toggle" onClick={onToggle} aria-expanded={expanded}>
          <GripVertical className="studio-panel-grip" size={17} />
          <span className="studio-panel-index">{String(index).padStart(2, '0')}</span>
          <span className="studio-panel-icon">{icon}</span>
          <span className="studio-panel-title"><small>{subtitle}</small><b>{title}</b><em>{metric}</em></span>
          <span className="studio-panel-complete"><span><i style={{ width: `${completeness}%` }} /></span><b>{completeness}%</b></span>
          <span className={`studio-panel-state state-${state}`}>{state === 'complete' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{stateLabel[state]}</span>
          <ChevronDown className="studio-panel-chevron" size={20} />
        </button>
        <button type="button" className={`studio-pin ${pinned ? 'is-pinned' : ''}`} onClick={onPin} aria-label={pinned ? 'Lepas pin panel' : 'Pin panel'}><Pin size={16} /></button>
      </div>
      {expanded && <>
        <div className="studio-panel-context">
          <span><UserRound size={15} /> PIC: <b>{owner || 'Belum ditetapkan'}</b></span>
          <span>{missingCount ? `${missingCount} data utama belum lengkap` : 'Seluruh data utama panel lengkap'}</span>
        </div>
        <div className="studio-panel-body">{children}</div>
        <footer className="studio-panel-footer">
          <span><i /> Tersimpan otomatis · baru saja</span>
          <div>{onResult && <button type="button" onClick={onResult}><Eye size={16} /> Lihat hasil</button>}<button type="button" aria-label="Menu panel"><MoreHorizontal size={18} /></button></div>
        </footer>
      </>}
    </section>
  );
}
