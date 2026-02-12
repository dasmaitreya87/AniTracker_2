
import React, { useEffect } from 'react';
import { AppNotification } from '../types';
import { X, Award } from 'lucide-react';

interface Props {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<Props> = ({ notification, onDismiss }) => {
  useEffect(() => {
    // Longer timeout for nudges to give user time to read and act
    const timeout = notification.type === 'NUDGE' ? 10000 : 5000;
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, timeout);
    return () => clearTimeout(timer);
  }, [notification.id, notification.type, onDismiss]);

  const handleAction = () => {
      if (notification.onAction) {
          notification.onAction();
          onDismiss(notification.id);
      }
  };

  return (
    <div className="flex flex-col w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl animate-fade-in relative overflow-hidden group">
      {/* Progress Bar */}
      <div className={`absolute bottom-0 left-0 h-1 bg-rose-600 w-full ${notification.type === 'NUDGE' ? 'animate-[width_10s_linear_forwards]' : 'animate-[width_5s_linear_forwards]'}`} />

      <div className="flex items-start gap-3 p-4">
          <div className="shrink-0 p-2 bg-zinc-800 rounded-full text-rose-500">
            {notification.type === 'BADGE' ? <span className="text-2xl">{notification.icon || '🏆'}</span> : 
             notification.type === 'NUDGE' ? <span className="text-xl">{notification.icon || '👋'}</span> :
             <Award size={20} />}
          </div>
          
          <div className="flex-1">
            <h4 className="font-bold text-white text-sm leading-tight mb-1">{notification.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{notification.message}</p>
          </div>

          <button 
            onClick={() => onDismiss(notification.id)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
      </div>
      
      {/* Action Button Area */}
      {notification.onAction && (
          <button 
             onClick={handleAction}
             className="w-full bg-zinc-800 hover:bg-zinc-700 text-rose-500 text-xs font-bold py-2 border-t border-zinc-700 transition-colors uppercase tracking-wide"
          >
              {notification.actionLabel || 'View'}
          </button>
      )}
    </div>
  );
};
