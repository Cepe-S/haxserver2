import { FastifyInstance } from 'fastify';
import { db } from '@mikuserverpro/database';

export async function adminPasswordsRoutes(fastify: FastifyInstance) {
  
  // Obtener contraseñas de admin de una imagen
  fastify.get('/api/server-images/:id/admin-passwords', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const passwords = await db.adminPassword.findMany({
        where: { 
          serverImageId: id,
          isActive: true 
        },
        select: {
          id: true,
          password: true,
          description: true,
          level: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return { passwords };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch admin passwords' });
    }
  });

  // Crear nueva contraseña de admin
  fastify.post('/api/server-images/:id/admin-passwords', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { password, description, level } = request.body as {
      password: string;
      description: string;
      level: 'admin' | 'superadmin';
    };

    if (!password || !description || !level) {
      return reply.code(400).send({ error: 'Password, description and level are required' });
    }

    if (!['admin', 'superadmin'].includes(level)) {
      return reply.code(400).send({ error: 'Level must be admin or superadmin' });
    }

    try {
      const adminPassword = await db.adminPassword.create({
        data: {
          serverImageId: id,
          password,
          description,
          level
        }
      });

      return { adminPassword };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to create admin password' });
    }
  });

  // Actualizar contraseña de admin
  fastify.put('/api/admin-passwords/:passwordId', async (request, reply) => {
    const { passwordId } = request.params as { passwordId: string };
    const { password, description, level } = request.body as {
      password?: string;
      description?: string;
      level?: 'admin' | 'superadmin';
    };

    try {
      const adminPassword = await db.adminPassword.update({
        where: { id: passwordId },
        data: {
          ...(password && { password }),
          ...(description && { description }),
          ...(level && { level })
        }
      });

      return { adminPassword };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to update admin password' });
    }
  });

  // Eliminar contraseña de admin
  fastify.delete('/api/admin-passwords/:passwordId', async (request, reply) => {
    const { passwordId } = request.params as { passwordId: string };

    try {
      await db.adminPassword.update({
        where: { id: passwordId },
        data: { isActive: false }
      });

      return { success: true };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to delete admin password' });
    }
  });
}