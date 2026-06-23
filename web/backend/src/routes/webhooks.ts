import { FastifyInstance } from 'fastify';

export async function webhookRoutes(fastify: FastifyInstance) {
  // Middleware de autenticación JWT (excepto para webhook send)
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for webhook send endpoint (internal communication)
    if (request.url === '/api/webhooks/send') {
      return;
    }
    
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Proxy all webhook requests to core server
  const coreUrl = `http://localhost:${process.env.CORE_PORT || 3001}`;
  
  // GET /api/webhooks - Proxy to core
  fastify.get('/api/webhooks', async (request, reply) => {
    try {
      const response = await fetch(`${coreUrl}/api/webhooks`);
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch webhooks' });
    }
  });

  // POST /api/webhooks - Proxy to core
  fastify.post('/api/webhooks', async (request, reply) => {
    try {
      const response = await fetch(`${coreUrl}/api/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
      });
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to create webhook' });
    }
  });

  // PUT /api/webhooks/:id - Proxy to core
  fastify.put('/api/webhooks/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const response = await fetch(`${coreUrl}/api/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
      });
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to update webhook' });
    }
  });

  // DELETE /api/webhooks/:id - Proxy to core
  fastify.delete('/api/webhooks/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const response = await fetch(`${coreUrl}/api/webhooks/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to delete webhook' });
    }
  });

  // POST /api/webhooks/test - Proxy to core
  fastify.post('/api/webhooks/test', async (request, reply) => {
    try {
      const response = await fetch(`${coreUrl}/api/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
      });
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to test webhook' });
    }
  });

  // POST /api/webhooks/sync - Proxy to core
  fastify.post('/api/webhooks/sync', async (request, reply) => {
    try {
      const response = await fetch(`${coreUrl}/api/webhooks/sync`, {
        method: 'POST'
      });
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to sync webhooks' });
    }
  });

  // POST /api/webhooks/send - Send webhook message to Discord
  fastify.post('/api/webhooks/send', async (request, reply) => {
    try {
      const { webhookId, payload } = request.body as any;
      
      // Get webhook from core
      const webhooksResponse = await fetch(`${coreUrl}/api/webhooks`);
      const webhooksData = await webhooksResponse.json();
      const webhook = webhooksData.webhooks.find((w: any) => w.id === webhookId);
      
      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found' });
      }
      
      // Send to Discord
      const axios = require('axios');
      const response = await axios.post(webhook.url, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return reply.code(200).send({ 
        success: true, 
        status: response.status,
        webhookName: webhook.name
      });
      
    } catch (error: any) {
      return reply.code(500).send({ 
        error: 'Failed to send webhook',
        details: error.message,
        status: error.response?.status
      });
    }
  });
}