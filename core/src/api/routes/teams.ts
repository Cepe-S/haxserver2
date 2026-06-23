import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TeamsManager } from '../../shared/teams/TeamsManager';
import { Team, TeamKit } from '../../shared/teams/TeamTypes';

const teamsManager = new TeamsManager();

interface TeamParams {
  name: string;
}

interface UpdateTeamBody {
  team: Team;
}

export async function teamsRoutes(fastify: FastifyInstance) {
  // GET /api/teams - Listar todos los equipos
  fastify.get('/api/teams', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const teams = teamsManager.getAllTeams();
      return reply.code(200).send({
        success: true,
        data: teams
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch teams'
      });
    }
  });

  // GET /api/teams/:name - Obtener equipo específico
  fastify.get<{ Params: TeamParams }>('/api/teams/:name', async (request, reply) => {
    try {
      const { name } = request.params;
      const team = teamsManager.getTeam(name);
      
      if (!team) {
        return reply.code(404).send({
          success: false,
          error: 'Team not found'
        });
      }

      return reply.code(200).send({
        success: true,
        data: { name, ...team }
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch team'
      });
    }
  });

  // PUT /api/teams/:name - Actualizar equipo
  fastify.put<{ Params: TeamParams; Body: UpdateTeamBody }>('/api/teams/:name', async (request, reply) => {
    try {
      const { name } = request.params;
      const { team } = request.body;

      // Validar kits si existen
      if (team.tit && !teamsManager.validateKit(team.tit)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid titular kit data'
        });
      }

      if (team.alt && !teamsManager.validateKit(team.alt)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid alternative kit data'
        });
      }

      const success = teamsManager.updateTeam(name, team);
      
      if (!success) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to update team'
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'Team updated successfully'
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to update team'
      });
    }
  });

  // DELETE /api/teams/:name - Eliminar equipo
  fastify.delete<{ Params: TeamParams }>('/api/teams/:name', async (request, reply) => {
    try {
      const { name } = request.params;
      const success = teamsManager.deleteTeam(name);
      
      if (!success) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to delete team'
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'Team deleted successfully'
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete team'
      });
    }
  });
}