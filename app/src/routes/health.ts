import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({
    status: 'ok',
    version: '1.1.0-alpha',
    timestamp: new Date().toISOString(),
    antiMatter: 'active',
  }));
};
