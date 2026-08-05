import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Minimize2, GripVertical } from 'lucide-react';
import { Article, ArticleComment } from '../../types';
import { addArticleComment } from '../../services/collaboration';

interface FloatingChatBubbleProps {
  articles: Article[];
  selectedArticleId: string;
  onUpdateArticle: (updated: Article) => void;
  currentUserName?: string;
}

export const FloatingChatBubble: React.FC<FloatingChatBubbleProps> = ({
  articles,
  selectedArticleId,
  onUpdateArticle,
  currentUserName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(selectedArticleId);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedArticleId) setSelectedId(selectedArticleId);
  }, [selectedArticleId]);

  const article = articles.find((a) => a.id === selectedId);
  const comments: ArticleComment[] = article?.teamComments || [];

  const totalUnread = articles.reduce(
    (sum, a) => sum + (a.teamComments?.length || 0),
    0,
  );

  useEffect(() => {
    if (isOpen && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [isOpen, comments.length]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, selectedId]);

  const handleSend = async () => {
    if (!commentText.trim() || !article) return;
    setIsSending(true);
    setError(null);
    try {
      const comment = await addArticleComment(article.id, commentText);
      onUpdateArticle({
        ...article,
        teamComments: [comment, ...(article.teamComments || [])],
        lastUpdated: new Date().toISOString(),
      });
      setCommentText('');
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

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.x, position.y]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = dragRef.current.startX - e.clientX;
    const dy = dragRef.current.startY - e.clientY;
    setPosition({
      x: Math.max(0, dragRef.current.origX + dx),
      y: Math.max(0, dragRef.current.origY + dy),
    });
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  const articlesWithComments = articles.filter(
    (a) => (a.teamComments?.length || 0) > 0,
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'baru saja';
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}j lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      ref={bubbleRef}
      className="fixed z-[9999]"
      style={{
        right: `${24 + position.x}px`,
        bottom: `${24 + position.y}px`,
      }}
    >
      {isOpen ? (
        <div
          className="flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{
            width: 'min(380px, calc(100vw - 32px))',
            height: 'min(520px, calc(100vh - 100px))',
          }}
        >
          {/* Header — draggable */}
          <div
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#087E79] to-[#0A9E98] text-white select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
          >
            <GripVertical className="w-4 h-4 opacity-60 flex-shrink-0" />
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-bold truncate flex-1">Diskusi Tim</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Article Selector */}
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#087E79]/30"
            >
              <option value="" disabled>Pilih artikel...</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
          >
            {!article ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                Pilih artikel untuk mulai diskusi.
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                <MessageCircle className="w-8 h-8 opacity-40" />
                <p className="text-xs">Belum ada diskusi untuk artikel ini.</p>
              </div>
            ) : (
              [...comments].reverse().map((c) => {
                const isMe = c.authorName === currentUserName;
                return (
                  <div
                    key={c.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[10px] font-bold text-slate-500 mb-0.5 px-1">
                        {c.authorName}
                      </span>
                    )}
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                        isMe
                          ? 'bg-[#087E79] text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-800 rounded-bl-md'
                      }`}
                    >
                      {c.body}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                      {formatTime(c.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-1.5 bg-red-50 border-t border-red-100">
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" />
                {error}
              </p>
            </div>
          )}

          {/* Input */}
          {article && (
            <div className="flex items-end gap-2 px-3 py-2.5 border-t border-slate-100 bg-white">
              <textarea
                ref={inputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis pesan..."
                rows={1}
                className="flex-1 resize-none text-[13px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#087E79]/30 focus:border-[#087E79] max-h-20"
              />
              <button
                onClick={() => void handleSend()}
                disabled={isSending || !commentText.trim()}
                className="p-2.5 rounded-xl bg-[#087E79] text-white hover:bg-[#076b66] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Floating Bubble Button */
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-[#087E79] to-[#0A9E98] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
          style={{ touchAction: 'none' }}
          title="Diskusi Tim"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
          <span className="absolute -top-8 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Diskusi Tim
          </span>
        </button>
      )}
    </div>
  );
};
