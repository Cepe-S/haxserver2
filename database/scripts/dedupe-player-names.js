/**
 * Elimina filas duplicadas en player_names antes de @@unique([identityId, name]).
 * En instalación nueva la tabla puede no existir — se omite sin error.
 */
const { PrismaClient } = require('@prisma/client');

async function dedupePlayerNames() {
  const db = new PrismaClient();
  try {
    const rows = await db.$queryRaw`
      SELECT identityId, name, COUNT(*) as cnt
      FROM player_names
      GROUP BY identityId, name
      HAVING cnt > 1
    `;

    if (!rows.length) {
      console.log('player_names: no duplicates');
      return;
    }

    let removed = 0;
    for (const row of rows) {
      const dupes = await db.playerName.findMany({
        where: { identityId: row.identityId, name: row.name },
        orderBy: { firstSeen: 'asc' }
      });
      const [, ...toDelete] = dupes;
      for (const d of toDelete) {
        await db.playerName.delete({ where: { id: d.id } });
        removed++;
      }
    }
    console.log(`player_names: removed ${removed} duplicate rows`);
  } catch (error) {
    const msg = String(error?.message || error);
    if (msg.includes('no such table') || msg.includes('does not exist')) {
      console.log('player_names: table not found yet, skipping dedupe');
      return;
    }
    throw error;
  } finally {
    await db.$disconnect();
  }
}

dedupePlayerNames().catch((e) => {
  console.error(e);
  process.exit(1);
});
