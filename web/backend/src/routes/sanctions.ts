import { FastifyInstance } from 'fastify';
import { db } from '@mikuserverpro/database';

export async function sanctionsRoutes(fastify: FastifyInstance) {
  
  // Obtener jugadores conectados y recientes de una sala
  fastify.get('/api/rooms/:ruid/players/sanctions', async (request, reply) => {
    const { ruid } = request.params as { ruid: string };

    try {
      // Jugadores conectados (conexiones activas)
      const connectedPlayers = await db.connection.findMany({
        where: { 
          ruid,
          leftAt: null 
        },
        include: {
          player: {
            include: {
              names: {
                orderBy: { lastSeen: 'desc' },
                take: 1
              },
              auths: {
                orderBy: { lastSeen: 'desc' },
                take: 1
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      });

      // Jugadores desconectados recientemente (últimas 2 horas)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const recentPlayers = await db.connection.findMany({
        where: { 
          ruid,
          leftAt: { gte: twoHoursAgo }
        },
        include: {
          player: {
            include: {
              names: {
                orderBy: { lastSeen: 'desc' },
                take: 1
              },
              auths: {
                orderBy: { lastSeen: 'desc' },
                take: 1
              }
            }
          }
        },
        orderBy: { leftAt: 'desc' },
        take: 20
      });

      const formatPlayer = (connection: any) => ({
        identityId: connection.playerId,
        haxballId: connection.haxballId,
        name: connection.name,
        auth: connection.auth,
        joinedAt: connection.joinedAt,
        leftAt: connection.leftAt,
        isConnected: !connection.leftAt,
        primaryAuth: connection.player.auths[0]?.auth
      });

      return {
        connected: connectedPlayers.map(formatPlayer),
        recent: recentPlayers.map(formatPlayer)
      };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch players' });
    }
  });

  // Crear sanción desde web
  fastify.post('/api/rooms/:ruid/sanctions', async (request, reply) => {
    const { ruid } = request.params as { ruid: string };
    const { identityId, type, duration, reason, adminName } = request.body as {
      identityId: string;
      type: 'ban' | 'mute';
      duration: number;
      reason?: string;
      adminName?: string;
    };

    if (!identityId || !type || duration === undefined) {
      return reply.code(400).send({ error: 'identityId, type and duration are required' });
    }

    if (!['ban', 'mute'].includes(type)) {
      return reply.code(400).send({ error: 'type must be ban or mute' });
    }

    try {
      const expiresAt = duration > 0 ? new Date(Date.now() + duration * 60 * 1000) : null;

      const sanction = await db.playerSanction.create({
        data: {
          identityId,
          ruid,
          type,
          reason: reason || 'Sanción desde web',
          duration,
          adminName: adminName || 'Web Admin',
          expiresAt
        }
      });

      return { sanction };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to create sanction' });
    }
  });

  // Obtener sanciones activas de una sala
  fastify.get('/api/rooms/:ruid/sanctions', async (request, reply) => {
    const { ruid } = request.params as { ruid: string };

    try {
      const sanctions = await db.playerSanction.findMany({
        where: {
          ruid,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          identity: {
            include: {
              names: {
                orderBy: { lastSeen: 'desc' },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formattedSanctions = sanctions.map(sanction => ({
        id: sanction.id,
        type: sanction.type,
        reason: sanction.reason,
        duration: sanction.duration,
        adminName: sanction.adminName,
        createdAt: sanction.createdAt,
        expiresAt: sanction.expiresAt,
        playerName: sanction.identity.names[0]?.name || 'Unknown'
      }));

      return { sanctions: formattedSanctions };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch sanctions' });
    }
  });

  // Remover sanción
  fastify.delete('/api/sanctions/:sanctionId', async (request, reply) => {
    const { sanctionId } = request.params as { sanctionId: string };

    try {
      await db.playerSanction.update({
        where: { id: sanctionId },
        data: { isActive: false }
      });

      return { success: true };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to remove sanction' });
    }
  });
}