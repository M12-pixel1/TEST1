import type { FastifyPluginAsync } from 'fastify';
import { SIGNAL_VISIBILITY } from '../anti/visibility.ts';
import { VisibilityLayer } from '../anti/types.ts';

export const antiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/analyze', {
    onRequest: [fastify.authenticate],
    schema: { body: { type: 'object', additionalProperties: true } },
    handler: async (request) => {
      const userId = (request.user as { id: string }).id;
      const result = await fastify.antiEngine.analyzeUser(userId);
      return { analyzed: true, patternsDetected: result.patternsDetected, signalsPersisted: result.signalsPersisted };
    },
  });

  fastify.get('/my-signals', {
    onRequest: [fastify.authenticate],
    handler: async (request) => {
      const userId = (request.user as { id: string }).id;
      const allSignals = await fastify.repo.getActiveAntiSignals(userId);
      const filtered = allSignals.filter(s => {
        const vis = SIGNAL_VISIBILITY[s.signalType as keyof typeof SIGNAL_VISIBILITY];
        return vis === VisibilityLayer.PUBLIC;
      });
      return { signals: filtered };
    },
  });

  fastify.get('/team-signals', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = request.user as { id: string; role: string };
      if (user.role !== 'manager' && user.role !== 'admin') {
        return reply.code(403).send({ error: 'Manager role required' });
      }
      const allSignals = await fastify.repo.getActiveAntiSignals(user.id);
      const filtered = allSignals.filter(s => {
        const vis = SIGNAL_VISIBILITY[s.signalType as keyof typeof SIGNAL_VISIBILITY];
        return vis === VisibilityLayer.PUBLIC || vis === VisibilityLayer.SEMI_PUBLIC;
      });
      return { signals: filtered };
    },
  });

  fastify.post('/record-event', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['eventType', 'rawData'],
        properties: {
          eventType: { type: 'string' },
          taskId: { type: 'string' },
          rawData: { type: 'object' },
        },
      },
    },
    handler: async (request) => {
      const userId = (request.user as { id: string }).id;
      const { eventType, taskId, rawData } = request.body as { eventType: string; taskId?: string; rawData: Record<string, unknown> };
      await fastify.repo.recordSignalEvent({ userId, eventType, taskId: taskId ?? null, rawData });
      return { recorded: true };
    },
  });
};
