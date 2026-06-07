import React, { useState } from 'react';
import { Link2, Check, Copy, Share2 } from 'lucide-react';

interface ShareableLinkProps {
  projectId: string;
  projectName: string;
}

export const ShareableLink: React.FC<ShareableLinkProps> = ({ projectId, projectName }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}?project=${projectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: projectName, text: `Check out my project: ${projectName}`, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleShare}
        className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
        title="Share project"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
      </button>

      <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 min-w-[280px]">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest">Share Link</span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2 border border-white/5">
          <input
            readOnly
            value={shareUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 bg-transparent text-[10px] font-mono text-white/60 outline-none px-2 truncate"
          />
          <button
            onClick={handleCopy}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
          </button>
        </div>
        <p className="text-[8px] font-medium text-white/20 mt-2">Anyone with this link can view the project</p>
      </div>
    </div>
  );
};
