import { FastifyInstance } from 'fastify';

export async function debugRoutes(fastify: FastifyInstance) {
  // Get all database tables and their data
  fastify.get('/api/debug/database', async (request, reply) => {
    try {
      const coreUrl = process.env.CORE_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${coreUrl}/api/debug/database`);
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch database debug info' });
    }
  });
}