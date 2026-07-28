import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Factory, PackageCheck, ShieldCheck, Send, X } from 'lucide-react';
import { useDecideApproval, useRequestApproval, useUpdateStage } from '../hooks/useLaunch';
import type { LaunchStage, ProjectWorkspace } from '../domain/types';

const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface ApprovalPanelProps {
  projectId: string;
  ownerApprovalStage?: LaunchStage;
  productionReadyStage?: LaunchStage;
  approvals: ProjectWorkspace['approvals'];
  onBack: () => void;
}

export function ApprovalPanel({ projectId, ownerApprovalStage, productionReadyStage, approvals, onBack }: ApprovalPanelProps) {
  const request = useRequestApproval(projectId);
  const decide = useDecideApproval(projectId);
  const stageMutation = useUpdateStage(projectId);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

  const latest = approvals[0];
  const isPending = latest?.status === 'PENDING';
  const isApproved = approvals.some(item => item.status === 'APPROVED');
  const canRequest = !latest || latest.status === 'REJECTED' || latest.status === 'REVISION';

  async function submitRequest() {
    setError(null);
    try { await request.mutateAsync('PRODUCTION'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Pengajuan approval belum dapat dikirim.'); }
  }

  async function submitDecision(event: FormEvent, status: 'APPROVED' | 'REJECTED' | 'REVISION') {
    event.preventDefault();
    if (!latest) return;
    setError(null);
    try { await decide.mutateAsync({ approvalId: latest.id, status, note }); setNote(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Keputusan belum dapat disimpan.'); }
  }

  async function completeStage(stage?: LaunchStage) {
    if (!stage) return;
    setStageError(null);
    try { await stageMutation.mutateAsync({ stageId: stage.id, status: 'COMPLETED' }); }
    catch (reason) { setStageError(reason instanceof Error ? reason.message : 'Gate tahap belum lengkap.'); }
  }

  return (
    <div className="workstream-panel">
      <button className="back-link" onClick={onBack}><ArrowLeft size={18} /> Kembali ke ruang kerja</button>
      <div className="section-head"><div><span className="eyebrow">Tahap 08 · Approval &amp; produksi</span><h3>Persetujuan owner sebelum produksi massal</h3><p>Tim mengajukan approval produksi setelah QC lolos. Owner menyetujui, menolak, atau meminta revisi sebelum artikel dapat ditandai siap produksi.</p></div></div>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Status approval</span><h3>{latest ? `Permintaan terakhir: ${latest.status}` : 'Belum ada pengajuan'}</h3></div></div>

        {!latest && <div className="state-panel state-empty"><Send size={28} /><h3>Belum diajukan</h3><p>Ajukan approval produksi setelah sample dan QC dinyatakan lolos.</p><button type="button" className="button button-primary" disabled={request.isPending} onClick={submitRequest}><Send size={16} /> {request.isPending ? 'Mengajukan…' : 'Ajukan approval produksi'}</button></div>}

        {isPending && <form className="approval-decide-form">
          <p className="blocker-description">Diajukan oleh {latest?.requester?.full_name ?? 'tim'} pada {date.format(new Date(latest!.requested_at))}.</p>
          <label className="field field-wide"><span>Catatan keputusan (opsional)</span><textarea rows={2} placeholder="Alasan persetujuan, penolakan, atau revisi yang diminta…" value={note} onChange={e => setNote(e.target.value)} /></label>
          {error && <div className="form-error">{error}</div>}
          <div className="edit-project-actions">
            <button type="button" className="button button-secondary" disabled={decide.isPending} onClick={e => submitDecision(e, 'REVISION')}>Minta revisi</button>
            <button type="button" className="button button-danger" disabled={decide.isPending} onClick={e => submitDecision(e, 'REJECTED')}><X size={16} /> Tolak</button>
            <button type="button" className="button button-primary" disabled={decide.isPending} onClick={e => submitDecision(e, 'APPROVED')}><Check size={16} /> Setujui produksi</button>
          </div>
        </form>}

        {canRequest && latest && <div className="edit-project-actions"><button type="button" className="button button-secondary" disabled={request.isPending} onClick={submitRequest}><Send size={16} /> {request.isPending ? 'Mengajukan…' : 'Ajukan ulang approval'}</button></div>}

        {approvals.length > 0 && <div className="resource-list approval-history">{approvals.map(item => <div key={item.id}>
          <span className={`resource-icon approval-icon-${item.status.toLowerCase()}`}><ShieldCheck size={16} /></span>
          <div><b>{item.status}{item.decided_by ? ` oleh ${item.decider?.full_name ?? 'owner'}` : ''}</b><small>{item.decision_note || 'Tanpa catatan'} · {date.format(new Date(item.decided_at ?? item.requested_at))}</small></div>
        </div>)}</div>}
      </section>

      {ownerApprovalStage && ownerApprovalStage.status !== 'COMPLETED' && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Gate tahap</span><h3>Tandai approval owner selesai</h3></div></div>
        <div className="gate-list"><div className={isApproved ? 'done' : ''}><span>{isApproved ? <Check size={15} /> : <PackageCheck size={16} />}</span><b>Approval produksi disetujui</b><small>{isApproved ? 'Owner telah menyetujui' : 'Menunggu persetujuan owner'}</small></div></div>
        {stageError && <div className="form-error"><AlertCircle size={16} /> {stageError}</div>}
        <button className="button button-primary" disabled={!isApproved || stageMutation.isPending} onClick={() => completeStage(ownerApprovalStage)}>{stageMutation.isPending ? 'Memproses…' : 'Tandai approval selesai'}</button>
      </section>}

      {ownerApprovalStage?.status === 'COMPLETED' && productionReadyStage && productionReadyStage.status !== 'COMPLETED' && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Gate akhir</span><h3>Tandai artikel siap produksi</h3></div></div>
        <div className="gate-list"><div className="done"><span><Check size={15} /></span><b>Approval owner selesai</b><small>Semua tahap sebelumnya telah lengkap</small></div></div>
        {stageError && <div className="form-error"><AlertCircle size={16} /> {stageError}</div>}
        <button className="button button-primary" disabled={stageMutation.isPending} onClick={() => completeStage(productionReadyStage)}><Factory size={16} /> {stageMutation.isPending ? 'Memproses…' : 'Tandai siap produksi'}</button>
      </section>}

      {productionReadyStage?.status === 'COMPLETED' && <div className="state-panel state-empty"><Factory size={28} /><h3>Artikel siap produksi</h3><p>Seluruh gate telah lengkap. Artikel dapat dilanjutkan ke produksi massal.</p></div>}
    </div>
  );
}
