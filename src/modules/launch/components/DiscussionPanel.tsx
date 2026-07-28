import { FormEvent, useState } from 'react';
import { Check, MessageSquare, Send, Sparkles } from 'lucide-react';
import { useAddComment, useDecideCommentRequest, useDeleteComment } from '../hooks/useLaunch';
import { DeleteButton } from './DeleteButton';
import type { ProjectWorkspace } from '../domain/types';

const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function initials(name?: string | null) { return (name ?? 'GG').split(' ').map(value => value[0]).join('').slice(0, 2).toUpperCase(); }

function DecideForm({ projectId, commentId }: { projectId: string; commentId: string }) {
  const decide = useDecideCommentRequest(projectId);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) { setError('Tuliskan keputusannya.'); return; }
    setError(null);
    try { await decide.mutateAsync({ commentId, note }); setNote(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Keputusan belum dapat disimpan.'); }
  }

  return (
    <form className="decision-decide-form" onSubmit={submit}>
      <input placeholder="Tuliskan keputusan…" value={note} onChange={e => setNote(e.target.value)} />
      {error && <small className="form-error">{error}</small>}
      <button type="submit" className="button button-primary" disabled={decide.isPending}><Check size={14} /> {decide.isPending ? 'Menyimpan…' : 'Putuskan'}</button>
    </form>
  );
}

export function DiscussionPanel({ projectId, comments }: { projectId: string; comments: ProjectWorkspace['comments'] }) {
  const addComment = useAddComment(projectId);
  const deleteComment = useDeleteComment(projectId);
  const [body, setBody] = useState('');
  const [isDecision, setIsDecision] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openDecisions = comments.filter(item => item.is_decision_request && item.decision_status === 'OPEN');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) { setError('Tulis pesan terlebih dahulu.'); return; }
    setError(null);
    try {
      await addComment.mutateAsync({ body, isDecisionRequest: isDecision, decisionDeadline: deadline || undefined });
      setBody(''); setIsDecision(false); setDeadline('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Pesan belum dapat dikirim.'); }
  }

  return (
    <section className="content-card discussion-card">
      <div className="section-head"><div><span className="eyebrow">Diskusi artikel</span><h3>{comments.length} pesan{openDecisions.length ? ` · ${openDecisions.length} keputusan tertunda` : ''}</h3></div></div>

      <form className="discussion-form" onSubmit={submit}>
        <textarea rows={2} placeholder="Tulis update, kendala, atau pertanyaan untuk tim…" value={body} onChange={e => setBody(e.target.value)} />
        <div className="discussion-form-row">
          <label className="field-check"><input type="checkbox" checked={isDecision} onChange={e => setIsDecision(e.target.checked)} /><span>Ini permintaan keputusan</span></label>
          {isDecision && <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />}
          <button type="submit" className="button button-primary" disabled={addComment.isPending}><Send size={15} /> {addComment.isPending ? 'Mengirim…' : 'Kirim'}</button>
        </div>
        {error && <div className="form-error">{error}</div>}
      </form>

      {comments.length ? <div className="discussion-list">{comments.map(item => (
        <div key={item.id} className={`discussion-item ${item.is_decision_request ? 'discussion-decision' : ''}`}>
          <span className="avatar avatar-small">{initials(item.author?.full_name)}</span>
          <div className="discussion-body">
            <div className="discussion-head"><b>{item.author?.full_name ?? 'Tim'}</b><small>{date.format(new Date(item.created_at))}</small>{item.is_decision_request && <span className="decision-badge"><Sparkles size={11} /> {item.decision_status === 'OPEN' ? 'Perlu keputusan' : 'Diputuskan'}</span>}</div>
            <p>{item.body}</p>
            {item.is_decision_request && item.decision_deadline && <small className="discussion-deadline">Batas waktu: {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(item.decision_deadline))}</small>}
            {item.is_decision_request && item.decision_status === 'DECIDED' && <div className="decision-result"><Check size={14} /> {item.decision_note} — {item.decider?.full_name ?? 'owner'}</div>}
            {item.is_decision_request && item.decision_status === 'OPEN' && <DecideForm projectId={projectId} commentId={item.id} />}
          </div>
          <DeleteButton label="pesan" pending={deleteComment.isPending} onConfirm={() => deleteComment.mutate(item.id)} />
        </div>
      ))}</div> : <div className="state-panel state-empty"><MessageSquare size={26} /><h3>Belum ada diskusi</h3><p>Mulai percakapan atau ajukan keputusan yang dibutuhkan dari owner.</p></div>}
    </section>
  );
}
