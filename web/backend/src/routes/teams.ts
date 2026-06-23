import { FastifyInstance } from 'fastify';
import axios from 'axios';
import { createLogger } from '../shared/logger';

const logger = createLogger('TEAMS-ROUTES');
const CORE_SERVER_URL = `http://localhost:${process.env.CORE_PORT || 3001}`;

export async function teamsRoutes(fastify: FastifyInstance) {
  // Get all teams
  fastify.get('/api/teams', async (request, reply) => {
    try {
      logger.debug('🔄 Proxying teams request to core server');
      const response = await axios.get(`${CORE_SERVER_URL}/api/teams`);
      return response.data;
    } catch (error) {
      logger.error('🔄 Failed to get teams from core server', String(error));
      return reply.code(500).send({ error: 'Failed to get teams' });
    }
  });

  // Update team
  fastify.put('/api/teams/:teamName', async (request, reply) => {
    const { teamName } = request.params as any;
    try {
      logger.debug('🔄 Proxying team update request to core server', { teamName });
      const response = await axios.put(`${CORE_SERVER_URL}/api/teams/${teamName}`, request.body);
      return response.data;
    } catch (error) {
      logger.error('🔄 Failed to update team via core server', String(error), { teamName });
      return reply.code(500).send({ error: 'Failed to update team' });
    }
  });

  // Get all matches
  fastify.get('/api/matches', async (request, reply) => {
    try {
      logger.debug('🔄 Proxying matches request to core server');
      const response = await axios.get(`${CORE_SERVER_URL}/api/matches`);
      return response.data;
    } catch (error) {
      logger.error('🔄 Failed to get matches from core server', String(error));
      return reply.code(500).send({ error: 'Failed to get matches' });
    }
  });

  // Update matches
  fastify.put('/api/matches', async (request, reply) => {
    try {
      logger.debug('🔄 Proxying matches update request to core server');
      const response = await axios.put(`${CORE_SERVER_URL}/api/matches`, request.body);
      return response.data;
    } catch (error) {
      logger.error('🔄 Failed to update matches via core server', String(error));
      return reply.code(500).send({ error: 'Failed to update matches' });
    }
  });

  // Get random match
  fastify.get('/api/matches/random', async (request, reply) => {
    try {
      logger.debug('🔄 Proxying random match request to core server');
      const response = await axios.get(`${CORE_SERVER_URL}/api/matches/random`);
      return response.data;
    } catch (error) {
      logger.error('🔄 Failed to get random match from core server', String(error));
      return reply.code(500).send({ error: 'Failed to get random match' });
    }
  });
}