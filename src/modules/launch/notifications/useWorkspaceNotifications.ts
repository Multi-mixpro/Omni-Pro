import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isDemoText } from '../creative/repository';

export type NotificationCategory = 'discussion' | 'task' | 'update';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  workspace: 'creative' | 'launch';
  badgeLabel: string;
  title: string;
  body: string;
  createdAt: string;
  targetSection?: string;
  targetId?: string;
  articleId?: string;
  campaignId?: string;
  taskId?: string;
}

export interface CreativeMenuBadges {
  overview: number;
  inbox: number;
  ideas: number;
  campaigns: number;
  work: number;
  studio: number;
  decisions: number;
  calendar: number;
  ads: number;
  campaignDiscussions: Record<string, number>;
  taskDiscussions: Record<string, number>;
}

export interface LaunchMenuBadges {
  dashboard: number;
  pipeline: number;
  implementation: number;
  tasks: number;
  approvals: number;
  calendar: number;
  articleDiscussions: Record<string, number>;
}

const READ_IDS_STORAGE_KEY = 'mix_pro_read_notifications_v1';
const LAST_CLEARED_AT_KEY = 'mix_pro_notifications_cleared_at_v1';

function getReadSet(userId: string): Set<string> {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(`${READ_IDS_STORAGE_KEY}:${userId}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadSet(userId: string, set: Set<string>) {
  if (!userId) return;
  try {
    const arr = Array.from(set).slice(-500);
    localStorage.setItem(`${READ_IDS_STORAGE_KEY}:${userId}`, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

function getClearedAt(userId: string): string {
  if (!userId) return '';
  try {
    return localStorage.getItem(`${LAST_CLEARED_AT_KEY}:${userId}`) ?? '';
  } catch {
    return '';
  }
}

type AuthorJoin = { full_name?: string } | { full_name?: string }[] | null;
function authorNameOf(author: AuthorJoin): string {
  if (!author) return 'Tim';
  const obj = Array.isArray(author) ? author[0] : author;
  return obj?.full_name || 'Tim';
}

async function safeSelect<T>(promise: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  try {
    const { data, error } = await promise;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function fetchWorkspaceNotifications(userId: string, signal?: AbortSignal) {
  const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

  const [
    taskComments,
    campaignComments,
    articleComments,
    creativeTasks,
    creativeEvents,
    creativeIdeas,
    creativeActivations,
    launchTasks,
    launchBlockers,
    launchApprovals,
    launchUpdates,
  ] = await Promise.all([
    safeSelect<{
      id: string;
      task_id: string;
      body: string;
      created_at: string;
      author_id: string;
      author: AuthorJoin;
      task: { title?: string } | { title?: string }[] | null;
    }>(
      supabase
        .from('creative_task_comments')
        .select('id,task_id,body,created_at,author_id,author:profiles!creative_task_comments_author_id_fkey(full_name),task:creative_tasks(title)')
        .order('created_at', { ascending: false })
        .limit(25)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      campaign_id: string;
      body: string;
      created_at: string;
      author_id: string;
      author: AuthorJoin;
      campaign: { name?: string } | { name?: string }[] | null;
    }>(
      supabase
        .from('creative_campaign_comments')
        .select('id,campaign_id,body,created_at,author_id,author:profiles!creative_campaign_comments_author_id_fkey(full_name),campaign:creative_campaigns(name)')
        .order('created_at', { ascending: false })
        .limit(25)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      project_id: string;
      body: string;
      is_decision_request: boolean;
      decision_status: string | null;
      created_at: string;
      author_id: string;
      author: AuthorJoin;
      project: { code?: string; article_name?: string } | { code?: string; article_name?: string }[] | null;
    }>(
      supabase
        .from('launch_comments')
        .select('id,project_id,body,is_decision_request,decision_status,created_at,author_id,author:profiles!launch_comments_author_id_fkey(full_name),project:launch_projects(code,article_name)')
        .order('created_at', { ascending: false })
        .limit(30)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      title: string;
      status: string;
      priority: string;
      assignee_id: string | null;
      reviewer_id: string | null;
      approver_id: string | null;
      approved_at: string | null;
      due_on: string | null;
      publish_on: string | null;
      blocker: string | null;
      updated_at: string;
    }>(
      supabase
        .from('creative_tasks')
        .select('id,title,status,priority,assignee_id,reviewer_id,approver_id,approved_at,due_on,publish_on,blocker,updated_at')
        .not('status', 'in', '(cancelled)')
        .order('updated_at', { ascending: false })
        .limit(40)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      task_id: string;
      kind: string;
      detail: string;
      recipient_id: string | null;
      created_at: string;
      task: { title?: string } | { title?: string }[] | null;
    }>(
      supabase
        .from('creative_task_events')
        .select('id,task_id,kind,detail,recipient_id,created_at,task:creative_tasks(title)')
        .order('created_at', { ascending: false })
        .limit(25)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      title: string;
      queue_state: string;
      updated_at: string;
    }>(
      supabase
        .from('creative_ideas')
        .select('id,title,queue_state,updated_at')
        .eq('queue_state', 'ready')
        .order('updated_at', { ascending: false })
        .limit(20)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      name: string;
      status: string;
      review_on: string;
      updated_at: string;
    }>(
      supabase
        .from('creative_channel_activations')
        .select('id,name,status,review_on,updated_at')
        .not('status', 'in', '(evaluated,cancelled)')
        .order('review_on', { ascending: true })
        .limit(20)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      project_id: string;
      title: string;
      status: string;
      priority: string;
      assignee_id: string | null;
      due_date: string | null;
      updated_at: string;
      created_at: string;
    }>(
      supabase
        .from('launch_tasks')
        .select('id,project_id,title,status,priority,assignee_id,due_date,updated_at,created_at')
        .neq('status', 'DONE')
        .order('created_at', { ascending: false })
        .limit(25)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      project_id: string;
      blocker_type: string;
      description: string;
      status: string;
      created_at: string;
    }>(
      supabase
        .from('launch_blockers')
        .select('id,project_id,blocker_type,description,status,created_at')
        .neq('status', 'RESOLVED')
        .order('created_at', { ascending: false })
        .limit(20)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      project_id: string;
      approval_type: string;
      status: string;
      requested_at: string;
    }>(
      supabase
        .from('launch_approvals')
        .select('id,project_id,approval_type,status,requested_at')
        .eq('status', 'PENDING')
        .order('requested_at', { ascending: false })
        .limit(20)
        .abortSignal(signal as AbortSignal),
    ),
    safeSelect<{
      id: string;
      project_id: string;
      update_type: string;
      current_text: string | null;
      completed_text: string | null;
      created_at: string;
      author: AuthorJoin;
    }>(
      supabase
        .from('launch_progress_updates')
        .select('id,project_id,update_type,current_text,completed_text,created_at,author:profiles!launch_progress_updates_author_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(20)
        .abortSignal(signal as AbortSignal),
    ),
  ]);

  const items: NotificationItem[] = [];
  const campaignDiscussions: Record<string, number> = {};
  const taskDiscussions: Record<string, number> = {};
  const articleDiscussions: Record<string, number> = {};

  // 1. Creative Task Discussions
  for (const c of taskComments) {
    const taskObj = Array.isArray(c.task) ? c.task[0] : c.task;
    const taskTitle = taskObj?.title ?? 'Tugas Creative';
    if (isDemoText(taskTitle) || isDemoText(c.body)) continue;
    taskDiscussions[c.task_id] = (taskDiscussions[c.task_id] ?? 0) + 1;
    items.push({
      id: `disc-task-${c.id}`,
      category: 'discussion',
      workspace: 'creative',
      badgeLabel: 'Diskusi Tugas',
      title: `${authorNameOf(c.author)} mengomentari "${taskTitle}"`,
      body: c.body,
      createdAt: c.created_at,
      targetSection: 'work',
      taskId: c.task_id,
    });
  }

  // 2. Creative Campaign Discussions
  for (const c of campaignComments) {
    const campObj = Array.isArray(c.campaign) ? c.campaign[0] : c.campaign;
    const campName = campObj?.name ?? 'Kampanye Creative';
    if (isDemoText(campName) || isDemoText(c.body)) continue;
    campaignDiscussions[c.campaign_id] = (campaignDiscussions[c.campaign_id] ?? 0) + 1;
    items.push({
      id: `disc-camp-${c.id}`,
      category: 'discussion',
      workspace: 'creative',
      badgeLabel: 'Diskusi Kampanye',
      title: `${authorNameOf(c.author)} di kampanye "${campName}"`,
      body: c.body,
      createdAt: c.created_at,
      targetSection: 'campaigns',
      campaignId: c.campaign_id,
    });
  }

  // 3. Launch Article Discussions & Decisions
  for (const c of articleComments) {
    const projObj = Array.isArray(c.project) ? c.project[0] : c.project;
    const label = projObj?.code ? `${projObj.code} · ${projObj.article_name ?? ''}` : 'Artikel';
    if (isDemoText(label) || isDemoText(c.body)) continue;
    if (c.is_decision_request) {
      if (String(c.decision_status ?? '').toUpperCase() !== 'DECIDED') {
        items.push({
          id: `dec-art-${c.id}`,
          category: 'update',
          workspace: 'launch',
          badgeLabel: 'Butuh Keputusan',
          title: `Permintaan keputusan pada ${label}`,
          body: c.body,
          createdAt: c.created_at,
          targetSection: 'tasks',
          articleId: c.project_id,
        });
      }
    } else {
      articleDiscussions[c.project_id] = (articleDiscussions[c.project_id] ?? 0) + 1;
      items.push({
        id: `disc-art-${c.id}`,
        category: 'discussion',
        workspace: 'launch',
        badgeLabel: 'Diskusi Artikel',
        title: `${authorNameOf(c.author)} berdiskusi di ${label}`,
        body: c.body,
        createdAt: c.created_at,
        targetSection: 'discussion',
        articleId: c.project_id,
      });
    }
  }

  // 4. Creative Tasks & Reviews
  const validCreativeTasks = creativeTasks.filter(t => !isDemoText(t.title));
  for (const t of validCreativeTasks) {
    const isOverdue = Boolean(t.due_on && t.due_on < today && t.status !== 'done');
    const isWaitingReview = t.status === 'review' || (t.status === 'ready' && t.approver_id && !t.approved_at);
    if (t.status === 'blocked' || isOverdue) {
      items.push({
        id: `task-alert-${t.id}-${t.status}`,
        category: 'task',
        workspace: 'creative',
        badgeLabel: t.status === 'blocked' ? 'Tugas Terhambat' : 'Lewat Deadline',
        title: t.title,
        body: t.blocker ? `Hambatan: ${t.blocker}` : `Deadline: ${t.due_on ?? 'Segera'} · Status: ${t.status.toUpperCase()}`,
        createdAt: t.updated_at,
        targetSection: 'work',
        taskId: t.id,
      });
    } else if (isWaitingReview) {
      items.push({
        id: `task-rev-${t.id}-${t.updated_at}`,
        category: 'update',
        workspace: 'creative',
        badgeLabel: t.status === 'review' ? 'Menunggu Review' : 'Menunggu Approval',
        title: t.title,
        body: t.status === 'review' ? 'Tugas diajukan untuk direview.' : 'Tugas siap tayang menunggu persetujuan akhir.',
        createdAt: t.updated_at,
        targetSection: 'decisions',
        taskId: t.id,
      });
    } else if (t.status !== 'done') {
      items.push({
        id: `task-active-${t.id}`,
        category: 'task',
        workspace: 'creative',
        badgeLabel: t.assignee_id === userId ? 'Tugas Saya' : 'Tugas Creative',
        title: t.title,
        body: `Status: ${t.status.toUpperCase()}${t.due_on ? ` · Deadline ${t.due_on}` : ''}`,
        createdAt: t.updated_at,
        targetSection: 'work',
        taskId: t.id,
      });
    }
  }

  // 5. Creative Task Events (Nudges, Publications, Status updates)
  for (const ev of creativeEvents) {
    const taskObj = Array.isArray(ev.task) ? ev.task[0] : ev.task;
    const taskTitle = taskObj?.title ?? 'Tugas Creative';
    if (isDemoText(taskTitle) || isDemoText(ev.detail)) continue;
    if (ev.kind === 'nudge') {
      items.push({
        id: `ev-nudge-${ev.id}`,
        category: 'task',
        workspace: 'creative',
        badgeLabel: 'Tindak Lanjut',
        title: `Permintaan tindak lanjut: "${taskTitle}"`,
        body: ev.detail,
        createdAt: ev.created_at,
        targetSection: 'inbox',
        taskId: ev.task_id,
      });
    } else {
      items.push({
        id: `ev-upd-${ev.id}`,
        category: 'update',
        workspace: 'creative',
        badgeLabel: ev.kind === 'publication' ? 'Bukti Tayang' : 'Update Tugas',
        title: taskTitle,
        body: ev.detail,
        createdAt: ev.created_at,
        targetSection: 'work',
        taskId: ev.task_id,
      });
    }
  }

  // 6. Creative Channel Activations
  const validActivations = creativeActivations.filter(a => !isDemoText(a.name));
  for (const act of validActivations) {
    if (act.review_on <= today || act.status === 'review') {
      items.push({
        id: `act-eval-${act.id}`,
        category: 'update',
        workspace: 'creative',
        badgeLabel: act.review_on < today ? 'Evaluasi Terlambat' : 'Evaluasi Kanal',
        title: act.name,
        body: `Jadwal evaluasi kanal: ${act.review_on}`,
        createdAt: act.updated_at,
        targetSection: 'ads',
        targetId: act.id,
      });
    }
  }

  // 7. Launch Tasks & Blockers
  for (const b of launchBlockers) {
    items.push({
      id: `launch-blk-${b.id}`,
      category: 'task',
      workspace: 'launch',
      badgeLabel: 'Blocker Artikel',
      title: `Hambatan: ${b.blocker_type}`,
      body: b.description,
      createdAt: b.created_at,
      targetSection: 'tasks',
      articleId: b.project_id,
    });
  }

  for (const lt of launchTasks) {
    items.push({
      id: `launch-tsk-${lt.id}`,
      category: 'task',
      workspace: 'launch',
      badgeLabel: lt.assignee_id === userId ? 'Tugas Artikel Saya' : 'Tugas Artikel',
      title: lt.title,
      body: `Status: ${lt.status}${lt.due_date ? ` · Target ${lt.due_date}` : ''}`,
      createdAt: lt.updated_at || lt.created_at,
      targetSection: 'tasks',
      articleId: lt.project_id,
    });
  }

  // 8. Launch Approvals & Progress Updates
  for (const app of launchApprovals) {
    items.push({
      id: `launch-app-${app.id}`,
      category: 'update',
      workspace: 'launch',
      badgeLabel: 'Approval Gate',
      title: `Menunggu Approval: ${app.approval_type}`,
      body: 'Membutuhkan tinjauan dan keputusan pada Approvals Gate.',
      createdAt: app.requested_at,
      targetSection: 'approvals',
      articleId: app.project_id,
    });
  }

  for (const upd of launchUpdates) {
    const text = upd.completed_text || upd.current_text || 'Update progres artikel';
    items.push({
      id: `launch-upd-${upd.id}`,
      category: 'update',
      workspace: 'launch',
      badgeLabel: 'Update Artikel',
      title: `${authorNameOf(upd.author)} memperbarui progres`,
      body: text,
      createdAt: upd.created_at,
      targetSection: 'implementation',
      articleId: upd.project_id,
    });
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const validIdeas = creativeIdeas.filter(i => !isDemoText(i.title));
  const activeCreativeTasks = validCreativeTasks.filter(t => t.status !== 'done');
  const blockedOrOverdueCreative = activeCreativeTasks.filter(
    t => t.status === 'blocked' || (t.due_on && t.due_on < today),
  );
  const reviewOrApprovalCreative = activeCreativeTasks.filter(
    t => t.status === 'review' || (t.status === 'ready' && t.approver_id && !t.approved_at),
  );
  const scheduledCreative = activeCreativeTasks.filter(
    t => Boolean(t.due_on || t.publish_on),
  );
  const totalTaskComments = Object.values(taskDiscussions).reduce((a, b) => a + b, 0);
  const totalCampaignComments = Object.values(campaignDiscussions).reduce((a, b) => a + b, 0);
  const totalArticleComments = Object.values(articleDiscussions).reduce((a, b) => a + b, 0);
  const nudgeCount = creativeEvents.filter(e => e.kind === 'nudge' && (!e.recipient_id || e.recipient_id === userId)).length;

  const creativeBadges: CreativeMenuBadges = {
    overview: blockedOrOverdueCreative.length + reviewOrApprovalCreative.length,
    inbox: nudgeCount + blockedOrOverdueCreative.length + totalTaskComments,
    ideas: validIdeas.length,
    campaigns: totalCampaignComments,
    work: activeCreativeTasks.length,
    studio: activeCreativeTasks.filter(t => t.status === 'todo' || t.status === 'doing' || t.status === 'review').length,
    decisions: reviewOrApprovalCreative.length,
    calendar: scheduledCreative.length,
    ads: validActivations.length,
    campaignDiscussions,
    taskDiscussions,
  };

  const launchBadges: LaunchMenuBadges = {
    dashboard: launchBlockers.length + launchApprovals.length + totalArticleComments,
    pipeline: totalArticleComments,
    implementation: launchUpdates.length,
    tasks: launchTasks.length + launchBlockers.length,
    approvals: launchApprovals.length,
    calendar: launchTasks.filter(t => Boolean(t.due_date)).length,
    articleDiscussions,
  };

  return {
    items,
    creativeBadges,
    launchBadges,
  };
}

export function useWorkspaceNotifications(userId?: string) {
  const uid = userId ?? 'anon';
  const queryClient = useQueryClient();
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadSet(uid));
  const [clearedAt, setClearedAt] = useState<string>(() => getClearedAt(uid));

  useEffect(() => {
    setReadIds(getReadSet(uid));
    setClearedAt(getClearedAt(uid));
  }, [uid]);

  const query = useQuery({
    queryKey: ['workspace-notifications', uid],
    enabled: Boolean(userId),
    queryFn: ({ signal }) => fetchWorkspaceNotifications(uid, signal),
    staleTime: 20_000,
    refetchInterval: 45_000,
  });

  // Subscribe to realtime changes on discussions, tasks, and updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`workspace-notif-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_task_comments' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['workspace-notifications'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_campaign_comments' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['workspace-notifications'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'launch_comments' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['workspace-notifications'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_tasks' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['workspace-notifications'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_task_events' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['workspace-notifications'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'launch_tasks' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['workspace-notifications'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'launch_approvals' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['workspace-notifications'] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const isUnread = useCallback(
    (item: NotificationItem) => {
      if (readIds.has(item.id)) return false;
      if (clearedAt && item.createdAt && new Date(item.createdAt).getTime() <= new Date(clearedAt).getTime()) {
        return false;
      }
      return true;
    },
    [readIds, clearedAt],
  );

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds(prev => {
        const next = new Set(prev);
        next.add(id);
        saveReadSet(uid, next);
        return next;
      });
    },
    [uid],
  );

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setClearedAt(now);
    try {
      localStorage.setItem(`${LAST_CLEARED_AT_KEY}:${uid}`, now);
    } catch {
      /* ignore */
    }
    if (query.data?.items.length) {
      setReadIds(prev => {
        const next = new Set(prev);
        for (const item of query.data!.items) next.add(item.id);
        saveReadSet(uid, next);
        return next;
      });
    }
  }, [uid, query.data]);

  const allItems = useMemo(() => query.data?.items ?? [], [query.data]);
  const unreadItems = useMemo(() => allItems.filter(isUnread), [allItems, isUnread]);

  const countsByCategory = useMemo(() => {
    const discussion = unreadItems.filter(i => i.category === 'discussion').length;
    const task = unreadItems.filter(i => i.category === 'task').length;
    const update = unreadItems.filter(i => i.category === 'update').length;
    return {
      all: unreadItems.length,
      discussion,
      task,
      update,
    };
  }, [unreadItems]);

  return {
    items: allItems,
    unreadItems,
    countsByCategory,
    creativeBadges: query.data?.creativeBadges,
    launchBadges: query.data?.launchBadges,
    isUnread,
    markAsRead,
    markAllAsRead,
    isLoading: query.isPending,
    refetch: query.refetch,
  };
}
