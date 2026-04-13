import type { FastifyPluginAsync } from 'fastify';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/system-faults', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = request.user as { role: string };
      if (user.role !== 'admin' && user.role !== 'manager') {
        return reply.code(403).send({ error: 'Manager or admin role required' });
      }
      const faults = await fastify.antiEngine.analyzeSystemFaults(7);
      return { faults };
    },
  });

  fastify.get('/all-signals', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = request.user as { role: string };
      if (user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin role required' });
      }
      const signals = await fastify.repo.getAllActiveAntiSignals();
      return { signals };
    },
  });
};
