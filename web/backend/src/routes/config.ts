import { FastifyInstance } from 'fastify';
import { BALANCE_MODES, AVAILABLE_STADIUMS } from '../types/ServerConfig';
import { createLogger } from '../shared/logger';

const logger = createLogger('CONFIG-API');

export async function configRoutes(fastify: FastifyInstance) {
  
  // Get available balance modes
  fastify.get('/api/config/balance-modes', async (request, reply) => {
    try {
      return {
        modes: BALANCE_MODES,
        default: 'jt'
      };
    } catch (error) {
      logger.error('Failed to get balance modes', error);
      return reply.code(500).send({ error: 'Failed to get balance modes' });
    }
  });

  // Get available stadiums
  fastify.get('/api/config/stadiums', async (request, reply) => {
    try {
      return {
        stadiums: AVAILABLE_STADIUMS,
        default: 'futx4'
      };
    } catch (error) {
      logger.error('Failed to get stadiums', error);
      return reply.code(500).send({ error: 'Failed to get stadiums' });
    }
  });

  // Get all configuration options
  fastify.get('/api/config/all', async (request, reply) => {
    try {
      return {
        balanceModes: BALANCE_MODES,
        stadiums: AVAILABLE_STADIUMS,
        defaults: {
          balanceMode: 'jt',
          stadium: 'futx4',
          maxPlayersPerTeam: 4,
          minPlayers: 4
        }
      };
    } catch (error) {
      logger.error('Failed to get all config', error);
      return reply.code(500).send({ error: 'Failed to get configuration' });
    }
  });
}