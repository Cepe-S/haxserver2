import { FastifyInstance } from 'fastify';
import { StadiumManager } from '../../shared/stadiums/StadiumManager';
import { createLogger } from '../../shared/logger/Logger';

const logger = createLogger('STADIUMS_API');

/**
 * Rutas para servir estadios de Haxball
 * FASE 1.2: Sistema replicado del haxbotron viejo
 */
export async function stadiumRoutes(fastify: FastifyInstance) {
  // GET /api/stadiums/:name - Obtiene el JSON de un estadio
  fastify.get('/api/stadiums/:name', async (request, reply) => {
    const { name } = request.params as { name: string };
    
    try {
      console.log('🏟️ [STADIUMS_API] Request received for stadium:', name);
      logger.debug(`Loading stadium: ${name}`);
      
      // Validar que el estadio existe
      const isValid = StadiumManager.isValidStadium(name);
      console.log('🔍 [STADIUMS_API] Stadium validation result:', { name, isValid });
      
      if (!isValid) {
        console.log('❌ [STADIUMS_API] Stadium not found:', name);
        return reply.status(404).send({
          error: 'Stadium not found',
          message: `Stadium '${name}' does not exist`
        });
      }
      
      // Usar el sistema replicado del haxbotron viejo
      console.log('🔄 [STADIUMS_API] Calling StadiumManager.loadStadiumData for:', name);
      const stadiumData = StadiumManager.loadStadiumData(name);
      console.log('📊 [STADIUMS_API] StadiumManager result:', {
        name,
        hasData: !!stadiumData,
        dataLength: stadiumData?.length || 0,
        dataType: typeof stadiumData
      });
      
      if (!stadiumData) {
        console.log('❌ [STADIUMS_API] No stadium data returned for:', name);
        return reply.status(500).send({
          error: 'Failed to load stadium',
          message: `Could not load stadium data for '${name}'`
        });
      }
      
      logger.info(`Stadium loaded successfully: ${name}`, {
        size: stadiumData.length
      });
      
      console.log('✅ [STADIUMS_API] Sending stadium data:', {
        name,
        size: stadiumData.length,
        preview: stadiumData.substring(0, 100) + '...'
      });
      
      // Retornar el JSON como texto plano (como espera Haxball)
      reply.header('Content-Type', 'application/json');
      return reply.send(stadiumData);
      
    } catch (error) {
      console.error('❌ [STADIUMS_API] Error loading stadium:', { name, error: error.message, stack: error.stack });
      logger.error(`Error loading stadium ${name}:`, error);
      
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to load stadium data'
      });
    }
  });
  
  // GET /api/stadiums - Lista todos los estadios disponibles
  fastify.get('/api/stadiums', async (request, reply) => {
    try {
      const stadiums = StadiumManager.getAvailableStadiums().map(name => ({
        name,
        displayName: name.toUpperCase() // Simple display name como en sistema viejo
      }));
      
      return reply.send({
        stadiums,
        count: stadiums.length
      });
      
    } catch (error) {
      logger.error('Error listing stadiums:', error);
      
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to list stadiums'
      });
    }
  });
}