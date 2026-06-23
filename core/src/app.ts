import Fastify from 'fastify';
import { appConfig } from './shared/config/AppConfig';
import { db, connect, disconnect, healthCheck } from '@mikuserverpro/database';
import { HaxballRoom } from './haxball/HaxballRoom';
import { createLogger } from './shared/logger/Logger';
import { WebhookManager } from './shared/notifications/WebhookManager';
import { playersRoutes } from './api/routes/players';
import { balanceRoutes } from './api/routes/balance';
import { powershotRoutes } from './api/routes/powershot';
import { stadiumRoutes } from './api/routes/stadiums';
import { StadiumManager } from './shared/stadiums/StadiumManager';
import { teamsRoutes } from './api/routes/teams';
import { matchesRoutes } from './api/routes/matches';
import { debugRoutes } from './api/routes/debug';

/**
 * FASE 1.1: Servidor Fastify básico con Haxball room
 * Punto de entrada único del core server
 */

const logger = createLogger('CORE');

const fastify = Fastify({
  logger: false // Deshabilitamos el logger de Fastify para usar el nuestro
});

fastify.setErrorHandler((error, request, reply) => {
  logger.error('Fastify request error', error, {
    method: request.method,
    url: request.url,
  });
  const statusCode = (error as { statusCode?: number }).statusCode || 500;
  reply.status(statusCode).send({
    error: error.message || 'Internal Server Error',
  });
});

// Store active rooms
const activeRooms = new Map<string, HaxballRoom>();

/**
 * Health check endpoint
 */
fastify.get('/health', async (request, reply) => {
  const dbHealth = await healthCheck();
  
  return {
    status: 'ok',
    database: dbHealth ? 'connected' : 'disconnected',
    activeRooms: activeRooms.size,
    timestamp: new Date().toISOString()
  };
});

/**
 * FASE 1: API básica para crear/gestionar rooms
 */
fastify.post('/api/rooms', async (request, reply) => {
  const { ruid, config } = request.body as any;
  
  if (!ruid) {
    return reply.code(400).send({ error: 'RUID is required' });
  }

  if (activeRooms.has(ruid)) {
    return reply.code(409).send({ error: 'Room already exists' });
  }

  try {
    const room = new HaxballRoom(ruid, config);
    await room.initialize();
    
    const roomLink = await room.createRoom(config || {});
    
    activeRooms.set(ruid, room);
    
    logger.haxball('room created', ruid, { 
      roomLink: roomLink,
      config: config ? JSON.stringify(config).substring(0, 200) : 'default',
      timestamp: new Date().toISOString()
    });

    return {
      ruid,
      link: roomLink,
      status: 'created'
    };
  } catch (error) {
    logger.fail('room creation', error, { ruid });
    
    // Clean up failed room
    if (activeRooms.has(ruid)) {
      try {
        const room = activeRooms.get(ruid);
        await room?.close();
        activeRooms.delete(ruid);
      } catch (cleanupError) {
        logger.error('Failed to cleanup room', cleanupError, { ruid });
      }
    }
    return reply.code(500).send({ 
      error: 'Failed to create room', 
      details: (error as Error).message || 'Unknown error'
    });
  }
});

/**
 * Get room info
 */
fastify.get('/api/rooms/:ruid', async (request, reply) => {
  const { ruid } = request.params as any;
  
  const room = activeRooms.get(ruid);
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  try {
    const info = await room.getRoomInfo();
    const eventStats = room.getEventStats();
    return { 
      ruid, 
      ...info,
      eventSystem: eventStats
    };
  } catch (error) {
    logger.error('Failed to get room info', error, { 
      ruid, 
      operation: 'getRoomInfo',
      roomExists: !!room,
      timestamp: new Date().toISOString()
    });
    return reply.code(500).send({ 
      error: 'Failed to get room info', 
      details: (error as Error).message || 'Unknown error',
      ruid 
    });
  }
});

/**
 * Close room with complete cleanup
 */
fastify.delete('/api/rooms/:ruid', async (request, reply) => {
  const { ruid } = request.params as any;
  
  const room = activeRooms.get(ruid);
  if (!room) {
    // Room not found in memory, but still return success
    // The web backend will handle database cleanup
    return { ruid, status: 'closed', note: 'Room not found in memory' };
  }

  try {
    logger.system('Closing room', { ruid });
    
    // Close room with full cleanup
    await room.close();
    
    // Remove from active rooms
    activeRooms.delete(ruid);
    
    logger.system('Room closed successfully', { ruid });
    return { ruid, status: 'closed' };
    
  } catch (error) {
    logger.error('Failed to close room', error, { 
      ruid, 
      operation: 'closeRoom',
      roomExists: !!room,
      timestamp: new Date().toISOString()
    });
    
    // Even if close fails, remove from active rooms to prevent memory leaks
    activeRooms.delete(ruid);
    
    return reply.code(500).send({ 
      error: 'Failed to close room cleanly', 
      details: (error as Error).message || 'Unknown error',
      ruid,
      note: 'Room removed from memory despite error'
    });
  }
});

/**
 * Change stadium in room
 */
fastify.post('/api/rooms/:ruid/stadium/:mapName', async (request, reply) => {
  const { ruid, mapName } = request.params as any;
  
  const room = activeRooms.get(ruid);
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  try {
    await room.setStadium(mapName);

    
    return { ruid, stadium: mapName, status: 'changed' };
  } catch (error) {
    logger.error('Failed to change stadium', error, { 
      ruid, 
      mapName, 
      operation: 'setStadium',
      roomExists: !!room,
      timestamp: new Date().toISOString()
    });
    return reply.code(500).send({ 
      error: 'Failed to change stadium', 
      details: (error as Error).message || 'Unknown error',
      ruid,
      mapName 
    });
  }
});

/**
 * List all rooms
 */
fastify.get('/api/rooms', async (request, reply) => {
  const rooms = Array.from(activeRooms.keys()).map(ruid => ({
    ruid,
    status: 'online'
  }));
  
  return { rooms };
});

/**
 * Get event system statistics for a room
 */
fastify.get('/api/rooms/:ruid/events', async (request, reply) => {
  const { ruid } = request.params as any;
  
  const room = activeRooms.get(ruid);
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  try {
    const eventStats = room.getEventStats();
    return {
      ruid,
      eventSystem: eventStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to get event stats', error, { 
      ruid, 
      operation: 'getEventStats',
      roomExists: !!room,
      timestamp: new Date().toISOString()
    });
    return reply.code(500).send({ 
      error: 'Failed to get event stats', 
      details: (error as Error).message || 'Unknown error',
      ruid 
    });
  }
});

/**
 * Test chat system
 */
fastify.post('/api/rooms/:ruid/test-chat', async (request, reply) => {
  const { ruid } = request.params as any;
  
  const room = activeRooms.get(ruid);
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  try {
    // Test directo sin ChatManager
    await room.browserPage.evaluate(() => {
      console.log('[DIRECT TEST] Checking room availability...');
      if ((window as any).gameRoom?._room) {
        console.log('[DIRECT TEST] Room found, sending test message...');
        (window as any).gameRoom._room.sendAnnouncement('🧪 DIRECT TEST MESSAGE', null, 0x00FF00, 'bold', 1);
        console.log('[DIRECT TEST] Message sent!');
      } else {
        console.error('[DIRECT TEST] Room not available:', (window as any).gameRoom);
      }
    });
    
    return {
      ruid,
      message: 'Direct test message sent',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to send direct test message', error, { 
      ruid, 
      operation: 'testChat',
      roomExists: !!room,
      timestamp: new Date().toISOString()
    });
    return reply.code(500).send({ 
      error: 'Failed to send direct test message', 
      details: (error as Error).message || 'Unknown error',
      ruid 
    });
  }
});

/**
 * Test player join event
 */
fastify.post('/api/rooms/:ruid/test-join', async (request, reply) => {
  const { ruid } = request.params as any;
  
  const room = activeRooms.get(ruid);
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  try {
    // Simular evento de jugador uniéndose
    const testPlayer = {
      id: 999,
      name: 'TestPlayer',
      auth: 'test_auth',
      conn: 'test_conn',
      admin: false,
      team: 0
    };
    

    
    // Emitir evento manualmente usando el método público
    const chatManager = room.getChatManager();
    await chatManager.sendWelcomeSequence(testPlayer);
    
    return {
      ruid,
      message: 'Player join event simulated',
      player: testPlayer,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to simulate player join', error, { 
      ruid, 
      operation: 'testPlayerJoin',
      roomExists: !!room,
      timestamp: new Date().toISOString()
    });
    return reply.code(500).send({ 
      error: 'Failed to simulate player join', 
      details: (error as Error).message || 'Unknown error',
      ruid 
    });
  }
});



/**
 * Cleanup existing rooms and browser processes
 */
async function cleanupExistingRooms(): Promise<void> {
  logger.system('Cleaning up existing rooms and processes');
  
  try {
    // Kill any existing browser processes
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      if (process.platform === 'win32') {
        // Solo matar procesos de Chrome que contengan "headless" o "remote-debugging"
        await execAsync('wmic process where "name=\'chrome.exe\' and commandline like \'%headless%\'" delete 2>nul || echo "No headless Chrome found"');
        await execAsync('wmic process where "name=\'chrome.exe\' and commandline like \'%remote-debugging%\'" delete 2>nul || echo "No debugging Chrome found"');
      } else {
        await execAsync('pkill -f "chrome.*headless" || echo "No headless Chrome found"');
        await execAsync('pkill -f "chrome.*remote-debugging" || echo "No debugging Chrome found"');
      }
      logger.system('Puppeteer browser processes cleaned up');
    } catch (error) {
      logger.debug('Browser cleanup completed', { details: 'No processes to kill' });
    }
    
    // Reset all running server images in database
    const resetResult = await db.serverImage.updateMany({
      where: {
        status: 'running'
      },
      data: {
        status: 'inactive',
        ruid: null,
        roomLink: null,
        token: null
      }
    });
    
    if (resetResult.count > 0) {
      logger.system('Reset server images to inactive state', { count: resetResult.count });
    }
    
    // Clear active rooms map
    activeRooms.clear();
    
    logger.system('Startup cleanup completed successfully');
    
  } catch (error) {
    logger.error('Failed to cleanup existing rooms', error);
    // Continue startup even if cleanup fails
  }
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown() {
  logger.system('Starting graceful shutdown');
  
  // Close all rooms with proper cleanup
  for (const [ruid, room] of activeRooms) {
    try {
      logger.debug('Closing room during shutdown', { ruid });
      await room.close();
      
      // Update database status
      await db.serverImage.updateMany({
        where: { ruid },
        data: {
          status: 'inactive',
          ruid: null,
          roomLink: null,
          token: null
        }
      });
    } catch (error) {
      logger.error('Failed to close room during shutdown', error, { ruid });
    }
  }
  
  activeRooms.clear();
  
  // Disconnect database
  await disconnect();
  logger.system('Server shutdown complete');
  
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

/**
 * Initialize webhook system from database
 */
async function initializeWebhooks(): Promise<void> {
  try {
    const webhookManager = WebhookManager.getInstance();
    
    logger.system('Loading webhooks from database');
    
    // Load webhooks directly from database
    const webhooks = await db.webhook.findMany({
      where: {
        enabled: true
      }
    });
    
    webhookManager.clearWebhooks();
    
    for (const webhook of webhooks) {
      const webhookConfig = {
        ...webhook,
        id: webhook.id.toString(),
        levels: JSON.parse(webhook.levels) as ('error' | 'warn' | 'critical')[],
        services: webhook.services ? JSON.parse(webhook.services) : ['CORE'],
        format: (webhook.format === 'detailed' ? 'detailed' : 'compact') as 'compact' | 'detailed'
      };
      webhookManager.registerWebhook(webhookConfig);
      logger.system(`Registered webhook: ${webhook.name}`);
    }
    
    logger.system(`Loaded ${webhooks.length} webhooks from database`);
    
  } catch (error) {
    logger.error('Failed to initialize webhooks', error);
  }
}

/**
 * Start server
 */
async function start() {
  try {
    logger.system('Starting MikuServerPro Core Server');
    
    // Initialize webhook system
    await initializeWebhooks();
    
    // Connect to database
    await connect();
    
    // Test database with a simple query
    try {
      const testQuery = await db.$queryRaw`SELECT COUNT(*) as count FROM player_identities`;
      logger.database('connect', 'player_identities');
    } catch (dbError) {
      logger.error('Database test query failed', dbError, { 
        operation: 'testDatabaseConnection',
        query: 'SELECT COUNT(*) FROM player_identities'
      });
    }
    
    // CRITICAL: Clean up any existing rooms and processes before starting
    await cleanupExistingRooms();
    
    // Register routes
    await fastify.register(playersRoutes);
    await fastify.register((instance) => balanceRoutes(instance, activeRooms));
    await fastify.register((instance) => powershotRoutes(instance, activeRooms));
    await fastify.register(stadiumRoutes);
    await fastify.register(teamsRoutes);
    await fastify.register(matchesRoutes);
    await fastify.register(debugRoutes);
    
    // Webhook sync endpoint
    fastify.post('/api/webhooks/sync', async (request, reply) => {
      logger.system('Manual webhook sync requested');
      await initializeWebhooks();
      const webhookManager = WebhookManager.getInstance();
      const stats = webhookManager.getStats();
      return { message: 'Webhooks synchronized', stats };
    });
    
    // Webhook management endpoints
    fastify.get('/api/webhooks', async (request, reply) => {
      try {
        const webhooks = await db.webhook.findMany();
        const formattedWebhooks = webhooks.map(webhook => ({
          ...webhook,
          levels: JSON.parse(webhook.levels),
          services: webhook.services ? JSON.parse(webhook.services) : ['CORE']
        }));
        return { webhooks: formattedWebhooks };
      } catch (error) {
        logger.error('Failed to fetch webhooks', error);
        return reply.code(500).send({ error: 'Failed to fetch webhooks' });
      }
    });
    
    fastify.post('/api/webhooks', async (request, reply) => {
      try {
        const body = request.body as any;
        const { randomBytes } = require('crypto');
        const webhookId = randomBytes(12).toString('hex');
        
        const webhook = await db.webhook.create({
          data: {
            id: webhookId,
            name: body.name,
            url: body.url,
            enabled: body.enabled ?? true,
            levels: typeof body.levels === 'string' ? body.levels : JSON.stringify(body.levels || ['error']),
            rateLimit: body.rateLimit ?? 10,
            format: body.format === 'detailed' ? 'detailed' : 'compact',
            services: body.services ? JSON.stringify(body.services) : JSON.stringify(['CORE']),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        });
        
        // Reload webhooks if enabled
        if (webhook.enabled) {
          await initializeWebhooks();
        }
        
        const formattedWebhook1 = {
          ...webhook,
          levels: JSON.parse(webhook.levels),
          services: webhook.services ? JSON.parse(webhook.services) : ['CORE']
        };
        
        return { webhook: formattedWebhook1 };
      } catch (error) {
        logger.error('Failed to create webhook', error);
        return reply.code(500).send({ error: 'Failed to create webhook' });
      }
    });
    
    fastify.put('/api/webhooks/:id', async (request, reply) => {
      try {
        const { id } = request.params as any;
        const body = request.body as any;
        const webhook = await db.webhook.update({
          where: { id: id },
          data: {
            ...body,
            levels: typeof body.levels === 'string' ? body.levels : JSON.stringify(body.levels),
            services: body.services ? JSON.stringify(body.services) : null
          }
        });
        
        // Reload webhooks
        await initializeWebhooks();
        
        const formattedWebhook2 = {
          ...webhook,
          levels: JSON.parse(webhook.levels),
          services: webhook.services ? JSON.parse(webhook.services) : ['CORE']
        };
        
        return { webhook: formattedWebhook2 };
      } catch (error) {
        logger.error('Failed to update webhook', error);
        return reply.code(500).send({ error: 'Failed to update webhook' });
      }
    });
    
    fastify.delete('/api/webhooks/:id', async (request, reply) => {
      try {
        const { id } = request.params as any;
        await db.webhook.delete({
          where: { id: id }
        });
        
        // Reload webhooks
        await initializeWebhooks();
        
        return { message: 'Webhook deleted', id: id };
      } catch (error) {
        logger.error('Failed to delete webhook', error);
        return reply.code(500).send({ error: 'Failed to delete webhook' });
      }
    });
    
    // Test webhook endpoint
    fastify.post('/api/test-webhook', async (request, reply) => {
      const webhookManager = WebhookManager.getInstance();
      await webhookManager.sendMessage({
        level: 'error',
        service: 'TEST-API',
        message: 'Test error from API endpoint',
        error: 'Simulated API error',
        metadata: { testType: 'api_direct' },
        timestamp: new Date().toISOString()
      });
      return { message: 'Test webhook sent' };
    });
    
    // Start server
    await fastify.listen({
      port: appConfig.core.port,
      host: appConfig.core.host
    });
    
    logger.system('MikuServerPro Core Server Started', {
      port: appConfig.core.port,
      host: appConfig.core.host,
      cleanState: true
    });
    
  } catch (error) {
    logger.fail('server startup', error);
    process.exit(1);
  }
}

start();