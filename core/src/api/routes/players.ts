import { FastifyInstance } from 'fastify';
import { PlayerIdentityManager } from '../../shared/player/PlayerIdentityManager';
import { Logger } from '../../shared/logger/Logger';
import { db } from '@mikuserverpro/database';

const logger = new Logger('PlayersAPI');
const playerIdentityManager = PlayerIdentityManager.getInstance();

export async function playersRoutes(fastify: FastifyInstance) {
  // Get all players for a room
  fastify.get('/api/rooms/:ruid/players', async (request, reply) => {
    try {
      const { ruid } = request.params as { ruid: string };
      
      logger.debug('Getting players for room', { ruid });
      
      // Debug: Check total players in database
      const totalPlayers = await db.playerIdentity.count();
      logger.debug('Total player identities in database', { totalPlayers });
      
      // Debug: Check connections for this room
      const activeConnections = await db.connection.count({ 
        where: { ruid, leftAt: null } 
      });
      const totalConnections = await db.connection.count({ 
        where: { ruid } 
      });
      logger.debug('Connections for this room', { ruid, activeConnections, totalConnections });
      
      const players = await playerIdentityManager.getRoomPlayers(ruid);
      
      logger.info(`Retrieved ${players.length} player identities for room ${ruid}`);
      
      return {
        success: true,
        data: players.map(p => ({
          id: p.id,
          name: p.currentConnection?.name || 'Unknown',
          auth: p.primaryAuth,
          conn: p.primaryConn,
          rating: 1000, // Rating now comes from PlayerStats
          goals: 0,     // Goals now come from PlayerStats
          assists: 0,   // Assists now come from PlayerStats
          allNames: p.allNames,
          allAuths: p.allAuths,
          firstSeen: p.firstSeen,
          lastSeen: p.lastSeen
        })),
        count: players.length,
        debug: {
          totalPlayers,
          activeConnections,
          totalConnections,
          requestedRuid: ruid
        }
      };
    } catch (error) {
      logger.error('Failed to get room players', { error: error.message, stack: error.stack });
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve players'
      });
    }
  });

  // Get detailed player data
  fastify.get('/api/player/:playerId/details', async (request, reply) => {
    try {
      const { playerId } = request.params as { playerId: string };
      
      logger.debug('Getting detailed player data', { playerId });
      
      const player = await db.playerIdentity.findUnique({
        where: { id: playerId },
        include: {
          auths: true,
          names: true,
          connections: true,
          gameConnections: {
            orderBy: { joinedAt: 'desc' },
            take: 1
          },
          stats: true,
          sanctions: {
            orderBy: { createdAt: 'desc' }
          },
          permissions: true
        }
      });
      
      if (!player) {
        return reply.status(404).send({
          success: false,
          error: 'Player not found'
        });
      }
      
      return {
        success: true,
        data: {
          id: player.id,
          primaryAuth: player.primaryAuth,
          primaryConn: player.primaryConn,
          firstSeen: player.firstSeen,
          lastSeen: player.lastSeen,
          allAuths: player.auths.map(a => a.auth),
          allNames: player.names.map(n => n.name),
          allConnections: player.connections.map(c => c.conn),
          connectionDetails: player.connections.map(c => ({
            conn: c.conn,
            ipAddress: c.ipAddress,
            userAgent: c.userAgent,
            useCount: c.useCount,
            firstSeen: c.firstSeen,
            lastSeen: c.lastSeen,
            country: c.country,
            region: c.region,
            city: c.city,
            timezone: c.timezone,
            isp: c.isp,
            isVpn: c.isVpn,
            isProxy: c.isProxy,
            isTor: c.isTor,
            threatLevel: c.threatLevel
          })),
          currentConnection: player.gameConnections[0] || null,
          stats: player.stats[0] || null,
          sanctions: player.sanctions.map(s => ({
            id: s.id,
            type: s.type,
            reason: s.reason,
            duration: s.duration,
            adminName: s.adminName,
            isActive: s.isActive,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt
          })),
          permissions: player.permissions
        }
      };
    } catch (error) {
      logger.error('Failed to get player details', { error: error.message, stack: error.stack });
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve player details'
      });
    }
  });

  // Debug: Check database tables
  fastify.get('/api/debug/tables', async (request, reply) => {
    try {
      const tables = await db.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
      `;
      
      return {
        success: true,
        tables
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // Debug: Get all players in database (DB-level)
  // Renamed to /api/debug/db/players to avoid collision with runtime debug routes
  fastify.get('/api/debug/db/players', async (request, reply) => {
    try {
      logger.debug('Getting debug players...');
      
      // Test basic connection
      await db.$queryRaw`SELECT 1`;
      logger.debug('Database connection OK');
      
      // Count identities
      const count = await db.playerIdentity.count();
      logger.debug('Player identity count:', { count });
      
      if (count === 0) {
        return {
          success: true,
          message: 'No player identities in database',
          count: 0,
          players: []
        };
      }
      
      // Get identities with related data
      const identities = await db.playerIdentity.findMany({ 
        take: 5,
        include: {
          auths: true,
          names: true,
          connections: true,
          gameConnections: {
            orderBy: { joinedAt: 'desc' },
            take: 1
          }
        }
      });
      
      logger.debug('Retrieved identities:', { count: identities.length });
      
      return {
        success: true,
        count: identities.length,
        players: identities.map(identity => ({
          id: identity.id,
          primaryAuth: identity.primaryAuth,
          primaryConn: identity.primaryConn,
          auths: identity.auths.map(a => a.auth),
          names: identity.names.map(n => n.name),
          connections: identity.connections.map(c => c.conn),
          lastConnection: identity.gameConnections[0] || null,
          firstSeen: identity.firstSeen,
          lastSeen: identity.lastSeen
        }))
      };
    } catch (error) {
      logger.error('Failed to get debug players', { error: error.message, stack: error.stack });
      return reply.status(500).send({ 
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });

  // Get player statistics summary
  fastify.get('/api/rooms/:ruid/players/stats', async (request, reply) => {
    try {
      const { ruid } = request.params as { ruid: string };
      
      const players = await playerIdentityManager.getRoomPlayers(ruid);
      
      const stats = {
        totalPlayers: players.length,
        totalGoals: 0,     // Will be calculated from PlayerStats
        totalAssists: 0,   // Will be calculated from PlayerStats
        averageRating: 1000, // Will be calculated from PlayerStats,
        topPlayers: players
          .slice(0, 10)
          .map(p => ({
            name: p.currentConnection?.name || 'Unknown',
            rating: 1000, // From PlayerStats
            goals: 0,     // From PlayerStats
            assists: 0,   // From PlayerStats
            allNames: p.allNames
          }))
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Failed to get player statistics', { error });
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  });
}