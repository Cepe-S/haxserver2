import { FastifyInstance } from 'fastify';
import { PlayerCacheManager } from '../../shared/player/PlayerCacheManager';

// Variable global para almacenar referencias a los sistemas
// Se configurará desde HaxballRoom cuando se inicialice
let gameLoopController: any = null;
let balanceManager: any = null;
let haxballRoom: any = null;

/**
 * Configura las referencias a los sistemas para debug
 */
export function setupDebugReferences(controller: any, balance: any, room: any): void {
  gameLoopController = controller;
  balanceManager = balance;
  haxballRoom = room;
}

export async function debugRoutes(fastify: FastifyInstance) {
  
  // ==================== GAME LOOP DEBUG ====================
  
  /**
   * GET /api/debug/gameloop
   * Información completa del sistema de Game Loops
   */
  fastify.get('/api/debug/gameloop', async (request, reply) => {
    try {
      if (!gameLoopController) {
        // If game loop controller is not initialized yet (no room running),
        // return a friendly, minimal debug payload instead of a 503 so the
        // frontend debug page can render a helpful view.
        return reply.send({
          loop: {
            active: 'none',
            state: 'IDLE',
            uptime: '00:00:00',
            isTransitioning: false
          },
          players: {
            total: 0,
            red: 0,
            blue: 0,
            spectators: 0,
            minRequired: 0
          },
          balance: null,
          currentMatch: null,
          transitions: {
            total: 0,
            recent: []
          },
          stats: {
            training: { activations: 0, totalTime: 0 },
            match: { activations: 0, totalTime: 0, matchesPlayed: 0 }
          },
          timestamp: new Date().toISOString(),
          initialized: false
        });
      }

      const activeLoop = gameLoopController.getActiveLoop();
      const activeLoopName = gameLoopController.getActiveLoopName();
      const playerCache = PlayerCacheManager.getInstance();
      const allPlayers = playerCache.getAllPlayers();
      const teamCounts = playerCache.getActiveTeamCounts();

      const response = {
        loop: {
          active: activeLoopName || 'none',
          state: activeLoop?.getState() || 'IDLE',
          uptime: activeLoop ? formatUptime(activeLoop.getDebugInfo().uptime) : '00:00:00',
          isTransitioning: gameLoopController.getDebugInfo().controller.isTransitioning
        },
        
        players: {
          total: allPlayers.length,
          red: allPlayers.filter(p => p.team === 1).length,
          blue: allPlayers.filter(p => p.team === 2).length,
          spectators: allPlayers.filter(p => p.team === 0).length,
          minRequired: gameLoopController.getDebugInfo().controller.minPlayers
        },
        
        balance: balanceManager ? {
          mode: balanceManager.getConfig().mode,
          enabled: balanceManager.getConfig().enabled,
          maxPlayersPerTeam: balanceManager.getConfig().maxPlayersPerTeam,
          queue: balanceManager.getDebugData().queue || [],
          queueLength: balanceManager.getDebugData().queueLength || 0,
          isProcessing: balanceManager.getDebugData().isProcessing,
          recentActions: balanceManager.getDebugData().recentActions?.slice(0, 5) || []
        } : null,
        
        currentMatch: activeLoopName === 'match' && activeLoop ? {
          stadium: activeLoop.getDebugInfo().config.stadiumName,
          settings: {
            timeLimit: activeLoop.getDebugInfo().config.timeLimit,
            scoreLimit: activeLoop.getDebugInfo().config.scoreLimit,
            teamLock: activeLoop.getDebugInfo().config.teamLock
          },
          teams: activeLoop.getCurrentMatch() ? {
            home: activeLoop.getCurrentMatch().homeTeam,
            away: activeLoop.getCurrentMatch().awayTeam
          } : null
        } : null,
        
        transitions: {
          total: gameLoopController.getTransitionHistory().length,
          recent: gameLoopController.getTransitionHistory().slice(0, 10)
        },
        
        stats: gameLoopController.getStats(),
        
        timestamp: new Date().toISOString()
      };

      return reply.send(response);
      
    } catch (error) {
      return reply.code(500).send({
        error: 'Failed to get game loop debug info',
        message: error.message
      });
    }
  });

  /**
   * GET /api/debug/gameloop/history
   * Historial completo de transiciones
   */
  fastify.get('/api/debug/gameloop/history', async (request, reply) => {
    try {
      if (!gameLoopController) {
        return reply.code(503).send({
          error: 'Game loop system not initialized'
        });
      }

      const history = gameLoopController.getTransitionHistory();

      return reply.send({
        total: history.length,
        transitions: history,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return reply.code(500).send({
        error: 'Failed to get transition history',
        message: error.message
      });
    }
  });

  /**
   * POST /api/debug/gameloop/transition
   * Forzar transición a un loop específico (para testing)
   */
  fastify.post('/api/debug/gameloop/transition', async (request, reply) => {
    try {
      if (!gameLoopController) {
        return reply.code(503).send({
          error: 'Game loop system not initialized'
        });
      }

      const { loop, reason } = request.body as any;

      if (!loop) {
        return reply.code(400).send({
          error: 'Missing required parameter: loop'
        });
      }

      if (!['training', 'match'].includes(loop)) {
        return reply.code(400).send({
          error: 'Invalid loop name. Must be: training or match'
        });
      }

      await gameLoopController.transitionTo(loop, reason || 'manual (debug endpoint)');

      return reply.send({
        success: true,
        message: `Transition to ${loop} initiated`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return reply.code(500).send({
        error: 'Failed to transition loop',
        message: error.message
      });
    }
  });

  // ==================== BALANCE DEBUG ====================
  
  /**
   * GET /api/debug/balance
   * Información detallada del sistema de balance
   */
  fastify.get('/api/debug/balance', async (request, reply) => {
    try {
      if (!balanceManager) {
        return reply.code(503).send({
          error: 'Balance manager not initialized'
        });
      }

      const debugData = balanceManager.getDebugData();
      const status = balanceManager.getStatus();

      return reply.send({
        config: debugData.config,
        state: {
          enabled: status.enabled,
          mode: status.mode,
          isProcessing: debugData.isProcessing
        },
        teams: {
          red: debugData.redCount,
          blue: debugData.blueCount,
          difference: Math.abs(debugData.redCount - debugData.blueCount)
        },
        queue: {
          length: debugData.queueLength,
          players: debugData.queue
        },
        recentActions: debugData.recentActions,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return reply.code(500).send({
        error: 'Failed to get balance debug info',
        message: error.message
      });
    }
  });

  // ==================== PLAYERS DEBUG ====================
  
  /**
   * GET /api/debug/players
   * Lista de todos los jugadores conectados
   */
  fastify.get('/api/debug/players', async (request, reply) => {
    try {
      const playerCache = PlayerCacheManager.getInstance();
      const allPlayers = playerCache.getAllPlayers();
      const teamCounts = playerCache.getActiveTeamCounts();

      return reply.send({
        total: allPlayers.length,
        teams: {
          spectators: allPlayers.filter(p => p.team === 0).length,
          red: allPlayers.filter(p => p.team === 1).length,
          blue: allPlayers.filter(p => p.team === 2).length
        },
        players: allPlayers.map((p: any) => ({
          haxballId: p.haxballId,
          name: p.name,
          team: p.team,
          auth: p.auth,
          conn: p.conn,
          admin: p.admin,
          isAfk: p.isAfk,
          identityId: p.identityId
        })),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return reply.code(500).send({
        error: 'Failed to get players info',
        message: error.message
      });
    }
  });

  // ==================== SYSTEM STATUS ====================
  
  /**
   * GET /api/debug/status
   * Estado general del sistema
   */
  fastify.get('/api/debug/status', async (request, reply) => {
    try {
      const activeLoopName = gameLoopController?.getActiveLoopName();
      const playerCache = haxballRoom?.playerCache;
      const teamCounts = playerCache ? playerCache.getActiveTeamCounts() : { red: 0, blue: 0 };

      return reply.send({
        haxballRoom: {
          initialized: !!haxballRoom,
          ruid: haxballRoom?.ruid || null
        },
        gameLoop: {
          initialized: !!gameLoopController,
          activeLoop: activeLoopName || 'none',
          isTransitioning: gameLoopController?.getDebugInfo().controller.isTransitioning || false
        },
        balance: {
          initialized: !!balanceManager,
          enabled: balanceManager?.getConfig().enabled || false,
          mode: balanceManager?.getConfig().mode || 'unknown'
        },
        players: {
          total: teamCounts.red + teamCounts.blue,
          red: teamCounts.red,
          blue: teamCounts.blue
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return reply.code(500).send({
        error: 'Failed to get system status',
        message: error.message
      });
    }
  });
}

/**
 * Formatea el uptime en formato HH:MM:SS
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}