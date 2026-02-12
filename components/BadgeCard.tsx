
import React from 'react';
import { Badge, UserBadge } from '../types';
import { BADGES_CATALOG } from '../constants';

interface Props {
  userBadge: UserBadge;
  showDate?: boolean;
}

export const BadgeCard: React.FC<Props> = ({ userBadge, showDate = true }) => {
  const badgeDef = BADGES_CATALOG.find(b => b.id === userBadge.badgeId);
  
  if (!badgeDef) return null;

  const tierColors = {
    BRONZE: 'border-orange-700/50 bg-orange-900/10 text-orange-200',
    SILVER: 'border-slate-400/50 bg-slate-800/30 text-slate-200',
    GOLD: 'border-yellow-500/50 bg-yellow-900/10 text-yellow-200'
  };

  const tierGlow = {
    BRONZE: 'shadow-orange-900/20',
    SILVER: 'shadow-slate-500/20',
    GOLD: 'shadow-yellow-500/20'
  };

  return (
    <div className={`
      relative flex flex-col items-center justify-center p-4 rounded-xl border-2 
      ${tierColors[badgeDef.tier]} 
      ${tierGlow[badgeDef.tier]} shadow-xl 
      transition-all hover:scale-105 hover:bg-zinc-800/80 group
      ${userBadge.isNew ? 'animate-pulse ring-2 ring-white/50' : ''}
    `}>
      <div className="text-4xl mb-3 drop-shadow-md transform group-hover:-translate-y-1 transition-transform">
        {badgeDef.emoji}
      </div>
      
      <h4 className="font-bold text-sm text-center mb-1">{badgeDef.name}</h4>
      
      <p className="text-[10px] text-center opacity-70 px-2 leading-tight">
        {badgeDef.description}
      </p>

      {showDate && (
        <div className="mt-3 text-[10px] text-zinc-500 font-mono">
           {new Date(userBadge.awardedAt).toLocaleDateString()}
        </div>
      )}

      {/* Tier Badge */}
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${badgeDef.tier === 'GOLD' ? 'bg-yellow-500' : badgeDef.tier === 'SILVER' ? 'bg-slate-400' : 'bg-orange-700'}`}></div>
    </div>
  );
};
