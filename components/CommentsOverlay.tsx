import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, User } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  x?: number;
  y?: number;
}

interface CommentsOverlayProps {
  targetId: string;
  comments: Comment[];
  onAddComment: (content: string, x?: number, y?: number) => void;
  onDeleteComment: (id: string) => void;
}

export const CommentsOverlay: React.FC<CommentsOverlayProps> = ({
  targetId,
  comments,
  onAddComment,
  onDeleteComment,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
        title="Comments"
      >
        <MessageSquare className="w-4 h-4" />
        {comments.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-accent)] text-white text-[7px] font-black rounded-full flex items-center justify-center">
            {comments.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-[var(--color-accent)]" />
                Comments ({comments.length})
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto suggestions-scrollbar p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center py-6">
                  No comments yet
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-white/5 rounded-xl p-3 group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-white/30" />
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-wider">{c.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-white/20 font-medium">{formatTime(c.timestamp)}</span>
                        <button
                          onClick={() => onDeleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-white/70 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-medium text-white outline-none focus:border-[var(--color-accent)] transition-all"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!newComment.trim()}
                  className="p-2.5 bg-[var(--color-accent)] rounded-xl text-white disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
