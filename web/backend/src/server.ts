import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { db, connect, healthCheck } from '@mikuserverpro/database';
import axios from 'axios';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { serverImageRoutes } from './routes/serverImages';
import { cleanupRoutes } from './routes/cleanup';
import { configRoutes } from './routes/config';
import { createLogger } from './shared/logger';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

/**
 * FASE 1.1: Dashboard React con autenticación básica
 * Web backend para interfaz de administración
 */

const logger = createLogger('WEB');

const fastify = Fastify({
  logger: false // Desactivar logger default de Fastify
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

const CORE_SERVER_URL = `http://localhost:${process.env.CORE_PORT || 3001}`;

// Register plugins
fastify.register(cors, {
  origin: true,
  credentials: true
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
});

/**
 * Health check
 */
fastify.get('/api/health', async (request, reply) => {
  const dbHealth = await healthCheck();
  
  // Check core server health
  let coreHealth = false;
  try {
    const response = await axios.get(`${CORE_SERVER_URL}/health`, { timeout: 5000 });
    coreHealth = response.status === 200;
  } catch (error) {
    logger.warn('Core server health check failed', { error: String(error) });
  }

  const healthStatus = {
    status: 'ok',
    database: dbHealth ? 'connected' : 'disconnected',
    coreServer: coreHealth ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  };
  
  logger.debug('Health check completed', healthStatus);
  return healthStatus;
});

/**
 * FASE 1: Autenticación básica (sin usuarios por ahora)
 */
fastify.post('/api/auth/login', async (request, reply) => {
  const { password } = request.body as any;
  
  // Simple password check for FASE 1
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const isDev = process.env.NODE_ENV !== 'production';
  const passwordValid =
    (expectedPassword && password === expectedPassword) ||
    (isDev && password === 'admin123');

  if (passwordValid) {
    const token = fastify.jwt.sign({ 
      role: 'admin',
      timestamp: Date.now()
    });
    
    logger.system('Login successful', { role: 'admin' });
    return { token, role: 'admin' };
  }
  
  logger.warn('Login failed - invalid credentials');
  return reply.code(401).send({ error: 'Invalid credentials' });
});

/**
 * FASE 2: Player management proxy (before auth middleware)
 */
fastify.get('/api/rooms/:ruid/players', async (request, reply) => {
  const { ruid } = request.params as any;
  try {

    const response = await axios.get(`${CORE_SERVER_URL}/api/rooms/${ruid}/players`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get players from core server', error, { ruid });
    return reply.code(500).send({ error: 'Failed to get players' });
  }
});

fastify.get('/api/rooms/:ruid/players/stats', async (request, reply) => {
  const { ruid } = request.params as any;
  try {

    const response = await axios.get(`${CORE_SERVER_URL}/api/rooms/${ruid}/players/stats`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get player stats from core server', error, { ruid });
    return reply.code(500).send({ error: 'Failed to get player stats' });
  }
});

// Debug endpoints proxy - Forward all debug requests to core server
fastify.get('/api/debug/gameloop', async (request, reply) => {
  try {
    const response = await axios.get(`${CORE_SERVER_URL}/api/debug/gameloop`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get gameloop debug from core server', error);
    return reply.code(500).send({ error: 'Failed to get gameloop debug' });
  }
});

fastify.post('/api/debug/gameloop/transition', async (request, reply) => {
  try {
    const response = await axios.post(`${CORE_SERVER_URL}/api/debug/gameloop/transition`, request.body);
    return response.data;
  } catch (error) {
    logger.error('Failed to trigger gameloop transition', error);
    return reply.code(500).send({ error: 'Failed to trigger transition' });
  }
});

fastify.get('/api/debug/gameloop/history', async (request, reply) => {
  try {
    const response = await axios.get(`${CORE_SERVER_URL}/api/debug/gameloop/history`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get gameloop history from core server', error);
    return reply.code(500).send({ error: 'Failed to get gameloop history' });
  }
});

fastify.get('/api/debug/balance', async (request, reply) => {
  try {
    const response = await axios.get(`${CORE_SERVER_URL}/api/debug/balance`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get balance debug from core server', error);
    return reply.code(500).send({ error: 'Failed to get balance debug' });
  }
});

fastify.get('/api/debug/players', async (request, reply) => {
  try {
    const response = await axios.get(`${CORE_SERVER_URL}/api/debug/players`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get debug players from core server', error);
    return reply.code(500).send({ error: 'Failed to get debug players' });
  }
});

fastify.get('/api/debug/status', async (request, reply) => {
  try {
    const response = await axios.get(`${CORE_SERVER_URL}/api/debug/status`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get debug status from core server', error);
    return reply.code(500).send({ error: 'Failed to get debug status' });
  }
});

// Player details proxy
fastify.get('/api/player/:playerId/details', async (request, reply) => {
  const { playerId } = request.params as any;
  try {

    const response = await axios.get(`${CORE_SERVER_URL}/api/player/${playerId}/details`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get player details from core server', error, { playerId });
    return reply.code(500).send({ error: 'Failed to get player details' });
  }
});

// Balance routes proxy
fastify.get('/api/rooms/:ruid/balance-debug', async (request, reply) => {
  const { ruid } = request.params as any;
  try {

    const response = await axios.get(`${CORE_SERVER_URL}/api/rooms/${ruid}/balance-debug`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get balance debug from core server', error, { ruid });
    return reply.code(500).send({ error: 'Failed to get balance debug' });
  }
});

fastify.post('/api/rooms/:ruid/balance', async (request, reply) => {
  const { ruid } = request.params as any;
  try {

    const response = await axios.post(`${CORE_SERVER_URL}/api/rooms/${ruid}/balance`);
    return response.data;
  } catch (error) {
    logger.error('Failed to trigger balance via core server', error, { ruid });
    return reply.code(500).send({ error: 'Failed to trigger balance' });
  }
});

/**
 * Middleware para verificar JWT
 */
fastify.addHook('preHandler', async (request, reply) => {
  // Skip auth for public endpoints
  if (request.url.startsWith('/api/auth') || 
      request.url === '/api/health' ||
      request.url.startsWith('/api/debug/') ||
      request.url.startsWith('/api/player/') ||
      request.url.startsWith('/api/server-images') ||
      request.url.startsWith('/api/config/') ||
      request.url.includes('/admin-passwords') ||
      request.url.startsWith('/api/teams') ||
      request.url.startsWith('/api/matches') ||
      request.url.startsWith('/api/webhooks') ||
      request.url.includes('/api/rooms/') && (request.url.includes('/players') || request.url.includes('/balance'))) {
    return;
  }
  
  try {
    await request.jwtVerify();
  } catch (err) {
    // Check if it's an internal service request
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
        if (decoded.internal && decoded.service === 'core-server') {
          return; // Allow internal service requests
        }
      } catch (jwtError) {
        // Invalid internal token, continue to unauthorized
      }
    }
    
    logger.warn('Unauthorized access attempt', { url: request.url });
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

/**
 * FASE 1: Proxy to core server for room management
 */
fastify.get('/api/rooms', async (request, reply) => {
  try {
    const response = await axios.get(`${CORE_SERVER_URL}/api/rooms`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch rooms from core server', error);
    return reply.code(500).send({ error: 'Failed to fetch rooms' });
  }
});

fastify.post('/api/rooms', async (request, reply) => {
  try {
    const response = await axios.post(`${CORE_SERVER_URL}/api/rooms`, request.body);
    logger.system('Room created successfully', { ruid: response.data?.ruid });
    return response.data;
  } catch (error) {
    logger.error('Failed to create room via core server', error);
    return reply.code(500).send({ error: 'Failed to create room' });
  }
});

fastify.get('/api/rooms/:ruid', async (request, reply) => {
  const { ruid } = request.params as any;
  try {

    const response = await axios.get(`${CORE_SERVER_URL}/api/rooms/${ruid}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {

      return reply.code(404).send({ error: 'Room not found' });
    }
    logger.error('Failed to get room info from core server', error, { ruid });
    return reply.code(500).send({ error: 'Failed to get room info' });
  }
});

fastify.delete('/api/rooms/:ruid', async (request, reply) => {
  const { ruid } = request.params as any;
  try {
    const response = await axios.delete(`${CORE_SERVER_URL}/api/rooms/${ruid}`);
    logger.system('Room deleted successfully', { ruid });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {

      return reply.code(404).send({ error: 'Room not found' });
    }
    logger.error('Failed to delete room via core server', error, { ruid });
    return reply.code(500).send({ error: 'Failed to close room' });
  }
});

/**
 * FASE 1: Basic server management
 */
fastify.get('/api/servers', async (request, reply) => {
  try {
    const servers = await db.serverImage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { servers };
  } catch (error) {
    logger.error('Failed to fetch servers from database', error);
    return reply.code(500).send({ error: 'Failed to fetch servers' });
  }
});

// Register server image routes
fastify.register(serverImageRoutes);
fastify.register(cleanupRoutes);
fastify.register(configRoutes);

// Register admin passwords routes
import { adminPasswordsRoutes } from './routes/adminPasswords';
fastify.register(adminPasswordsRoutes);

// Register sanctions routes
import { sanctionsRoutes } from './routes/sanctions';
fastify.register(sanctionsRoutes);

// Register teams routes
import { teamsRoutes } from './routes/teams';
fastify.register(teamsRoutes);

// Register webhook routes
import { webhookRoutes } from './routes/webhooks';
fastify.register(webhookRoutes);

// Register debug routes
import { debugRoutes } from './routes/debug';
fastify.register(debugRoutes);

/**
 * Start server
 */
async function start() {
  try {
    await connect();
    logger.database('connect');
    
    const port = parseInt(process.env.WEB_PORT || '3000');
    const host = process.env.WEB_HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    logger.system('MikuServerPro Web Backend Started', { port, host });
    
  } catch (error) {
    logger.error('Web backend startup failed', error);
    process.exit(1);
  }
}

start();