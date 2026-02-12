
import { Badge, UserAnimeEntry, UserBadge, AnimeStatus } from '../types';
import { BADGES_CATALOG } from '../constants';

export const evaluateBadges = (
  library: UserAnimeEntry[], 
  currentBadges: UserBadge[]
): Badge[] => {
  const newBadges: Badge[] = [];
  const currentBadgeIds = new Set(currentBadges.map(b => b.badgeId));

  // Calculate Aggregates
  const totalEpisodes = library.reduce((acc, curr) => acc + curr.progress, 0);
  const totalCompleted = library.filter(entry => entry.status === AnimeStatus.COMPLETED).length;

  // Check Rules
  BADGES_CATALOG.forEach(badge => {
    if (currentBadgeIds.has(badge.id)) return; // Already earned

    let earned = false;

    switch (badge.criteria.type) {
      case 'EPISODES_TOTAL':
        if (totalEpisodes >= badge.criteria.threshold) earned = true;
        break;
      case 'COMPLETED_SHOWS':
        if (totalCompleted >= badge.criteria.threshold) earned = true;
        break;
    }

    if (earned) {
      newBadges.push(badge);
    }
  });

  return newBadges;
};
