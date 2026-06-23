import { FastifyInstance } from 'fastify';
import { db } from '@mikuserverpro/database';

export async function cleanupRoutes(fastify: FastifyInstance) {
  // Clean up error rooms
  fastify.delete('/api/cleanup/error-rooms', async (request, reply) => {
    try {
      const result = await db.serverImage.deleteMany({
        where: {
          status: 'error'
        }
      });
      
      return { deleted: result.count };
    } catch (error) {
      fastify.log.error('Failed to cleanup error rooms');
      return reply.code(500).send({ error: 'Failed to cleanup error rooms' });
    }
  });

  // Clean up all rooms
  fastify.delete('/api/cleanup/all-rooms', async (request, reply) => {
    try {
      const result = await db.serverImage.deleteMany({});
      
      return { deleted: result.count };
    } catch (error) {
      fastify.log.error('Failed to cleanup all rooms');
      return reply.code(500).send({ error: 'Failed to cleanup all rooms' });
    }
  });
}