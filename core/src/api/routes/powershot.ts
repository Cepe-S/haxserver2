import { FastifyInstance } from 'fastify';
import { PowershotMode } from '../../shared/powershot/PowershotManager';

export async function powershotRoutes(fastify: FastifyInstance, activeRooms?: Map<string, any>) {
  // GET /api/powershot/:ruid - Obtener estado del powershot
  fastify.get('/powershot/:ruid', async (request, reply) => {
    const { ruid } = request.params as { ruid: string };

    try {
      const room = activeRooms?.get(ruid);
      
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const powershotManager = room.getPowershotManager();
      if (!powershotManager) {
        return reply.code(404).send({ error: 'Powershot manager not available' });
      }

      const status = powershotManager.getStatus();
      const modeInfo = powershotManager.getModeInfo();

      return {
        success: true,
        data: {
          ...status,
          modeInfo,
          availableModes: Object.values(PowershotMode)
        }
      };
    } catch (error) {
      fastify.log.error('Error getting powershot status: ' + error.message);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/powershot/:ruid/mode - Cambiar modo de powershot
  fastify.post('/powershot/:ruid/mode', {
    schema: {
      body: {
        type: 'object',
        required: ['mode'],
        properties: {
          mode: {
            type: 'string',
            enum: Object.values(PowershotMode)
          }
        }
      }
    }
  }, async (request, reply) => {
    const { ruid } = request.params as { ruid: string };
    const { mode } = request.body as { mode: PowershotMode };

    try {
      const room = activeRooms?.get(ruid);
      
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const powershotManager = room.getPowershotManager();
      if (!powershotManager) {
        return reply.code(404).send({ error: 'Powershot manager not available' });
      }

      const oldMode = powershotManager.getMode();
      powershotManager.setMode(mode);
      const modeInfo = powershotManager.getModeInfo();

      fastify.log.info('Powershot mode changed: ' + oldMode + ' → ' + mode + ' for room ' + ruid);

      return {
        success: true,
        data: {
          oldMode,
          newMode: mode,
          modeInfo
        }
      };
    } catch (error) {
      fastify.log.error('Error changing powershot mode: ' + error.message);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/powershot/:ruid/debug - Información de debug
  fastify.get('/powershot/:ruid/debug', async (request, reply) => {
    const { ruid } = request.params as { ruid: string };

    try {
      const room = activeRooms?.get(ruid);
      
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const powershotManager = room.getPowershotManager();
      if (!powershotManager) {
        return reply.code(404).send({ error: 'Powershot manager not available' });
      }

      const debugInfo = powershotManager.getDebugInfo();

      return {
        success: true,
        data: debugInfo
      };
    } catch (error) {
      fastify.log.error('Error getting powershot debug info: ' + error.message);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/powershot/:ruid/reset - Resetear powershot activo
  fastify.post('/powershot/:ruid/reset', async (request, reply) => {
    const { ruid } = request.params as { ruid: string };

    try {
      const room = activeRooms?.get(ruid);
      
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const powershotManager = room.getPowershotManager();
      if (!powershotManager) {
        return reply.code(404).send({ error: 'Powershot manager not available' });
      }

      powershotManager.resetPowershot();

      return {
        success: true,
        message: 'Powershot reset successfully'
      };
    } catch (error) {
      fastify.log.error('Error resetting powershot: ' + error.message);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}