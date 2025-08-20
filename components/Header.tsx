
import React, { useState } from 'react';
import { ShareIcon, SettingsIcon } from './icons/Icons';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const previewUrl = `${window.location.origin}${window.location.pathname}?view=preview`;
    navigator.clipboard.writeText(previewUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error("Failed to copy share link:", err);
      alert("Could not copy link to clipboard.");
    });
  };

  return (
    <header className="bg-dark-bg/70 backdrop-blur-sm border-b border-neon-cyan/20 sticky top-0 z-20 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter neon-text-cyan">
            The Crucible
          </h1>
          <p className="text-sm text-neon-pink/80">Precision Audio & Safety</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {copied && <span className="text-neon-cyan text-sm animate-pulse hidden sm:inline">Link Copied!</span>}
          <button
            onClick={handleShare}
            title="Get sharable preview link"
            aria-label="Get sharable preview link"
            className="text-gray-400 hover:text-neon-cyan transition-colors p-2 rounded-full hover:bg-slate-700/50"
          >
            <ShareIcon />
          </button>
          <button
            onClick={onOpenSettings}
            title="Configure AI Persona"
            aria-label="Configure AI Persona"
            className="text-gray-400 hover:text-neon-cyan transition-colors p-2 rounded-full hover:bg-slate-700/50"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
