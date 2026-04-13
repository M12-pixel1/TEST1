import type { FastifyPluginAsync } from 'fastify';

export const taskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/result', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['taskId', 'score'],
        properties: {
          taskId: { type: 'string' },
          score: { type: 'number', minimum: 0, maximum: 1 },
          errorType: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
    },
    handler: async (request) => {
      const userId = (request.user as { id: string }).id;
      const { taskId, score, errorType, metadata } = request.body as {
        taskId: string; score: number; errorType?: string; metadata?: Record<string, unknown>;
      };

      await fastify.repo.recordSignalEvent({
        userId,
        taskId,
        eventType: 'task_result',
        rawData: { score, error_type: errorType, ...(metadata ?? {}) },
      });

      fastify.antiEngine.analyzeUser(userId).catch((err: unknown) => {
        fastify.log.error({ err, userId }, 'Anti engine failed');
      });

      return { recorded: true };
    },
  });
};
