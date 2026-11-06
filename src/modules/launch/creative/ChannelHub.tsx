import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { button, Editor, errorText, field, Label, Options, People, primary } from './CreativeForms';
import { PAGE_SIZE, type Campaign, type TeamMember } from './repository';
import { channelActivations, channelPlatforms, channelStatus, createActivationFollowup, decisions, metrics, saveActivation, type Activation, type ActivationDraft, type ChannelSummary } from './channelRepository';
import { accounts } from './commandRepository';
import { CreativePager } from './CreativeAccounts';

const panel = 'rounded-xl border border-slate-200 bg-white p-4';
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('id-ID');
const shortDate = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' });
const date = (day: string) => shortDate.format(new Date(day + 'T00:00:00Z'));
const value = (data: FormData, key: string) => String(data.get(key) ?? '').trim();

function ActivationForm({ row, campaigns, members, scope, userId, onCancel, onSaved }: {
  row?: Activation; campaigns: Campaign[]; members: TeamMember[]; scope: string; onCancel: () => void; onSaved: () => void;
  userId: string;
}) {
  const [distribution, setDistribution] = useState(row?.distribution ?? 'paid');
  const [status, setStatus] = useState(row?.status ?? 'planned');
  const [campaignId,setCampaignId] = useState(row?.campaign_id ?? (scope === 'all' ? '' : scope));
  const [platform,setPlatform] = useState(row?.platform ?? 'marketplace');
  const [accountPage,setAccountPage] = useState(0);
  const campaignUnit = campaigns.find(campaign => campaign.id === campaignId)?.business_unit_id;
  const accountQuery = useQuery({ enabled: !!campaignUnit,
    queryKey: ['creative',userId,'accounts','active',campaignUnit,accountPage,platform],
    queryFn: ({ signal }) => accounts(campaignUnit ?? 'unassigned',accountPage,signal,true,platform) });
  return <Editor title={row ? 'Edit & evaluasi kanal' : 'Tambah iklan atau aktivasi kanal'} onCancel={onCancel} onSaved={onSaved}
    onSave={data => {
      const starts = value(data, 'start');
      const ends = value(data, 'end');
      const review = value(data, 'review');
      const evaluation = value(data, 'evaluation');
      const decision = value(data, 'decision') as ActivationDraft['decision'] | '';
      if (!review || (starts && (review < starts || (ends && ends < starts)))) throw new Error('Periksa urutan tanggal mulai, akhir, dan evaluasi.');
      if (status === 'evaluated' && (!evaluation || !decision)) throw new Error('Isi catatan dan keputusan sebelum menutup evaluasi.');
      return saveActivation({
        name: value(data, 'name'), campaign_id: value(data, 'campaign'), platform: value(data, 'platform') as ActivationDraft['platform'],
        account_id: value(data,'account') || null,
        channel_name: value(data, 'channel'), distribution, status, assignee_id: value(data, 'person') || null,
        starts_on: starts || null, ends_on: ends || null, review_on: review,
        budget_idr: distribution === 'paid' ? Number(value(data, 'budget')) : 0,
        spent_idr: distribution === 'paid' ? Number(value(data, 'spent')) : 0,
        metric: value(data, 'metric') as ActivationDraft['metric'], target_result: Number(value(data, 'target')),
        actual_result: Number(value(data, 'actual')), evaluation, decision: decision || null,
      }, row);
    }}>
    <Label title="Nama aktivasi"><input className={field} name="name" required maxLength={160} defaultValue={row?.name} placeholder="Contoh: Iklan menu akhir pekan" /></Label>
    <Label title="Kampanye"><select className={field} name="campaign" required value={campaignId} onChange={event => { setCampaignId(event.target.value); setAccountPage(0); }}>
      <option value="">Pilih kampanye</option>
      {row && !campaigns.some(campaign => campaign.id === row.campaign_id) && <option value={row.campaign_id}>{row.campaign?.name ?? 'Kampanye saat ini'}</option>}
      {campaigns.filter(campaign => campaign.status !== 'archived' || campaign.id === row?.campaign_id).map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
    </select></Label>
    <Label title="Platform"><select className={field} name="platform" value={platform} onChange={event => { setPlatform(event.target.value as ActivationDraft['platform']); setAccountPage(0); }}><Options values={channelPlatforms} /></select></Label>
    <Label title="Akun terdaftar"><select key={campaignId+platform+accountPage} className={field} name="account"
      defaultValue={campaignId === row?.campaign_id && platform === row?.platform ? row?.account_id ?? '' : ''}>
      <option value="">Belum dihubungkan</option>
      {row?.account_id && campaignId === row.campaign_id && platform === row.platform && !accountQuery.data?.slice(0,PAGE_SIZE).some(item => item.id === row.account_id) &&
        <option value={row.account_id}>{row.account?.handle ?? 'Akun saat ini'}</option>}
      {accountQuery.data?.slice(0,PAGE_SIZE).map(item => <option key={item.id} value={item.id}>{item.handle}</option>)}
    </select>
    <CreativePager page={accountPage} next={(accountQuery.data?.length ?? 0)>PAGE_SIZE} onPage={setAccountPage} /></Label>
    <Label title="Kanal / akun"><input className={field} name="channel" maxLength={80} defaultValue={row?.channel_name} placeholder="Contoh: Shopee, Meta Ads, @akun" /></Label>
    <Label title="Distribusi"><select className={field} value={distribution} onChange={event => setDistribution(event.target.value as ActivationDraft['distribution'])}><option value="paid">Iklan berbayar</option><option value="organic">Organik</option></select></Label>
    <Label title="PIC evaluasi"><People members={members} current={row?.assignee_id} required={!row} /></Label>
    <Label title="Tanggal mulai"><input className={field} type="date" name="start" defaultValue={row?.starts_on ?? ''} /></Label>
    <Label title="Tanggal akhir"><input className={field} type="date" name="end" defaultValue={row?.ends_on ?? ''} /></Label>
    <Label title="Deadline evaluasi"><input className={field} type="date" name="review" required defaultValue={row?.review_on} /></Label>
    <Label title="Status"><select className={field} value={status} onChange={event => setStatus(event.target.value as ActivationDraft['status'])}><Options values={channelStatus} /></select></Label>
    {distribution === 'paid' && <>
      <Label title="Anggaran iklan (Rp)"><input className={field} type="number" min={0} max={999999999999} name="budget" defaultValue={row?.budget_idr ?? 0} /></Label>
      <Label title="Belanja aktual (Rp)"><input className={field} type="number" min={0} max={999999999999} name="spent" defaultValue={row?.spent_idr ?? 0} /></Label>
    </>}
    <Label title="Metrik utama"><select className={field} name="metric" defaultValue={row?.metric ?? 'orders'}><Options values={metrics} /></select></Label>
    <Label title="Target hasil"><input className={field} type="number" min={0} max={2147483647} name="target" defaultValue={row?.target_result ?? 0} /></Label>
    <Label title="Hasil aktual"><input className={field} type="number" min={0} max={2147483647} name="actual" defaultValue={row?.actual_result ?? 0} /></Label>
    <Label title="Keputusan evaluasi"><select className={field} name="decision" required={status === 'evaluated'} defaultValue={row?.decision ?? ''}><option value="">Belum diputuskan</option><Options values={decisions} /></select></Label>
    <Label title="Catatan evaluasi"><textarea className={field} name="evaluation" rows={3} maxLength={2000} required={status === 'evaluated'} defaultValue={row?.evaluation} /></Label>
  </Editor>;
}

export function ChannelHub({ userId, unit, scope, today, canEdit, campaigns, members, overview, initialReview, onTask, initialActivation }: {
  userId: string; unit: string; scope: string; today: string; canEdit: boolean; campaigns: Campaign[];
  members: TeamMember[]; overview: ChannelSummary[] | undefined; initialReview: string;
  onTask: (id: string) => void;
  initialActivation?: string;
}) {
  const client = useQueryClient();
  const [platform, setPlatform] = useState('');
  const [review, setReview] = useState(initialReview);
  const [activation, setActivation] = useState(initialActivation);
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Activation | 'new' | null>(null);
  const [followup, setFollowup] = useState<Activation | null>(null);
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['creative', userId, 'activations', unit, scope, page, platform, review, today, activation],
    queryFn: ({ signal }) => channelActivations(unit, scope, page, platform, review, today, signal, undefined, activation),
  });
  const openEditor = (item: Activation | 'new') => {
    setEditor(item); setNotice('');
    document.getElementById('channel-hub')?.scrollIntoView({ block: 'start' });
  };
  return <section id="channel-hub" className="space-y-4" aria-label="Iklan dan evaluasi">
    <div className={panel + ' flex flex-wrap items-start justify-between gap-3'}>
      <div><h2 className="text-lg font-bold">Iklan &amp; Evaluasi Kanal</h2><p className="text-sm text-slate-600">Pantau marketplace, sosial media, dan kanal lain. Angka diisi manual dari laporan platform.</p></div>
      {canEdit && <button className={primary} disabled={!campaigns.some(campaign => campaign.status !== 'archived')} onClick={() => openEditor('new')}>Tambah aktivasi</button>}
      {canEdit && !campaigns.some(campaign => campaign.status !== 'archived') && <p className="w-full text-sm text-slate-600">Buat atau muat kampanye aktif untuk menambahkan aktivasi.</p>}
    </div>
    {editor && canEdit && <ActivationForm userId={userId} key={editor === 'new' ? 'new' : editor.id} row={editor === 'new' ? undefined : editor}
      campaigns={campaigns} members={members} scope={scope} onCancel={() => setEditor(null)} onSaved={() => {
        setEditor(null); setPage(0); setNotice('Aktivasi tersimpan.');
        void client.invalidateQueries({ queryKey: ['creative', userId, 'activations'] });
        void client.invalidateQueries({ queryKey: ['creative', userId, 'channel-summary'] });
        void client.invalidateQueries({ queryKey: ['creative', userId, 'calendar'] });
      }} />}
    {followup && canEdit && <Editor title={'Tindak lanjut: ' + followup.name} onCancel={() => setFollowup(null)}
      onSave={data => createActivationFollowup(followup.id,value(data,'person'),value(data,'due'))}
      onSaved={id => {
        setFollowup(null);
        for (const key of ['tasks','summary','calendar','workload']) void client.invalidateQueries({ queryKey: ['creative',userId,key] });
        void client.invalidateQueries({ queryKey: ['business-execution',userId] });
        onTask(id);
      }}>
      <Label title="PIC"><People members={members} current={followup.assignee_id} required /></Label>
      <Label title="Deadline tindak lanjut"><input className={field} name="due" type="date" required /></Label>
    </Editor>}
    {notice && <p role="status" className="text-sm text-teal-800">{notice}</p>}
    {!!overview?.length && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Laporan per platform">
      {overview.map(item => <article key={item.platform} className={panel}>
        <h3 className="font-semibold">{channelPlatforms[item.platform]}</h3>
        <p className={'mt-1 text-sm ' + (Number(item.spent) > Number(item.budget) ? 'font-semibold text-rose-800' : '')}>
          Belanja {rupiah.format(item.spent)} / {rupiah.format(item.budget)}{Number(item.spent) > Number(item.budget) ? ' · Melebihi anggaran' : ''}
        </p>
        <p className="text-sm text-slate-600">{item.evaluated} dievaluasi · {item.pending_review} perlu review hingga 7 hari ke depan</p>
        {item.overdue > 0 && <p className="text-sm font-semibold text-rose-700">{item.overdue} lewat deadline</p>}
      </article>)}
    </div>}
    <p className="text-xs text-slate-600">Ringkasan memakai seluruh lingkup kampanye terpilih. Anggaran kanal dicatat terpisah dari anggaran kampanye.</p>
    <div className={panel + ' space-y-3'}>
      {activation && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-teal-50 p-3 text-sm">
        <span>Aktivasi dipilih dari agenda</span><button className={button} onClick={() => { setActivation(undefined); setPage(0); }}>Tampilkan semua aktivasi</button>
      </div>}
      <div className="grid gap-2 sm:grid-cols-2">
        <select className={field} aria-label="Filter platform iklan" value={platform} onChange={event => { setPlatform(event.target.value); setPage(0); }}><option value="">Semua platform</option><Options values={channelPlatforms} /></select>
        <select className={field} aria-label="Filter evaluasi kanal" value={review} onChange={event => { setReview(event.target.value); setPage(0); }}>
          <option value="">Semua aktivasi</option><option value="open">Belum selesai dievaluasi</option><option value="overdue">Evaluasi terlambat</option><option value="evaluated">Sudah dievaluasi</option>
        </select>
      </div>
      {query.isPending && <p role="status" className="text-sm">Memuat aktivasi…</p>}
      {query.isError && <p role="alert" className="text-sm text-red-700">{errorText(query.error)}</p>}
      {query.isSuccess && !query.data.length && <p className="text-sm text-slate-600">Tidak ada aktivasi pada filter ini.</p>}
      <ul className="divide-y divide-slate-200">
        {query.data?.slice(0, PAGE_SIZE).map(row => {
          const overdue = row.review_on < today && !['evaluated', 'cancelled'].includes(row.status);
          return <li key={row.id} className="flex flex-wrap justify-between gap-3 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="break-words font-semibold">{row.name}</h3>
              <p className="text-sm text-slate-600">{row.campaign?.name} · {channelPlatforms[row.platform]}{row.account?.handle || row.channel_name ? ' · ' + (row.account?.handle ?? row.channel_name) : ''} · {row.distribution === 'paid' ? 'Berbayar' : 'Organik'}</p>
              <p className={'text-sm ' + (overdue ? 'font-semibold text-rose-700' : 'text-slate-700')}>{channelStatus[row.status]} · Evaluasi {date(row.review_on)}{overdue ? ' (terlambat)' : ''} · {members.find(member => member.id === row.assignee_id)?.full_name ?? 'Belum ada PIC'}</p>
              <p className="text-sm">{metrics[row.metric]}: {number.format(row.actual_result)} / {number.format(row.target_result)}{row.target_result ? ' (' + Math.round(row.actual_result * 100 / row.target_result) + '%)' : ''}</p>
              {row.distribution === 'paid' && <p className="text-sm">Belanja {rupiah.format(row.spent_idr)} / {rupiah.format(row.budget_idr)}{row.actual_result > 0 ? ' · ' + rupiah.format(row.spent_idr / row.actual_result) + ' per hasil' : ''}</p>}
              {row.decision && <p className="text-sm font-semibold text-teal-800">{decisions[row.decision]}</p>}
              {row.evaluation && <details className="text-sm"><summary className="cursor-pointer">Catatan evaluasi</summary><p className="whitespace-pre-wrap break-words">{row.evaluation}</p></details>}
            </div>
            {canEdit && <div className="flex flex-wrap gap-2 self-start">
              <button className={button} onClick={() => { setFollowup(null); openEditor(row); }}>Edit / evaluasi</button>
              {row.status === 'evaluated' && <button className={button} onClick={() => {
                setEditor(null); setFollowup(row); document.getElementById('channel-hub')?.scrollIntoView({ block: 'start' });
              }}>Buat / buka tindak lanjut</button>}
            </div>}
          </li>;
        })}
      </ul>
      {(page > 0 || (query.data?.length ?? 0) > PAGE_SIZE) && <div className="flex flex-wrap gap-2">
        <button className={button} disabled={!page} onClick={() => setPage(page - 1)}>Sebelumnya</button>
        <button className={button} disabled={(query.data?.length ?? 0) <= PAGE_SIZE} onClick={() => setPage(page + 1)}>Berikutnya</button>
      </div>}
    </div>
  </section>;
}
