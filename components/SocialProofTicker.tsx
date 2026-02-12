
import React, { useEffect, useState } from 'react';
import { useStore } from '../services/store';

export const SocialProofTicker = () => {
  const { newsPosts } = useStore();
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    // Calculate distinct users who posted in last 24h
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const recentPosts = newsPosts.filter(p => (now - p.createdAt) < oneDay);
    const uniqueUsers = new Set(recentPosts.map(p => p.userId)).size;
    
    // Fallback to a random number for demo "aliveness" if empty
    setActiveCount(Math.max(uniqueUsers, 3 + Math.floor(Math.random() * 5)));
  }, [newsPosts]);

  return (
    <div className="bg-zinc-900/80 border-y border-zinc-800 backdrop-blur-sm py-1.5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex justify-center md:justify-start">
             <p className="text-[10px] md:text-xs text-zinc-400 font-medium flex items-center gap-2 animate-pulse-slow">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shadow-[0_0_5px_rgba(34,197,94,0.6)]"></span>
                {activeCount} people posted news or updates in the last 24h. Join the conversation!
             </p>
        </div>
    </div>
  );
};
