import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchManager } from '../../shared/teams/MatchManager';
import { MatchCategory } from '../../shared/teams/TeamTypes';

const matchManager = new MatchManager();

interface CategoryParams {
  categoryId: string;
}

interface UpdateCategoryBody {
  category: MatchCategory;
}

interface UpdateMatchesBody {
  matches: { [categoryId: string]: MatchCategory };
}

export async function matchesRoutes(fastify: FastifyInstance) {
  // GET /api/matches - Listar todas las categorías de partidos
  fastify.get('/api/matches', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const matches = matchManager.getAllMatches();
      return reply.code(200).send({
        success: true,
        data: matches
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch matches'
      });
    }
  });

  // GET /api/matches/random - Seleccionar partido aleatorio
  fastify.get('/api/matches/random', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const match = matchManager.selectRandomMatch();
      
      if (!match) {
        return reply.code(404).send({
          success: false,
          error: 'No matches available'
        });
      }

      return reply.code(200).send({
        success: true,
        data: match
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to select random match'
      });
    }
  });

  // PUT /api/matches - Actualizar todas las categorías de partidos
  fastify.put<{ Body: UpdateMatchesBody }>('/api/matches', async (request, reply) => {
    try {
      const { matches } = request.body;

      if (!matches || typeof matches !== 'object') {
        return reply.code(400).send({
          success: false,
          error: 'Invalid matches data'
        });
      }

      const success = matchManager.updateAllMatches(matches);
      
      if (!success) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to update matches'
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'Matches updated successfully'
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to update matches'
      });
    }
  });

  // PUT /api/matches/:categoryId - Actualizar categoría de partidos
  fastify.put<{ Params: CategoryParams; Body: UpdateCategoryBody }>('/api/matches/:categoryId', async (request, reply) => {
    try {
      const { categoryId } = request.params;
      const { category } = request.body;

      // Validaciones básicas
      if (!category.name || typeof category.rate !== 'number' || !Array.isArray(category.classics)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid category data'
        });
      }

      const success = matchManager.updateCategory(categoryId, category);
      
      if (!success) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to update category'
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'Category updated successfully'
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to update category'
      });
    }
  });

  // DELETE /api/matches/:categoryId - Eliminar categoría
  fastify.delete<{ Params: CategoryParams }>('/api/matches/:categoryId', async (request, reply) => {
    try {
      const { categoryId } = request.params;
      const success = matchManager.deleteCategory(categoryId);
      
      if (!success) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to delete category'
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete category'
      });
    }
  });
}