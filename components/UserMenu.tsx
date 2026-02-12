
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../services/store';
import { User, LogOut, LayoutDashboard } from 'lucide-react';

export const UserMenu = () => {
  const { user, logout, setView } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative z-50" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-rose-500 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-lg block"
        title="User Menu"
      >
        <img 
            src={user.avatarUrl || "https://github.com/shadcn.png"} 
            alt={user.username} 
            className="w-full h-full object-cover" 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in origin-top-right">
           <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
             <p className="text-sm font-bold text-white truncate">{user.username}</p>
             <p className="text-xs text-zinc-500 truncate">{user.bio || 'Anime Fan'}</p>
           </div>
           
           <div className="py-1">
             <button 
                onClick={() => { setView('DASHBOARD'); setIsOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
             >
                <LayoutDashboard size={16} className="text-zinc-500" /> Dashboard
             </button>
             <button 
                onClick={() => { setView('PROFILE'); setIsOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
             >
                <User size={16} className="text-zinc-500" /> My Profile
             </button>
           </div>

           <div className="border-t border-zinc-800 py-1">
             <button 
                onClick={() => { logout(); setIsOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition-colors"
             >
                <LogOut size={16} /> Sign Out
             </button>
           </div>
        </div>
      )}
    </div>
  );
};
