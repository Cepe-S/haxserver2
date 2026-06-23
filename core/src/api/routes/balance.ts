import { FastifyInstance } from 'fastify';
import { createLogger } from '../../shared/logger/Logger';

const logger = createLogger('BALANCE-API');

export async function balanceRoutes(fastify: FastifyInstance, rooms: Map<string, any>) {
  
  // Get balance debug data for a room
  fastify.get('/api/rooms/:ruid/balance-debug', async (request, reply) => {
    const { ruid } = request.params as any;
    
    try {
      const room = rooms.get(ruid);
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const debugData = room.getBalanceDebugData();
      const gameLoopController = room.getGameLoopController();
      const playerCache = room.playerCache;
      
      const teamCounts = playerCache ? playerCache.getActiveTeamCounts() : { red: 0, blue: 0 };
      const activeLoop = gameLoopController?.getActiveLoop();
      const activeLoopName = gameLoopController?.getActiveLoopName();
      
      const response: any = {
        ruid,
        status: room.getBalanceStatus(),
        debugActions: debugData.recentActions || [],
        timestamp: new Date().toISOString()
      };

      // Add game loop info if available
      if (gameLoopController) {
        response.gameLoop = {
          activeLoop: activeLoopName || 'none',
          state: activeLoop?.getState() || 'IDLE',
          uptime: activeLoop?.getDebugInfo().uptime || 0,
          isTransitioning: gameLoopController.getDebugInfo().controller.isTransitioning,
          stats: gameLoopController.getStats(),
          transitions: gameLoopController.getTransitionHistory().slice(0, 5)
        };
      }

      // Add player info
      if (playerCache) {
        response.players = {
          total: teamCounts.red + teamCounts.blue,
          red: teamCounts.red,
          blue: teamCounts.blue,
          spectators: playerCache.getPlayersInTeam(0).length
        };
      }

      // Add current match info if in match loop
      if (activeLoopName === 'match' && activeLoop) {
        const debugInfo = activeLoop.getDebugInfo();
        response.currentMatch = {
          stadium: debugInfo.config?.stadiumName || 'unknown',
          settings: {
            timeLimit: debugInfo.config?.timeLimit || 0,
            scoreLimit: debugInfo.config?.scoreLimit || 0
          },
          teams: activeLoop.getCurrentMatch ? activeLoop.getCurrentMatch() : null
        };
      }
      
      return response;
    } catch (error) {
      logger.error('Failed to get balance debug data', error, { ruid });
      return reply.code(500).send({ error: 'Failed to get balance debug data' });
    }
  });

  // Get balance status for a room
  fastify.get('/api/rooms/:ruid/balance-status', async (request, reply) => {
    const { ruid } = request.params as any;
    
    try {
      const room = rooms.get(ruid);
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const status = room.getBalanceStatus();
      
      return {
        ruid,
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get balance status', error, { ruid });
      return reply.code(500).send({ error: 'Failed to get balance status' });
    }
  });

  // Get balance configuration for a room
  fastify.get('/api/rooms/:ruid/balance-config', async (request, reply) => {
    const { ruid } = request.params as any;
    
    try {
      const room = rooms.get(ruid);
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const balanceManager = room.getBalanceManager();
      const config = balanceManager.getConfig();
      
      return {
        ruid,
        config,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get balance config', error, { ruid });
      return reply.code(500).send({ error: 'Failed to get balance config' });
    }
  });

  // Trigger balance for a room
  fastify.post('/api/rooms/:ruid/balance', async (request, reply) => {
    const { ruid } = request.params as any;
    
    try {
      const room = rooms.get(ruid);
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      await room.triggerBalance();
      
      logger.info('Balance triggered manually', { ruid });
      
      return {
        success: true,
        message: 'Balance triggered successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to trigger balance', error, { ruid });
      return reply.code(500).send({ error: 'Failed to trigger balance' });
    }
  });

  // Update balance configuration for a room
  fastify.put('/api/rooms/:ruid/balance-config', async (request, reply) => {
    const { ruid } = request.params as any;
    const { config } = request.body as any;
    
    try {
      const room = rooms.get(ruid);
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const balanceManager = room.getBalanceManager();
      balanceManager.setConfig(config);
      
      logger.info('Balance config updated', { ruid, config });
      
      return {
        success: true,
        config: balanceManager.getConfig(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to update balance config', error, { ruid });
      return reply.code(500).send({ error: 'Failed to update balance config' });
    }
  });

  // Get complete debug state including game loop info
  fastify.get('/api/rooms/:ruid/balance-debug-state', async (request, reply) => {
    const { ruid } = request.params as any;
    
    try {
      const room = rooms.get(ruid);
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const balanceManager = room.getBalanceManager();
      const gameLoopController = room.getGameLoopController();
      const playerCache = room.playerCache;
      
      const teamCounts = playerCache ? playerCache.getActiveTeamCounts() : { red: 0, blue: 0 };
      const activeLoop = gameLoopController?.getActiveLoop();
      const activeLoopName = gameLoopController?.getActiveLoopName();
      
      const debugState = {
        balance: balanceManager.getDebugData(),
        gameLoop: gameLoopController ? {
          activeLoop: activeLoopName || 'none',
          state: activeLoop?.getState() || 'IDLE',
          uptime: activeLoop?.getDebugInfo().uptime || 0,
          isTransitioning: gameLoopController.getDebugInfo().controller.isTransitioning,
          stats: gameLoopController.getStats(),
          transitions: gameLoopController.getTransitionHistory().slice(0, 5)
        } : null,
        players: {
          total: teamCounts.red + teamCounts.blue,
          red: teamCounts.red,
          blue: teamCounts.blue,
          spectators: playerCache ? playerCache.getPlayersInTeam(0).length : 0
        },
        currentMatch: activeLoopName === 'match' && activeLoop ? {
          stadium: activeLoop.getDebugInfo().config.stadiumName,
          settings: {
            timeLimit: activeLoop.getDebugInfo().config.timeLimit,
            scoreLimit: activeLoop.getDebugInfo().config.scoreLimit
          },
          teams: activeLoop.getCurrentMatch() ? {
            home: activeLoop.getCurrentMatch().homeTeam,
            away: activeLoop.getCurrentMatch().awayTeam
          } : null
        } : null
      };
      
      return {
        ruid,
        debugState,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get debug state', error, { ruid });
      return reply.code(500).send({ error: 'Failed to get debug state' });
    }
  });
}