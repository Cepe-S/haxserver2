import { db } from '@mikuserverpro/database';

export type LeaderboardPeriod = 'day' | 'week' | 'month' | 'all';

export interface LeaderboardEntry {
  rank: number;
  identityId: string;
  name: string;
  count: number;
}

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  day: 'Día (24h)',
  week: 'Semana (7d)',
  month: 'Mes (30d)',
  all: 'Global'
};

export function getPeriodLabel(period: LeaderboardPeriod): string {
  return PERIOD_LABELS[period];
}

function getPeriodStart(period: Exclude<LeaderboardPeriod, 'all'>): Date {
  const now = Date.now();
  const ms =
    period === 'day' ? 24 * 60 * 60 * 1000 :
    period === 'week' ? 7 * 24 * 60 * 60 * 1000 :
    30 * 24 * 60 * 60 * 1000;
  return new Date(now - ms);
}

async function resolveDisplayNames(identityIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (identityIds.length === 0) return names;

  const rows = await db.playerName.findMany({
    where: { identityId: { in: identityIds } },
    orderBy: { lastSeen: 'desc' }
  });

  for (const row of rows) {
    if (!names.has(row.identityId)) {
      names.set(row.identityId, row.name);
    }
  }

  return names;
}

async function getTopFromStatEvents(
  ruid: string,
  type: 'goal' | 'assist',
  period: Exclude<LeaderboardPeriod, 'all'>,
  limit: number
): Promise<LeaderboardEntry[]> {
  const since = getPeriodStart(period);
  const grouped = await db.statEvent.groupBy({
    by: ['identityId'],
    where: { ruid, type, recordedAt: { gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit
  });

  const nameMap = await resolveDisplayNames(grouped.map(g => g.identityId));

  return grouped.map((row, index) => ({
    rank: index + 1,
    identityId: row.identityId,
    name: nameMap.get(row.identityId) ?? 'Desconocido',
    count: row._count.id
  }));
}

async function getTopFromPlayerStats(
  ruid: string,
  field: 'goals' | 'assists',
  limit: number
): Promise<LeaderboardEntry[]> {
  const stats = await db.playerStats.findMany({
    where: { ruid, [field]: { gt: 0 } },
    orderBy: { [field]: 'desc' },
    take: limit,
    include: {
      player: {
        include: {
          names: { orderBy: { lastSeen: 'desc' }, take: 1 }
        }
      }
    }
  });

  return stats.map((row, index) => ({
    rank: index + 1,
    identityId: row.playerId,
    name: row.player.names[0]?.name ?? 'Desconocido',
    count: field === 'goals' ? row.goals : row.assists
  }));
}

export class LeaderboardService {
  async getTopScorers(
    ruid: string,
    period: LeaderboardPeriod = 'all',
    limit = 10
  ): Promise<LeaderboardEntry[]> {
    if (period === 'all') {
      return getTopFromPlayerStats(ruid, 'goals', limit);
    }
    return getTopFromStatEvents(ruid, 'goal', period, limit);
  }

  async getTopAssisters(
    ruid: string,
    period: LeaderboardPeriod = 'all',
    limit = 10
  ): Promise<LeaderboardEntry[]> {
    if (period === 'all') {
      return getTopFromPlayerStats(ruid, 'assists', limit);
    }
    return getTopFromStatEvents(ruid, 'assist', period, limit);
  }
}
