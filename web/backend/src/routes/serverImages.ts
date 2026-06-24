import { FastifyInstance } from 'fastify';
import { db } from '@mikuserverpro/database';
import axios from 'axios';
import { createLogger } from '../shared/logger';
import { DEFAULT_SERVER_CONFIG, ServerImageConfig } from '../types/ServerConfig';

const logger = createLogger('SERVER-IMAGES');

const CORE_SERVER_URL = `http://localhost:${process.env.CORE_PORT || 3001}`;

const INACTIVE_IMAGE_DATA = {
  status: 'inactive' as const,
  ruid: null,
  roomLink: null,
  token: null
};

async function getActiveRoomRuids(): Promise<string[]> {
  try {
    const response = await axios.get(`${CORE_SERVER_URL}/api/rooms`, { timeout: 5000 });
    return response.data.rooms.map((room: { ruid: string }) => room.ruid);
  } catch (error: any) {
    logger.warn('Failed to get active rooms from core server', { error: error.message });
    return [];
  }
}

/** Resetea imágenes "running" en BD sin sala activa en core. */
export async function syncServerImageStates(): Promise<{
  synced: number;
  totalRunning: number;
  activeRooms: number;
}> {
  const runningImages = await db.serverImage.findMany({ where: { status: 'running' } });
  const activeRooms = await getActiveRoomRuids();
  let synced = 0;

  for (const image of runningImages) {
    if (!image.ruid || !activeRooms.includes(image.ruid)) {
      await db.serverImage.update({
        where: { id: image.id },
        data: INACTIVE_IMAGE_DATA
      });
      synced++;
      logger.info('Synced orphaned server image to inactive', { id: image.id, ruid: image.ruid });
    }
  }

  return {
    synced,
    totalRunning: runningImages.length,
    activeRooms: activeRooms.length
  };
}

async function isRoomActiveInCore(ruid: string | null): Promise<boolean> {
  if (!ruid) return false;
  const active = await getActiveRoomRuids();
  return active.includes(ruid);
}

export async function serverImageRoutes(fastify: FastifyInstance) {
  const runSync = async (reason: string) => {
    try {
      const result = await syncServerImageStates();
      if (result.synced > 0) {
        logger.system(`Server image sync (${reason})`, result);
      }
    } catch (error: any) {
      logger.warn(`Server image sync failed (${reason})`, { error: error.message });
    }
  };

  setTimeout(() => runSync('startup'), 5000);
  setInterval(() => runSync('interval'), 60_000);
  // Get all server images
  fastify.get('/api/server-images', async (request, reply) => {
    try {
      const images = await db.serverImage.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      // Parse config for each image
      const parsedImages = images.map(image => ({
        ...image,
        config: JSON.parse(image.config)
      }));
      
      return { images: parsedImages };
    } catch (error) {
      logger.error('Failed to fetch server images', error);
      return reply.code(500).send({ error: 'Failed to fetch server images' });
    }
  });

  // Get single server image
  fastify.get('/api/server-images/:id', async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      logger.debug('Fetching server image by ID', { id });
      const image = await db.serverImage.findUnique({
        where: { id }
      });
      
      if (!image) {
        return reply.code(404).send({ error: 'Server image not found' });
      }
      
      // Parse config for response
      const parsedImage = {
        ...image,
        config: JSON.parse(image.config)
      };
      
      return { image: parsedImage };
    } catch (error) {
      logger.error('Failed to fetch server image', error, { id });
      return reply.code(500).send({ error: 'Failed to fetch server image' });
    }
  });

  // Create server image
  fastify.post('/api/server-images', async (request, reply) => {
    const { name, description, config } = request.body as any;
    
    try {
      logger.info('Creating server image', { name, description });
      
      // Merge with default config to ensure all fields are present
      const finalConfig: ServerImageConfig = {
        ...DEFAULT_SERVER_CONFIG,
        ...config,
        _config: {
          ...DEFAULT_SERVER_CONFIG._config,
          ...config?._config
        },
        settings: {
          ...DEFAULT_SERVER_CONFIG.settings,
          ...config?.settings
        },
        rules: {
          ...DEFAULT_SERVER_CONFIG.rules,
          ...config?.rules,
          requisite: {
            ...DEFAULT_SERVER_CONFIG.rules.requisite,
            ...config?.rules?.requisite
          }
        }
      };
      
      const image = await db.serverImage.create({
        data: {
          name,
          description,
          config: JSON.stringify(finalConfig)
        }
      });
      
      logger.success('Server image created successfully', { id: image.id, name: image.name });
      return { image: { ...image, config: finalConfig } };
    } catch (error) {
      logger.error('Failed to create server image', error);
      return reply.code(500).send({ error: 'Failed to create server image' });
    }
  });

  // Update server image
  fastify.put('/api/server-images/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { name, description, config, ruid } = request.body as any;
    
    try {
      logger.info('Updating server image', { id, name, description });
      
      const existingImage = await db.serverImage.findUnique({
        where: { id }
      });
      
      if (!existingImage) {
        return reply.code(404).send({ error: 'Server image not found' });
      }
      
      if (existingImage.status === 'running') {
        return reply.code(409).send({ error: 'Cannot edit running server image. Stop it first.' });
      }
      
      // Parse existing config and merge with updates
      const existingConfig = JSON.parse(existingImage.config);
      const finalConfig: ServerImageConfig = {
        ...existingConfig,
        ...config,
        ruid: ruid || existingConfig.ruid, // Permitir cambiar RUID base
        _config: {
          ...existingConfig._config,
          ...config?._config
        },
        settings: {
          ...existingConfig.settings,
          ...config?.settings
        },
        rules: {
          ...existingConfig.rules,
          ...config?.rules,
          requisite: {
            ...existingConfig.rules.requisite,
            ...config?.rules?.requisite
          }
        }
      };
      
      const updatedImage = await db.serverImage.update({
        where: { id },
        data: {
          name: name || existingImage.name,
          description: description || existingImage.description,
          config: JSON.stringify(finalConfig)
        }
      });
      
      logger.success('Server image updated successfully', { id: updatedImage.id, name: updatedImage.name });
      return { image: { ...updatedImage, config: finalConfig } };
    } catch (error) {
      logger.error('Failed to update server image', error, { id });
      return reply.code(500).send({ error: 'Failed to update server image' });
    }
  });

  // Execute server image (create room from image)
  fastify.post('/api/server-images/:id/execute', async (request, reply) => {
    const { id } = request.params as any;
    const { token } = request.body as any;
    
    if (!token) {
      return reply.code(400).send({ error: 'Haxball token is required' });
    }
    
    try {
      logger.info('Executing server image', { id, hasToken: !!token });
      
      const image = await db.serverImage.findUnique({
        where: { id }
      });
      
      if (!image) {
        return reply.code(404).send({ error: 'Server image not found' });
      }

      // Recuperar huérfanos (BD running sin sala en core)
      if (image.status === 'running' && !(await isRoomActiveInCore(image.ruid))) {
        logger.warn('Resetting orphan running image before execute', { id, ruid: image.ruid });
        await db.serverImage.update({
          where: { id },
          data: INACTIVE_IMAGE_DATA
        });
        image = await db.serverImage.findUnique({ where: { id } });
        if (!image) {
          return reply.code(404).send({ error: 'Server image not found' });
        }
      }

      if (image.status === 'running') {
        logger.warn('Attempted to execute already running image', { id, currentStatus: image.status });
        return reply.code(409).send({
          error: 'Server image is already running',
          currentStatus: image.status,
          ruid: image.ruid
        });
      }

      await syncServerImageStates();

      const otherRunning = await db.serverImage.count({
        where: { status: 'running', id: { not: id } }
      });

      if (otherRunning > 0) {
        logger.warn('Another server image is already running', { runningCount: otherRunning });
        return reply.code(409).send({
          error: 'Another server image is already running. Stop it first.',
          runningCount: otherRunning
        });
      }
      
      const config: ServerImageConfig = JSON.parse(image.config);
      config._config.token = token;
      
      // Usar RUID directamente de la configuración de la imagen
      const ruid = config.ruid;
      
      // Validar que el RUID no esté en uso
      const existingRuid = await db.serverImage.findFirst({
        where: { 
          ruid,
          status: 'running'
        }
      });
      
      if (existingRuid) {
        return reply.code(409).send({ 
          error: 'RUID is already in use by another running server',
          conflictingRuid: ruid,
          conflictingImageId: existingRuid.id
        });
      }
      
      logger.info('Using RUID from image config', { id, ruid });
      
      logger.debug('Setting image status to running', { id, ruid });
      
      // Update image status to running BEFORE creating room
      await db.serverImage.update({
        where: { id },
        data: {
          status: 'running',
          ruid,
          token
        }
      });
      
      // Send to core server to actually create the Haxball room
      try {
        logger.debug('Creating Haxball room in core server', { ruid });
        
        const response = await axios.post(`${CORE_SERVER_URL}/api/rooms`, {
          ruid,
          config: config
        }, {
          timeout: 45000 // 45 seconds timeout for Haxball
        });
        
        logger.success('Haxball room created successfully', { 
          ruid, 
          roomLink: response.data.link 
        });
        
        // Update image with room link
        await db.serverImage.update({
          where: { id },
          data: {
            roomLink: response.data.link
          }
        });
        
        return { 
          image: { 
            ...image, 
            status: 'running', 
            ruid, 
            roomLink: response.data.link 
          }, 
          haxballRoom: response.data 
        };
        
      } catch (error) {
        logger.error('Haxball room creation failed', error, { ruid, id });
        
        // CRITICAL: Reset image status to inactive on failure
        await db.serverImage.update({
          where: { id },
          data: {
            status: 'inactive',
            ruid: null,
            token: null,
            roomLink: null
          }
        });
        
        const errorMessage = error.response?.data?.details || error.message || 'Unknown error';
        throw new Error(`Failed to create Haxball room: ${errorMessage}`);
      }
      
    } catch (error) {
      logger.error('Failed to execute server image', error, { id });
      return reply.code(500).send({ 
        error: 'Failed to execute server image',
        details: error.message
      });
    }
  });

  // Stop server image with robust cleanup
  fastify.post('/api/server-images/:id/stop', async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      logger.info('Stopping server image', { id });
      
      const image = await db.serverImage.findUnique({
        where: { id }
      });
      
      if (!image) {
        return reply.code(404).send({ error: 'Server image not found' });
      }
      
      if (image.status !== 'running') {
        logger.warn('Attempted to stop non-running image', { id, currentStatus: image.status });
        return reply.code(409).send({ 
          error: 'Server image is not running',
          currentStatus: image.status
        });
      }
      
      // Close room in core server
      if (image.ruid) {
        try {
          logger.debug('Closing room in core server', { ruid: image.ruid });
          await axios.delete(`${CORE_SERVER_URL}/api/rooms/${image.ruid}`, {
            timeout: 10000 // 10 second timeout for cleanup
          });
          logger.debug('Room closed successfully in core server');
        } catch (error) {
          logger.warn('Failed to close room in core server (may already be closed)', {
            ruid: image.ruid,
            error: error.message
          });
          // Continue anyway - room might already be closed
        }
      }
      
      // ALWAYS update image status to inactive
      const updatedImage = await db.serverImage.update({
        where: { id },
        data: {
          status: 'inactive',
          ruid: null,
          roomLink: null,
          token: null
        }
      });
      
      logger.success('Server image stopped successfully', { id });
      return { image: updatedImage };
      
    } catch (error) {
      logger.error('Failed to stop server image', error, { id });
      
      // Force update status even if stop failed
      try {
        await db.serverImage.update({
          where: { id },
          data: {
            status: 'inactive',
            ruid: null,
            roomLink: null,
            token: null
          }
        });
        logger.warn('Forced image status to inactive after stop failure', { id });
      } catch (dbError) {
        logger.error('Failed to force update image status', dbError, { id });
      }
      
      return reply.code(500).send({ 
        error: 'Failed to stop server image',
        details: error.message
      });
    }
  });

  // Delete server image
  fastify.delete('/api/server-images/:id', async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      const image = await db.serverImage.findUnique({
        where: { id }
      });
      
      if (!image) {
        return reply.code(404).send({ error: 'Server image not found' });
      }
      
      // Stop the image if it's running
      if (image.status === 'running' && image.ruid) {
        try {
          await axios.delete(`${CORE_SERVER_URL}/api/rooms/${image.ruid}`);
        } catch (error) {
          // Room might already be closed, continue anyway
        }
      }
      
      await db.serverImage.delete({
        where: { id }
      });
      
      return { success: true };
    } catch (error) {
      logger.error('❌ Failed to delete server image', error, { id });
      return reply.code(500).send({ error: 'Failed to delete server image' });
    }
  });

  fastify.post('/api/server-images/sync-states', async (_request, reply) => {
    try {
      logger.info('Syncing server image states with core server');
      const result = await syncServerImageStates();
      logger.success('Server image states synchronized', result);
      return result;
    } catch (error: any) {
      logger.error('Failed to sync server image states', error);
      return reply.code(500).send({
        error: 'Failed to sync server image states',
        details: error.message
      });
    }
  });

  // Check RUID availability
  fastify.get('/api/server-images/check-ruid/:ruid', async (request, reply) => {
    const { ruid } = request.params as any;
    
    try {
      // Verificar si el RUID está en uso por una imagen corriendo
      const existingImage = await db.serverImage.findFirst({
        where: { 
          ruid,
          status: 'running'
        }
      });
      
      const isAvailable = !existingImage;
      
      return {
        ruid,
        available: isAvailable,
        conflictingImage: existingImage ? {
          id: existingImage.id,
          name: existingImage.name,
          status: existingImage.status
        } : null
      };
    } catch (error) {
      logger.error('Failed to check RUID availability', error, { ruid });
      return reply.code(500).send({ 
        error: 'Failed to check RUID availability',
        details: error.message
      });
    }
  });
}