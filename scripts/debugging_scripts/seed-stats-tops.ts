/**
 * Seed de identities + StatEvents para probar !goleadores / !asistidores
 * Uso: npx tsx scripts/debugging_scripts/seed-stats-tops.ts [ruid]
 */
import { db, connect, disconnect } from '@mikuserverpro/database';

const FAKE_PLAYERS = [
  { name: 'SeedGol_01', goalsToday: 5, goalsWeek: 3, goalsMonth: 2, assistsToday: 1, assistsWeek: 2, assistsMonth: 1 },
  { name: 'SeedGol_02', goalsToday: 4, goalsWeek: 4, goalsMonth: 1, assistsToday: 2, assistsWeek: 1, assistsMonth: 0 },
  { name: 'SeedGol_03', goalsToday: 3, goalsWeek: 2, goalsMonth: 3, assistsToday: 0, assistsWeek: 3, assistsMonth: 2 },
  { name: 'SeedGol_04', goalsToday: 2, goalsWeek: 1, goalsMonth: 4, assistsToday: 3, assistsWeek: 0, assistsMonth: 1 },
  { name: 'SeedGol_05', goalsToday: 1, goalsWeek: 0, goalsMonth: 2, assistsToday: 4, assistsWeek: 2, assistsMonth: 3 },
  { name: 'SeedGol_06', goalsToday: 0, goalsWeek: 2, goalsMonth: 1, assistsToday: 1, assistsWeek: 4, assistsMonth: 0 },
  { name: 'SeedGol_07', goalsToday: 0, goalsWeek: 1, goalsMonth: 0, assistsToday: 0, assistsWeek: 1, assistsMonth: 4 },
];

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

async function createIdentity(name: string, index: number) {
  const conn = `seed-stats-tops-${index}-${Date.now()}`;
  return db.playerIdentity.create({
    data: {
      primaryConn: conn,
      names: { create: { name } }
    }
  });
}

function buildEvents(
  ruid: string,
  identityId: string,
  type: 'goal' | 'assist',
  count: number,
  recordedAt: Date
) {
  return Array.from({ length: count }, () => ({
    ruid,
    identityId,
    type,
    recordedAt
  }));
}

async function main() {
  const ruid = process.argv[2] || process.env.SEED_RUID || 'main-beta-1';
  console.log(`🌱 Seeding StatEvents for ruid=${ruid}`);

  await connect();

  for (let i = 0; i < FAKE_PLAYERS.length; i++) {
    const player = FAKE_PLAYERS[i];
    const identity = await createIdentity(player.name, i);

    const events = [
      ...buildEvents(ruid, identity.id, 'goal', player.goalsToday, hoursAgo(2)),
      ...buildEvents(ruid, identity.id, 'goal', player.goalsWeek, daysAgo(5)),
      ...buildEvents(ruid, identity.id, 'goal', player.goalsMonth, daysAgo(20)),
      ...buildEvents(ruid, identity.id, 'assist', player.assistsToday, hoursAgo(3)),
      ...buildEvents(ruid, identity.id, 'assist', player.assistsWeek, daysAgo(5)),
      ...buildEvents(ruid, identity.id, 'assist', player.assistsMonth, daysAgo(20))
    ];

    if (events.length > 0) {
      await db.statEvent.createMany({ data: events });
    }

    const totalGoals = player.goalsToday + player.goalsWeek + player.goalsMonth;
    const totalAssists = player.assistsToday + player.assistsWeek + player.assistsMonth;

    if (totalGoals > 0 || totalAssists > 0) {
      await db.playerStats.create({
        data: {
          ruid,
          playerId: identity.id,
          goals: totalGoals,
          assists: totalAssists,
          totals: 1
        }
      });
    }

    console.log(`  ✓ ${player.name}: ${totalGoals}G ${totalAssists}A (${events.length} events)`);
  }

  console.log('✅ Seed complete. Prueba en sala: !goleadores dia · !asistidores semana');
}

main()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => disconnect());
