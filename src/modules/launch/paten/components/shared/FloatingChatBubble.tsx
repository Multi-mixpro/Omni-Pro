import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  Send,
  Minimize2,
  GripVertical,
  Hash,
  Globe,
  ChevronDown,
  Search,
  X,
  Sparkles,
  Bookmark,
  AlertTriangle,
  Volume2,
  VolumeX,
  CheckCheck,
} from 'lucide-react';
import type { Article, ArticleComment } from '../../types';
import { addArticleComment, broadcastNewMessage } from '../../services/collaboration';
import { supabase } from '@/integrations/supabase/client';

type ChatChannel = 'all_feed' | 'global' | string;

interface FloatingChatBubbleProps {
  articles: Article[];
  selectedArticleId: string;
  onUpdateArticle: (updated: Article) => void;
  currentUser?: { id: string; name: string; avatarUrl?: string | null };
}

const STORAGE_KEY_GLOBAL_COMMENTS = 'mix_pro_launch_global_comments_v1';
const STORAGE_KEY_CHAT_POS = 'mix_pro_launch_chat_pos_v1';
const STORAGE_KEY_READ_IDS = 'mix_pro_chat_read_ids_v1';
const STORAGE_KEY_MUTED = 'mix_pro_chat_sound_muted_v1';

/** Web Audio API Synthesizer — Produces a loud, crisp, pleasant incoming message chime sound */
function playNotificationChime(muted = false) {
  if (muted) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      // Envelope: sharp attack, smooth ringing decay
      gain.gain.setValueAtTime(0.01, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Double chime: 880Hz (A5) -> 1320Hz (E6)
    playNote(880, now, 0.18);
    playNote(1320, now + 0.1, 0.35);
  } catch (err) {
    console.warn('Audio chime skipped by browser policy:', err);
  }
}

export const FloatingChatBubble: React.FC<FloatingChatBubbleProps> = ({
  articles,
  selectedArticleId,
  onUpdateArticle,
  currentUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [channel, setChannel] = useState<ChatChannel>('global');
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchCategory, setSearchCategory] = useState<'all' | 'keputusan' | 'blocker' | 'global' | 'articles'>('all');

  // Sound mute state
  const [soundMuted, setSoundMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    } catch {
      return false;
    }
  });

  // Track read comment IDs to calculate unread badge
  const [readCommentIds, setReadCommentIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_READ_IDS);
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    return new Set();
  });

  // Saved bubble position or default { x: 0, y: 0 } (bottom-right)
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT_POS);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return { x: 0, y: 0 };
  });

  // Global chat comments (outside individual articles)
  const [globalComments, setGlobalComments] = useState<ArticleComment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GLOBAL_COMMENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return [
      {
        id: 'init-global-1',
        authorName: 'Sistem Launch OS',
        authorAvatar: '',
        body: 'Selamat datang di Diskusi Tim! Gunakan saluran ini untuk koordinasi umum di luar artikel spesifik.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  });

  // Persist state locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GLOBAL_COMMENTS, JSON.stringify(globalComments));
    } catch {
      /* ignore */
    }
  }, [globalComments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT_POS, JSON.stringify(bubblePosition));
    } catch {
      /* ignore */
    }
  }, [bubblePosition]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(Array.from(readCommentIds)));
    } catch {
      /* ignore */
    }
  }, [readCommentIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MUTED, String(soundMuted));
    } catch {
      /* ignore */
    }
  }, [soundMuted]);

  const isDragging = useRef(false);
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const wasDragged = useRef(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Switch channel when selected article changes from parent
  useEffect(() => {
    if (selectedArticleId) setChannel(selectedArticleId);
  }, [selectedArticleId]);

  // Clamp helper for closed bubble (56x56) with Mobile BottomNav & Top Navbar guards
  const getClampedBubblePos = useCallback((posX: number, posY: number) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const bottomNavOffset = isMobile ? 84 : 16;
    const topNavbarGuard = isMobile ? 70 : 80;
    const maxX = Math.max(0, window.innerWidth - 56 - 16);
    const maxY = Math.max(0, window.innerHeight - 56 - topNavbarGuard - bottomNavOffset);
    return {
      x: Math.min(maxX, Math.max(0, posX)),
      y: Math.min(maxY, Math.max(0, posY)),
    };
  }, []);

  // Clamp helper for open panel (400x560) with Mobile guards
  const getClampedPanelPos = useCallback((posX: number, posY: number) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const bottomNavOffset = isMobile ? 84 : 16;
    const topNavbarGuard = isMobile ? 70 : 80;
    const w = Math.min(400, window.innerWidth - 24);
    const h = Math.min(560, window.innerHeight - topNavbarGuard - bottomNavOffset);
    const maxX = Math.max(0, window.innerWidth - w - 16);
    const maxY = Math.max(0, window.innerHeight - h - topNavbarGuard - bottomNavOffset);
    return {
      x: Math.min(maxX, Math.max(0, posX)),
      y: Math.min(maxY, Math.max(0, posY)),
    };
  }, []);

  // Compute active position to render
  const currentPosition = isOpen
    ? getClampedPanelPos(bubblePosition.x, bubblePosition.y)
    : getClampedBubblePos(bubblePosition.x, bubblePosition.y);

  const currentArticle = channel !== 'global' && channel !== 'all_feed'
    ? articles.find((a) => a.id === channel)
    : null;

  // Retrieve channel comments
  const getDisplayComments = (): (ArticleComment & { _sourceLabel?: string; _articleName?: string })[] => {
    if (channel === 'global') {
      return globalComments.map((c) => ({ ...c, _sourceLabel: 'Umum' }));
    }
    if (channel === 'all_feed') {
      const articleCmts = articles.flatMap((a) =>
        (a.teamComments || []).map((c) => ({ ...c, _sourceLabel: a.code, _articleName: a.name }))
      );
      const globalCmts = globalComments.map((c) => ({ ...c, _sourceLabel: 'Umum' }));
      return [...articleCmts, ...globalCmts].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
    return currentArticle?.teamComments
      ? [...currentArticle.teamComments]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map((c) => ({ ...c, _sourceLabel: currentArticle.code, _articleName: currentArticle.name }))
      : [];
  };

  const rawComments = getDisplayComments();

  // Cross-system comments pool for broad searching & unread calculation
  const allSystemComments: (ArticleComment & { _sourceLabel: string; _articleName?: string })[] = [
    ...globalComments.map((c) => ({ ...c, _sourceLabel: 'Umum' })),
    ...articles.flatMap((a) =>
      (a.teamComments || []).map((c) => ({
        ...c,
        _sourceLabel: a.code,
        _articleName: a.name,
      }))
    ),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Calculate unread comment count dynamically (does NOT accumulate endlessly)
  const isCommentUnread = useCallback((c: ArticleComment) => {
    if (readCommentIds.has(c.id)) return false;
    const author = c.authorName?.trim() || '';
    const myName = (currentUser?.name || 'Tim Launch').trim();
    if (author === myName || author === 'Anda') return false;
    return true;
  }, [readCommentIds, currentUser?.name]);

  const totalUnreadCount = allSystemComments.filter(isCommentUnread).length;

  const isSearchActive = searchQuery.trim().length > 0 || searchCategory !== 'all';
  const commentsToSearch = isSearchActive ? allSystemComments : rawComments;

  const queryTokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const filteredComments = commentsToSearch.filter((c) => {
    // Category Filter
    if (searchCategory === 'keputusan' && !c.body.toLowerCase().includes('keputusan') && !c.body.includes('📌')) return false;
    if (searchCategory === 'blocker' && !c.body.toLowerCase().includes('blocker') && !c.body.includes('🚨')) return false;
    if (searchCategory === 'global' && c._sourceLabel !== 'Umum') return false;
    if (searchCategory === 'articles' && c._sourceLabel === 'Umum') return false;

    if (queryTokens.length === 0) return true;

    // Search across body, author, article code, and article name
    const searchableText = `${c.body} ${c.authorName} ${c._sourceLabel || ''} ${c._articleName || ''}`.toLowerCase();
    return queryTokens.every((token) => searchableText.includes(token));
  });

  // Automatically mark displayed comments as READ when panel is OPEN
  useEffect(() => {
    if (!isOpen || rawComments.length === 0) return;
    const newRead = new Set(readCommentIds);
    let updated = false;

    for (const c of rawComments) {
      if (!newRead.has(c.id)) {
        newRead.add(c.id);
        updated = true;
      }
    }

    if (updated) {
      setReadCommentIds(newRead);
    }
  }, [isOpen, channel, rawComments, readCommentIds]);

  // Realtime Subscriptions (BroadcastChannel + Supabase Realtime)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('mix_pro_chat_realtime_channel');

    const handleBroadcastMsg = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_MESSAGE' && event.data.comment) {
        const incoming: ArticleComment & { projectId?: string } = event.data.comment;
        const isFromMe = incoming.authorName === (currentUser?.name || 'Tim Launch') || incoming.authorName === 'Anda';

        if (incoming.projectId === 'global') {
          setGlobalComments((prev) => {
            if (prev.some((c) => c.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        } else if (incoming.projectId) {
          const targetArt = articles.find((a) => a.id === incoming.projectId);
          if (targetArt) {
            if (!(targetArt.teamComments || []).some((c) => c.id === incoming.id)) {
              onUpdateArticle({
                ...targetArt,
                teamComments: [...(targetArt.teamComments || []), incoming],
                lastUpdated: new Date().toISOString(),
              });
            }
          }
        }

        // Play loud chime sound if incoming message is from someone else
        if (!isFromMe) {
          playNotificationChime(soundMuted);
        }
      }
    };

    bc.addEventListener('message', handleBroadcastMsg);

    // Supabase Realtime Subscription fallback
    const supabaseChannel = supabase
      .channel('public:launch_comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'launch_comments' },
        (payload) => {
          const newRow = payload.new;
          if (newRow && newRow.body) {
            const incoming: ArticleComment & { projectId?: string } = {
              id: String(newRow.id),
              authorName: 'Tim Launch',
              authorAvatar: '',
              body: String(newRow.body),
              createdAt: String(newRow.created_at || new Date().toISOString()),
              projectId: String(newRow.project_id || 'global'),
            };

            const isFromMe = incoming.authorName === (currentUser?.name || 'Tim Launch');
            if (incoming.projectId === 'global') {
              setGlobalComments((prev) => {
                if (prev.some((c) => c.id === incoming.id)) return prev;
                return [...prev, incoming];
              });
            } else {
              const targetArt = articles.find((a) => a.id === incoming.projectId);
              if (targetArt && !(targetArt.teamComments || []).some((c) => c.id === incoming.id)) {
                onUpdateArticle({
                  ...targetArt,
                  teamComments: [...(targetArt.teamComments || []), incoming],
                  lastUpdated: new Date().toISOString(),
                });
              }
            }

            if (!isFromMe) {
              playNotificationChime(soundMuted);
            }
          }
        }
      )
      .subscribe();

    return () => {
      bc.removeEventListener('message', handleBroadcastMsg);
      bc.close();
      supabase.removeChannel(supabaseChannel);
    };
  }, [articles, currentUser?.name, onUpdateArticle, soundMuted]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, filteredComments.length]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, channel]);

  useEffect(() => {
    if (!showChannelPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowChannelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showChannelPicker]);

  const handleSend = async () => {
    if (!commentText.trim()) return;
    setIsSending(true);
    setError(null);

    const textToSend = commentText.trim();
    const targetProjectId = channel === 'global' || channel === 'all_feed' ? 'global' : (currentArticle?.id || 'global');

    try {
      if (channel === 'global') {
        const newComment = await addArticleComment('global', textToSend);
        if (currentUser?.name) newComment.authorName = currentUser.name;

        // Auto mark sent comment as read by author
        setReadCommentIds((prev) => new Set([...prev, newComment.id]));
        setGlobalComments((prev) => [...prev, newComment]);
        broadcastNewMessage({ ...newComment, projectId: 'global' });
        setCommentText('');
      } else if (currentArticle) {
        const newComment = await addArticleComment(currentArticle.id, textToSend);
        if (currentUser?.name) newComment.authorName = currentUser.name;

        setReadCommentIds((prev) => new Set([...prev, newComment.id]));
        onUpdateArticle({
          ...currentArticle,
          teamComments: [...(currentArticle.teamComments || []), newComment],
          lastUpdated: new Date().toISOString(),
        });
        broadcastNewMessage({ ...newComment, projectId: currentArticle.id });
        setCommentText('');
      } else if (channel === 'all_feed') {
        const newComment = await addArticleComment('global', textToSend);
        if (currentUser?.name) newComment.authorName = currentUser.name;

        setReadCommentIds((prev) => new Set([...prev, newComment.id]));
        setGlobalComments((prev) => [...prev, newComment]);
        broadcastNewMessage({ ...newComment, projectId: 'global' });
        setCommentText('');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal mengirim pesan.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const insertTag = (tag: string) => {
    setCommentText((prev) => (prev ? `${tag} ${prev}` : `${tag} `));
    inputRef.current?.focus();
  };

  // Drag handlers with smooth pointer capture & clamped position
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    wasDragged.current = false;
    dragStart.current = { px: e.clientX, py: e.clientY, ox: bubblePosition.x, oy: bubblePosition.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [bubblePosition.x, bubblePosition.y]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = dragStart.current.px - e.clientX;
    const dy = dragStart.current.py - e.clientY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged.current = true;

    const rawX = dragStart.current.ox + dx;
    const rawY = dragStart.current.oy + dy;

    setBubblePosition({ x: rawX, y: rawY });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const channelLabel =
    channel === 'all_feed'
      ? 'Semua Feed Diskusi'
      : channel === 'global'
      ? 'Diskusi Umum (Global)'
      : currentArticle
      ? `Artikel: ${currentArticle.code}`
      : 'Pilih Saluran Chat';

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'baru saja';
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}j lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#087E79', '#6366f1', '#d946ef', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];
    return colors[Math.abs(hash) % colors.length];
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const baseBottomOffset = isMobile ? 84 : 16;

  return (
    <div
      ref={bubbleRef}
      className="fixed z-[99999]"
      style={{
        right: `${16 + currentPosition.x}px`,
        bottom: `calc(${baseBottomOffset}px + ${currentPosition.y}px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      {isOpen ? (
        <div
          id="floating-chat-panel"
          className="flex flex-col overflow-hidden transition-all duration-200 border border-slate-200/80"
          style={{
            width: 'min(400px, calc(100vw - 24px))',
            height: isMobile ? 'min(520px, calc(100vh - 150px))' : 'min(560px, calc(100vh - 100px))',
            borderRadius: '24px',
            background: '#ffffff',
            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(8,126,121,0.08)',
          }}
        >
          {/* Header — Draggable area */}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ touchAction: 'none', cursor: isDragging.current ? 'grabbing' : 'grab' }}
            className="flex items-center gap-2.5 px-4 py-3 select-none bg-gradient-to-r from-slate-900 via-slate-800 to-[#087E79] text-white"
          >
            <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <MessageCircle className="w-4 h-4 text-teal-300" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse"></span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold leading-tight tracking-wide">Diskusi Tim</p>
                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-200 rounded-full font-medium border border-emerald-400/30">
                    Realtime Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight truncate">
                  {currentUser?.name || 'Tim Launch'} · {totalUnreadCount > 0 ? `${totalUnreadCount} belum dibaca` : 'Semua dibaca'}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div
              className="flex items-center gap-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                id="chat-sound-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSoundMuted(!soundMuted);
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  soundMuted ? 'bg-rose-500/20 text-rose-300' : 'hover:bg-white/10 text-slate-300 hover:text-white'
                }`}
                title={soundMuted ? 'Bunyi Pesan: Matikan' : 'Bunyi Pesan: Nyala'}
              >
                {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button
                id="chat-search-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchQuery('');
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  showSearch ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-300 hover:text-white'
                }`}
                title="Cari Pesan"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <button
                id="chat-minimize-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Kecilkan Chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                id="chat-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/80 text-slate-300 hover:text-white transition-colors"
                title="Tutup Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Broad Search Bar if toggled */}
          {showSearch && (
            <div className="bg-slate-100/90 border-b border-slate-200 p-2.5 space-y-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 focus-within:border-[#087E79]">
                <Search className="w-3.5 h-3.5 text-[#087E79] flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pesan, nama, kode artikel..."
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  autoFocus
                />
                {(searchQuery || searchCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchCategory('all');
                    }}
                    className="text-slate-400 hover:text-slate-600"
                    title="Bersihkan Pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                <button
                  type="button"
                  onClick={() => setSearchCategory('all')}
                  className={`text-[10px] font-semibold px-2 py-0.8 rounded-lg flex-shrink-0 transition-colors ${
                    searchCategory === 'all'
                      ? 'bg-[#087E79] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setSearchCategory('keputusan')}
                  className={`text-[10px] font-semibold px-2 py-0.8 rounded-lg flex-shrink-0 transition-colors ${
                    searchCategory === 'keputusan'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  📌 Keputusan
                </button>
                <button
                  type="button"
                  onClick={() => setSearchCategory('blocker')}
                  className={`text-[10px] font-semibold px-2 py-0.8 rounded-lg flex-shrink-0 transition-colors ${
                    searchCategory === 'blocker'
                      ? 'bg-rose-500 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🚨 Blocker
                </button>
                <button
                  type="button"
                  onClick={() => setSearchCategory('global')}
                  className={`text-[10px] font-semibold px-2 py-0.8 rounded-lg flex-shrink-0 transition-colors ${
                    searchCategory === 'global'
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🌐 Chat Umum
                </button>
                <button
                  type="button"
                  onClick={() => setSearchCategory('articles')}
                  className={`text-[10px] font-semibold px-2 py-0.8 rounded-lg flex-shrink-0 transition-colors ${
                    searchCategory === 'articles'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  📦 Artikel
                </button>
              </div>

              {/* Match Counter Badge */}
              {isSearchActive && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-0.5">
                  <span>Pencarian Lintas Sistem</span>
                  <span className="font-bold text-[#087E79]">
                    {filteredComments.length} pesan ditemukan
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Channel Selector Bar */}
          <div className="relative px-3 pt-2.5 pb-2 border-b border-slate-100 bg-slate-50/50">
            <button
              id="chat-channel-picker-btn"
              onClick={() => setShowChannelPicker(!showChannelPicker)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-[#087E79]/40 shadow-sm transition-all text-left group"
            >
              {channel === 'all_feed' ? (
                <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              ) : channel === 'global' ? (
                <Globe className="w-3.5 h-3.5 text-[#087E79] flex-shrink-0" />
              ) : (
                <Hash className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              )}
              <span className="text-xs font-semibold text-slate-800 truncate flex-1">{channelLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#087E79] transition-transform ${
                  showChannelPicker ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showChannelPicker && (
              <div
                ref={pickerRef}
                className="absolute left-3 right-3 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-20 max-h-64 overflow-y-auto divide-y divide-slate-100 py-1"
              >
                {/* Global & All Feed */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setChannel('global');
                      setShowChannelPicker(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                      channel === 'global' ? 'bg-[#087E79]/10 text-[#087E79]' : ''
                    }`}
                  >
                    <Globe className="w-4 h-4 text-[#087E79]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">Diskusi Umum (Global)</p>
                      <p className="text-[10px] text-slate-400">Obrolan bebas tim luar artikel</p>
                    </div>
                    {globalComments.length > 0 && (
                      <span className="text-[10px] font-bold text-[#087E79] bg-[#087E79]/15 px-1.5 py-0.5 rounded-full">
                        {globalComments.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setChannel('all_feed');
                      setShowChannelPicker(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                      channel === 'all_feed' ? 'bg-[#087E79]/10 text-[#087E79]' : ''
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">Semua Feed Diskusi</p>
                      <p className="text-[10px] text-slate-400">Rangkuman gabungan semua pesan</p>
                    </div>
                  </button>
                </div>

                {/* Per-Article Channels */}
                <div className="py-1">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Diskusi Per Artikel
                  </p>
                  {articles.map((a) => {
                    const cCount = a.teamComments?.length || 0;
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          setChannel(a.id);
                          setShowChannelPicker(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                          channel === a.id ? 'bg-[#087E79]/10 text-[#087E79]' : ''
                        }`}
                      >
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{a.code}</p>
                          <p className="text-[10px] text-slate-400 truncate">{a.name}</p>
                        </div>
                        {cCount > 0 && (
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-200/50">
                            {cCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-3.5 py-2 scrollbar-thin">
            {filteredComments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2.5 text-slate-400 py-8">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#087E79]">
                  <MessageCircle className="w-6 h-6 opacity-70" />
                </div>
                <p className="text-xs text-center font-medium text-slate-500 max-w-[220px]">
                  {searchQuery
                    ? 'Tidak ada pesan yang cocok dengan pencarian.'
                    : channel === 'global'
                    ? 'Belum ada obrolan di Diskusi Umum. Mulai kirim pesan pertamamu!'
                    : channel === 'all_feed'
                    ? 'Belum ada aktivitas diskusi di sistem.'
                    : 'Belum ada diskusi untuk artikel ini.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-1">
                {filteredComments.map((c) => {
                  const isMe = c.authorName === (currentUser?.name || 'Tim Launch') || c.authorName === 'Anda';
                  const isRead = readCommentIds.has(c.id);
                  return (
                    <div key={c.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && (
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white shadow-xs mt-3"
                          style={{ background: getAvatarColor(c.authorName) }}
                        >
                          {getInitials(c.authorName)}
                        </div>
                      )}
                      <div className={`max-w-[82%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`flex items-center gap-1.5 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] font-bold text-slate-600">
                            {isMe ? 'Anda' : c.authorName}
                          </span>
                          {c._sourceLabel && (
                            <span className="text-[9px] font-semibold text-[#087E79] bg-teal-50 border border-teal-200/60 px-1.5 py-0.2 rounded-md">
                              {c._sourceLabel}
                            </span>
                          )}
                        </div>

                        {/* Comment Body with Tag Styling */}
                        <div
                          className={`px-3.5 py-2 text-[12.5px] leading-relaxed break-words shadow-xs ${
                            isMe
                              ? 'bg-gradient-to-br from-[#087E79] to-[#076a66] text-white rounded-2xl rounded-tr-xs'
                              : 'bg-slate-100 text-slate-800 border border-slate-200/60 rounded-2xl rounded-tl-xs'
                          }`}
                        >
                          {c.body}
                        </div>

                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[9.5px] text-slate-400">
                            {formatTime(c.createdAt)}
                          </span>
                          {isMe && (
                            <CheckCheck className={`w-3 h-3 ${isRead ? 'text-teal-600' : 'text-slate-300'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-3 mb-1 px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
              <p className="text-[11px] text-rose-600 font-medium">{error}</p>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Tag Action Chips */}
          <div className="px-3 pt-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => insertTag('📌 [Keputusan]')}
              className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.8 rounded-lg flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <Bookmark className="w-3 h-3 text-amber-500" /> Keputusan
            </button>
            <button
              type="button"
              onClick={() => insertTag('🚨 [Blocker]')}
              className="text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.8 rounded-lg flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" /> Blocker
            </button>
            <button
              type="button"
              onClick={() => setCommentText((prev) => prev + ' 👍')}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg flex-shrink-0"
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => setCommentText((prev) => prev + ' ❤️')}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg flex-shrink-0"
            >
              ❤️
            </button>
            <button
              type="button"
              onClick={() => setCommentText((prev) => prev + ' 🚀')}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg flex-shrink-0"
            >
              🚀
            </button>
          </div>

          {/* Input Box */}
          <div className="p-3">
            <div className="flex items-end gap-2 p-1.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-[#087E79] focus-within:ring-2 focus-within:ring-[#087E79]/15 transition-all">
              <textarea
                id="chat-input-textarea"
                ref={inputRef}
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  channel === 'global'
                    ? 'Tulis pesan umum untuk tim...'
                    : currentArticle
                    ? `Tulis diskusi untuk ${currentArticle.code}...`
                    : 'Tulis pesan...'
                }
                rows={1}
                className="flex-1 resize-none text-xs px-2.5 py-1.5 rounded-xl bg-transparent focus:outline-none placeholder:text-slate-400 max-h-20"
              />
              <button
                id="chat-send-btn"
                onClick={() => void handleSend()}
                disabled={isSending || !commentText.trim()}
                className="w-8 h-8 rounded-xl bg-[#087E79] text-[#ffffff] flex items-center justify-center hover:bg-[#066460] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-xs"
                title="Kirim Pesan"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Floating Draggable Bubble Button */
        <button
          id="floating-chat-bubble-btn"
          aria-label="Buka Diskusi Tim"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => {
            onPointerUp(e);
            if (!wasDragged.current) setIsOpen(true);
          }}
          className="group relative w-14 h-14 rounded-2xl text-white flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl select-none"
          style={{
            touchAction: 'none',
            background: 'linear-gradient(135deg, #087E79 0%, #0bbdb5 100%)',
            boxShadow: '0 8px 25px -4px rgba(8,126,121,0.45), 0 2px 8px rgba(8,126,121,0.2)',
          }}
          title="Buka Diskusi Tim"
        >
          <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />

          {/* DYNAMIC UNREAD BADGE COUNT (ONLY SHOWS UNREAD MESSAGES, DECREASES WHEN READ) */}
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md border-2 border-white animate-pulse">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}

          {/* Tooltip */}
          <span className="absolute -top-9 right-0 bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg border border-slate-700">
            Diskusi Tim {totalUnreadCount > 0 ? `(${totalUnreadCount} baru)` : ''}
          </span>
        </button>
      )}
    </div>
  );
};
