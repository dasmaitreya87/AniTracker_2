
import React, { useState } from 'react';
import { useStore } from '../services/store';
import { LayoutDashboard, Compass, Settings, X } from 'lucide-react';
import { Button } from './ui/Button';

export const PostLoginChoiceModal = () => {
  const { user, isPostLoginModalOpen, setPostLoginChoice, closePostLoginModal, setView } = useStore();
  const [remember, setRemember] = useState(false);

  if (!isPostLoginModalOpen || !user) return null;

  const handleSettingsLink = () => {
      closePostLoginModal();
      setView('PROFILE');
  };

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
        role="dialog"
        aria-labelledby="choice-title"
        aria-modal="true"
    >
      <div className="bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-800 p-8 relative overflow-hidden">
        
        {/* Close / Skip Button */}
        <button 
            onClick={closePostLoginModal}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-2"
            aria-label="Skip and go to Dashboard"
        >
            <X size={24} />
        </button>

        <div className="text-center mb-8">
            <h2 id="choice-title" className="text-2xl md:text-3xl font-bold text-white mb-2">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">{user.username}</span> 👋
            </h2>
            <p className="text-zinc-400 text-lg">
                Where would you like to go next?
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
                onClick={() => setPostLoginChoice('DASHBOARD', remember)}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-rose-500 hover:scale-[1.02] transition-all group focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
                <div className="p-4 bg-zinc-900 rounded-full group-hover:bg-rose-500/20 text-rose-500 transition-colors">
                    <LayoutDashboard size={32} />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-white text-lg">Go to Dashboard</h3>
                    <p className="text-xs text-zinc-500 mt-1">View stats & progress</p>
                </div>
            </button>

            <button
                onClick={() => setPostLoginChoice('LANDING', remember)}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-indigo-500 hover:scale-[1.02] transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <div className="p-4 bg-zinc-900 rounded-full group-hover:bg-indigo-500/20 text-indigo-400 transition-colors">
                    <Compass size={32} />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-white text-lg">Explore Trending</h3>
                    <p className="text-xs text-zinc-500 mt-1">Discover new anime</p>
                </div>
            </button>
        </div>

        <div className="flex flex-col items-center gap-4">
            <label className="flex items-center gap-2 text-zinc-300 cursor-pointer select-none group">
                <input 
                    type="checkbox" 
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-rose-500 focus:ring-rose-500 transition-all cursor-pointer"
                />
                <span className="group-hover:text-white transition-colors">Remember my choice</span>
            </label>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>You can always change this later in</span>
                <button 
                    onClick={handleSettingsLink}
                    className="flex items-center gap-1 text-zinc-400 hover:text-white hover:underline transition-colors"
                >
                    <Settings size={12} /> Settings
                </button>
            </div>
            
            <button 
                onClick={closePostLoginModal}
                className="text-sm text-zinc-600 hover:text-zinc-400 mt-2"
            >
                Not now — take me to Dashboard
            </button>
        </div>
      </div>
    </div>
  );
};
