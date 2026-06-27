import { FastifyInstance } from 'fastify';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import archiver from 'archiver';
import { getLogsDirectory, listLogFiles } from '@mikuserverpro/database';
import { buildAgentReport } from '../debug/buildAgentReport';

const CORE_SERVER_URL = process.env.CORE_SERVER_URL || `http://localhost:${process.env.CORE_PORT || 3001}`;

export async function debugRoutes(fastify: FastifyInstance) {
  fastify.get('/api/debug/logs/list', async (_request, reply) => {
    try {
      const directory = getLogsDirectory();
      const files = listLogFiles();
      return reply.send({
        directory,
        files,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      return reply.code(500).send({ error: 'Failed to list log files', message: error.message });
    }
  });

  fastify.get('/api/debug/logs/download', async (_request, reply) => {
    try {
      const directory = getLogsDirectory();
      const files = listLogFiles();

      if (files.length === 0) {
        return reply.code(404).send({ error: 'No log files found', directory });
      }

      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `mikuserverpro-logs-${stamp}.zip`;

      reply.hijack();
      reply.raw.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`
      });

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err) => {
        reply.raw.destroy(err);
      });

      archive.pipe(reply.raw);

      for (const file of files) {
        const filePath = join(directory, file.name);
        if (existsSync(filePath)) {
          archive.file(filePath, { name: file.name });
        }
      }

      await archive.finalize();
    } catch (error: any) {
      if (!reply.sent) {
        return reply.code(500).send({ error: 'Failed to create logs archive', message: error.message });
      }
    }
  });

  fastify.get('/api/debug/database', async (_request, reply) => {
    try {
      const response = await fetch(`${CORE_SERVER_URL}/api/debug/database`);
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error: any) {
      return reply.code(500).send({ error: 'Failed to fetch database debug info', message: error.message });
    }
  });

  fastify.get('/api/debug/match-log', async (_request, reply) => {
    try {
      const response = await fetch(`${CORE_SERVER_URL}/api/debug/match-log`);
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error: any) {
      return reply.code(500).send({ error: 'Failed to fetch match log', message: error.message });
    }
  });

  /**
   * Reporte texto plano para agentes en deploys.
   * ?ruid=pito  ?lines=50
   */
  fastify.get('/api/debug/report', async (request, reply) => {
    try {
      const query = request.query as { ruid?: string; lines?: string };
      const logLines = query.lines ? Math.min(parseInt(query.lines, 10) || 40, 200) : 40;
      const report = await buildAgentReport({
        ruid: query.ruid,
        logLines
      });
      reply.header('Content-Type', 'text/plain; charset=utf-8');
      return reply.send(report);
    } catch (error: any) {
      return reply.code(500).send({ error: 'Failed to build agent report', message: error.message });
    }
  });
}
