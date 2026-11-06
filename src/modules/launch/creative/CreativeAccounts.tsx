import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceUnits, type WorkspaceUnit } from '../data/businessWorkspace';
import { button, Editor, errorText, field, Label, Options, People, primary } from './CreativeForms';
import { channelActivations, channelPlatforms, channelStatus, metrics } from './channelRepository';
import { accounts, accountSnapshots, publications, publicationSnapshots, savePublicationSnapshot, saveAccount, saveSnapshot, type SocialAccount, type Snapshot, type Publication } from './commandRepository';
import { PAGE_SIZE, safeOutputUrl, type TeamMember } from './repository';
import { AccountIdentity } from './AccountIdentity';

const panel = 'rounded-xl border border-slate-200 bg-white p-4';
const value = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const format = new Intl.NumberFormat('id-ID');
const time = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
const metric = (number: number | null) => number === null ? '—' : format.format(number);
const rupiah = new Intl.NumberFormat('id-ID',{ style:'currency',currency:'IDR',maximumFractionDigits:0 });

export function PublicationList({ items, onSelect }: { items: Publication[]; onSelect?: (item: Publication) => void }) {
  return <ul className="space-y-2">{items.map(row => <li key={row.id} className="text-sm">
    <a className="font-semibold text-teal-800 underline" href={safeOutputUrl(row.published_url) || undefined} target="_blank" rel="noopener noreferrer">Buka hasil tayang</a>
    <span className="text-slate-600"> · {row.account?.handle ?? 'Akun'} · {time.format(new Date(row.published_at))} WIB</span>
    {onSelect && <button className={button + ' ml-2'} onClick={() => onSelect(row)}>Performa konten</button>}
  </li>)}</ul>;
}

function PostHistory({ post, userId, today, canEdit }: { post: Publication; userId: string; today: string; canEdit: boolean }) {
  const [page,setPage]=useState(0);
  const [adding,setAdding]=useState(false);
  const client=useQueryClient();
  const key=['creative',userId,'post-snapshots',post.id];
  const query=useQuery({ queryKey:[...key,page],queryFn:({signal})=>publicationSnapshots(post.id,page,signal) });
  return <section className="space-y-3 rounded-lg border border-slate-200 p-3" aria-label="Performa konten terpilih">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="font-bold">Performa konten · {time.format(new Date(post.published_at))} WIB</h4>
      {canEdit && <button className={button} onClick={()=>setAdding(true)}>Catat hasil konten</button>}
    </div>
    {adding && <Editor title="Hasil konten per periode" onCancel={()=>setAdding(false)}
      onSaved={()=>{setAdding(false);setPage(0);void client.invalidateQueries({queryKey:key});}}
      onSave={data=>{
        const start=value(data,'start'),end=value(data,'end');
        const min=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta'}).format(new Date(post.published_at));
        if (!start||!end||start<min||start>end||end>today) throw new Error('Periode harus berada di antara tanggal tayang dan hari ini.');
        const number=(key:string)=>value(data,key)===''?null:Number(value(data,key));
        const draft={period_start:start,period_end:end,views:number('views'),reach:number('reach'),link_clicks:number('clicks')};
        if([draft.views,draft.reach,draft.link_clicks].every(x=>x===null))throw new Error('Isi minimal satu metrik.');
        return savePublicationSnapshot(post.id,draft);
      }}>
      <Label title="Awal periode"><input className={field} name="start" type="date" required max={today} /></Label>
      <Label title="Akhir periode"><input className={field} name="end" type="date" required defaultValue={today} max={today} /></Label>
      {[['views','Views'],['reach','Akun dijangkau'],['clicks','Klik tautan']].map(([key,label])=>
        <Label key={key} title={label}><input className={field} type="number" min={0} max={2147483647} name={key} /></Label>)}
    </Editor>}
    {query.isPending && <p role="status" className="text-sm">Memuat hasil konten…</p>}
    {query.isError && <p role="alert" className="text-sm text-red-700">{errorText(query.error)}</p>}
    {query.isSuccess && !query.data.length && <p className="text-sm text-slate-600">Belum ada hasil konten.</p>}
    <ul className="divide-y divide-slate-200">{query.data?.slice(0,PAGE_SIZE).map(row=><li className="py-2 text-sm" key={row.period_start+row.period_end}>
      <strong>{row.period_start} – {row.period_end}</strong><p>Views {metric(row.views)} · Jangkauan {metric(row.reach)} · Klik {metric(row.link_clicks)}</p>
    </li>)}</ul>
    <CreativePager page={page} next={(query.data?.length??0)>PAGE_SIZE} onPage={setPage}/>
  </section>;
}

export function CreativePager({ page, next, onPage }: { page: number; next: boolean; onPage: (page: number) => void }) {
  if (!page && !next) return null;
  return <div className="flex flex-wrap items-center gap-2">
    <button type="button" className={button} disabled={!page} onClick={() => onPage(page - 1)}>Sebelumnya</button><span className="text-sm">Halaman {page + 1}</span>
    <button type="button" className={button} disabled={!next} onClick={() => onPage(page + 1)}>Berikutnya</button>
  </div>;
}

function AccountHistory({ account, unit, userId, today, canEdit, onActivation }: {
  account: SocialAccount; unit?: WorkspaceUnit; userId: string; today: string; canEdit: boolean;
  onActivation: (id: string, campaignId: string) => void;
}) {
  const client = useQueryClient();
  const [mode, setMode] = useState<'metrics' | 'publications' | 'ads'>('metrics');
  const [selectedPost,setSelectedPost]=useState<Publication|null>(null);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(0);
  const key = ['creative', userId];
  const history = useQuery({
    queryKey: [...key, 'snapshots', account.id, page], queryFn: ({ signal }) => accountSnapshots(account.id, page, signal), enabled: mode === 'metrics',
  });
  const posts = useQuery({
    queryKey: [...key, 'publications', 'account', account.id, page], queryFn: ({ signal }) => publications('account_id', account.id, page, signal), enabled: mode === 'publications',
  });
  const ads = useQuery({ queryKey:[...key,'activations','account',account.id,page],
    queryFn:({signal})=>channelActivations('all','all',page,'','',today,signal,account.id),enabled:mode==='ads' });
  const current = mode === 'metrics' ? history : mode === 'publications' ? posts : ads;
  return <section className={panel + ' space-y-3'} aria-label={'Riwayat ' + account.handle}>
    <div className="flex flex-wrap items-center justify-between gap-2"><AccountIdentity account={account} unit={unit} />
      {canEdit && mode === 'metrics' && <button className={primary} onClick={() => setAdding(true)}>Catat metrik</button>}
    </div>
    <div className="flex flex-wrap gap-2">
      <button className={button} aria-pressed={mode === 'metrics'} onClick={() => { setMode('metrics'); setPage(0); }}>Performa</button>
      <button className={button} aria-pressed={mode === 'publications'} onClick={() => { setMode('publications'); setPage(0); setAdding(false); }}>Konten tayang</button>
      <button className={button} aria-pressed={mode === 'ads'} onClick={() => { setMode('ads'); setPage(0); setAdding(false); }}>Iklan &amp; aktivasi</button>
    </div>
    {adding && <Editor title="Snapshot dari laporan platform" onCancel={() => setAdding(false)} onSaved={() => {
      setAdding(false); setPage(0); void client.invalidateQueries({ queryKey: [...key, 'snapshots', account.id] });
    }} onSave={data => {
      const start = value(data, 'start'), end = value(data, 'end');
      if (!start || !end || start > end || end > today) throw new Error('Pilih periode laporan yang valid sampai hari ini.');
      const numeric = (key: string) => value(data, key) === '' ? null : Number(value(data, key));
      const draft: Snapshot = { period_start: start, period_end: end, source: 'platform',
        followers: numeric('followers'), views: numeric('views'), reach: numeric('reach'), link_clicks: numeric('clicks') };
      if ([draft.followers,draft.views,draft.reach,draft.link_clicks].every(x => x === null)) throw new Error('Isi minimal satu metrik.');
      return saveSnapshot(account.id, draft);
    }}>
      <Label title="Awal periode"><input className={field} name="start" type="date" max={today} required /></Label>
      <Label title="Akhir periode"><input className={field} name="end" type="date" max={today} defaultValue={today} required /></Label>
      {[['followers','Pengikut akhir periode'],['views','Views'],['reach','Akun dijangkau'],['clicks','Klik tautan']].map(([key, label]) =>
        <Label key={key} title={label}><input className={field} name={key} type="number" min={0} max={2147483647} placeholder="Kosong jika belum tersedia" /></Label>)}
    </Editor>}
    {current.isPending && <p role="status" className="text-sm">Memuat riwayat…</p>}
    {current.isError && <p role="alert" className="text-sm text-red-700">{errorText(current.error)}</p>}
    {current.isSuccess && !current.data.length && <p className="text-sm text-slate-600">Belum ada catatan.</p>}
    {mode === 'metrics' && !!history.data?.length && <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead><tr className="border-b border-slate-200 text-slate-700">{['Periode / sumber','Pengikut','Views','Jangkauan','Klik tautan'].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead>
        <tbody>{history.data.slice(0,PAGE_SIZE).map((row,index) => {
          const earlier = history.data.slice(index + 1).find(item => item.source === row.source && item.period_end < row.period_start && item.followers !== null);
          const delta = row.followers !== null && earlier?.followers != null ? row.followers - earlier.followers : null;
          return <tr key={row.period_start + row.period_end + row.source} className="border-b border-slate-100">
            <th scope="row" className="p-2 font-medium">{row.period_start} – {row.period_end}<br /><span className="text-xs text-slate-600">{row.source === 'platform' ? 'Laporan platform' : 'CSV'}</span></th>
            <td className="p-2">{metric(row.followers)}{delta !== null && <span className="block text-xs text-teal-800">{delta > 0 ? '+' : ''}{format.format(delta)} vs periode sebelumnya</span>}</td>
            <td className="p-2">{metric(row.views)}</td><td className="p-2">{metric(row.reach)}</td><td className="p-2">{metric(row.link_clicks)}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
    {mode === 'publications' && <><PublicationList items={posts.data?.slice(0,PAGE_SIZE) ?? []} onSelect={setSelectedPost} />
      {selectedPost && <PostHistory key={selectedPost.id} post={selectedPost} userId={userId} today={today} canEdit={canEdit} />}</>}
    {mode === 'ads' && <ul className="divide-y divide-slate-200">{ads.data?.slice(0,PAGE_SIZE).map(row => <li key={row.id} className="py-2 text-sm">
      <strong>{row.name}</strong><p>{row.campaign?.name} · {channelStatus[row.status]} · Evaluasi {row.review_on}</p>
      <p>{metrics[row.metric]} {format.format(row.actual_result)} / {format.format(row.target_result)}{row.distribution === 'paid' ? ' · Belanja '+rupiah.format(row.spent_idr)+' / '+rupiah.format(row.budget_idr) : ' · Organik'}</p>
      <button type="button" className={`${button} mt-2`} onClick={() => onActivation(row.id, row.campaign_id)}>Buka evaluasi</button>
    </li>)}</ul>}
    <CreativePager page={page} next={(current.data?.length ?? 0)>PAGE_SIZE} onPage={next=>{setPage(next);setSelectedPost(null);}} />
  </section>;
}

export function CreativeAccounts({ userId, unit, today, canEdit, members, onActivation }: {
  userId: string; unit: string; today: string; canEdit: boolean; members: TeamMember[];
  onActivation: (id: string, campaignId: string) => void;
}) {
  const client = useQueryClient();
  const units = useWorkspaceUnits();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [editor, setEditor] = useState<SocialAccount | 'new' | null>(null);
  const [platform, setPlatform] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState('');
  const historyAnchor = useRef<HTMLDivElement>(null);
  const query = useQuery({ queryKey: ['creative', userId, 'accounts', unit, page, platform, activeOnly, search],
    queryFn: ({ signal }) => accounts(unit, page, signal, activeOnly, platform, search) });
  const row = editor === 'new' ? undefined : editor ?? undefined;
  const current = query.data?.find(item => item.id === selected);
  const currentId = current?.id;
  useEffect(() => { if (currentId) historyAnchor.current?.focus(); }, [currentId]);
  return <div className="space-y-3">
    <section className={panel + ' space-y-3'} aria-label="Akun dan performa">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-lg font-bold">Akun &amp; Performa</h2><p className="text-sm text-slate-600">Pilih akun untuk melihat riwayat pengikut, views, klik, dan bukti tayang.</p></div>
        {canEdit && unit !== 'unassigned' && <button className={primary} onClick={() => setEditor('new')}>Tambah akun</button>}
      </div>
      <div className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Label title="Cari akun"><input className={field} type="search" value={search} maxLength={100} placeholder="Nama atau handle"
          onChange={event => { setSearch(event.target.value); setPage(0); setSelected(null); }} /></Label>
        <Label title="Platform"><select className={field} value={platform} onChange={event => { setPlatform(event.target.value); setPage(0); setSelected(null); }}>
          <option value="">Semua platform</option><Options values={channelPlatforms} />
        </select></Label>
        <label className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" checked={activeOnly}
          onChange={event => { setActiveOnly(event.target.checked); setPage(0); setSelected(null); }} /> Hanya akun aktif</label>
      </div>
      {editor && <Editor key={row?.id ?? 'new'} title={row ? 'Edit akun kanal' : 'Akun kanal baru'} onCancel={() => setEditor(null)}
        onSaved={() => { setEditor(null); void client.invalidateQueries({ queryKey: ['creative', userId, 'accounts'] }); }}
        onSave={data => {
          const input = value(data, 'url'), url = safeOutputUrl(input);
          if (input && !url) throw new Error('Gunakan URL profil HTTP atau HTTPS yang valid.');
          return saveAccount({ business_unit_id: row?.business_unit_id ?? value(data,'unit'),
            handle: value(data,'handle'), platform: (row?.platform ?? value(data,'platform')) as SocialAccount['platform'],
            profile_url: url, owner_id: value(data,'person') || null, is_active: data.has('active') }, row);
        }}>
        {!row && <Label title="Unit bisnis"><select name="unit" className={field} defaultValue={unit !== 'all' ? unit : ''} required>
          <option value="">Pilih unit</option>{units.data?.filter(item => item.is_active).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Label>}
        {!row && <Label title="Platform"><select name="platform" className={field}><Options values={channelPlatforms} /></select></Label>}
        <Label title="Handle / nama akun"><input name="handle" className={field} maxLength={100} required defaultValue={row?.handle} /></Label>
        <Label title="Tautan profil"><input name="url" className={field} type="url" maxLength={1024} defaultValue={row?.profile_url} /></Label>
        <Label title="PIC akun"><People members={members} current={row?.owner_id} /></Label>
        <label className="flex items-center gap-2 text-sm"><input name="active" type="checkbox" defaultChecked={row?.is_active ?? true} /> Akun aktif</label>
      </Editor>}
      {query.isPending && <p role="status" className="text-sm">Memuat akun…</p>}
      {query.isError && <p role="alert" className="text-sm text-red-700">{errorText(query.error)}</p>}
      {query.isSuccess && !query.data.length && <p className="text-sm text-slate-600">{search || platform || activeOnly ? 'Tidak ada akun yang cocok dengan filter.' : 'Belum ada akun pada unit ini.'}</p>}
      <ul className="grid gap-2 sm:grid-cols-2">{query.data?.slice(0,PAGE_SIZE).map(item => <li className="space-y-2 rounded-lg border border-slate-200 p-3" key={item.id}>
        <AccountIdentity account={item} unit={units.data?.find(row => row.id === item.business_unit_id)} />
        <p className="text-sm text-slate-600">PIC: {members.find(member => member.id === item.owner_id)?.full_name ?? 'Belum ditetapkan'}</p>
        <div className="flex flex-wrap gap-2"><button className={selected === item.id ? primary : button} aria-expanded={selected === item.id} onClick={() => setSelected(selected === item.id ? null : item.id)}>{selected === item.id ? 'Tutup riwayat' : 'Lihat performa'}</button>
          {canEdit && <button className={button} onClick={() => setEditor(item)}>Edit</button>}
          {safeOutputUrl(item.profile_url) && <a className={button} href={safeOutputUrl(item.profile_url)} target="_blank" rel="noopener noreferrer">Profil</a>}</div>
      </li>)}</ul>
      <CreativePager page={page} next={(query.data?.length ?? 0)>PAGE_SIZE} onPage={next => { setPage(next); setSelected(null); }} />
    </section>
    {current && <div ref={historyAnchor} tabIndex={-1} aria-label={`Performa ${current.handle}`}>
      <AccountHistory key={current.id} account={current} unit={units.data?.find(row => row.id === current.business_unit_id)}
        userId={userId} today={today} canEdit={canEdit} onActivation={onActivation} />
    </div>}
  </div>;
}
