
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { EpisodeRating } from '../types';

interface Props {
  data: EpisodeRating[];
  onEpisodeClick?: (ep: EpisodeRating) => void;
}

export const EpisodeRatingsChart: React.FC<Props> = ({ data, onEpisodeClick }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const ep = payload[0].payload as EpisodeRating;
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded shadow-xl z-50">
          <p className="font-bold text-white mb-1">Ep {ep.episode}: {ep.title}</p>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-yellow-500 font-bold">★ {ep.rating}</span>
             <span className="text-zinc-500 text-xs">({ep.votes.toLocaleString()} votes)</span>
          </div>
          <p className="text-zinc-400 text-xs">{ep.airDate}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 select-none">
       <ResponsiveContainer width="100%" height="100%">
         <AreaChart 
            data={data} 
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }} 
            onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                    onEpisodeClick?.(e.activePayload[0].payload);
                }
            }}
         >
            <defs>
              <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
                dataKey="episode" 
                stroke="#52525b" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
            />
            <YAxis 
                domain={[0, 10]} 
                stroke="#52525b" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                tickCount={6}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
                type="monotone" 
                dataKey="rating" 
                stroke="#ef4444" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRating)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
            />
         </AreaChart>
       </ResponsiveContainer>
    </div>
  );
};
