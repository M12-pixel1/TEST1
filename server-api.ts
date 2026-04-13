import Fastify from 'fastify';
import cors from '@fastify/cors';
import fjwt from '@fastify/jwt';
import fstatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

import { PostgresRepository } from './app/src/db/pg/postgres-repository.ts';
import { AsyncAntiEngine } from './app/src/anti/anti-engine-pg.ts';
import { healthRoutes } from './app/src/routes/health.ts';
import { authRoutes } from './app/src/routes/auth.ts';
import { antiRoutes } from './app/src/routes/anti.ts';
import { taskRoutes } from './app/src/routes/tasks.ts';
import { adminRoutes } from './app/src/routes/admin.ts';

import type { Repository } from './app/src/db/pg/repo-types.ts';

declare module 'fastify' {
  interface FastifyInstance {
    repo: Repository;
    antiEngine: AsyncAntiEngine;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

import type { FastifyRequest, FastifyReply } from 'fastify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://augimo_user:a8a8d2638abfb39025937e584b367f70@localhost:5432/augimo_programa';
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const PORT = parseInt(process.env.PORT ?? '3100', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

const fastify = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
});

await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN ?? '*',
  credentials: true,
});

await fastify.register(fjwt, {
  secret: JWT_SECRET,
  sign: { expiresIn: '7d' },
});

await fastify.register(fstatic, {
  root: join(__dirname, 'app', 'browser'),
  prefix: '/',
  decorateReply: true,
});

const repo = new PostgresRepository(DATABASE_URL);
const antiEngine = new AsyncAntiEngine(repo);

fastify.decorate('repo', repo);
fastify.decorate('antiEngine', antiEngine);
fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

await fastify.register(healthRoutes, { prefix: '/health' });
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(antiRoutes, { prefix: '/api/anti' });
await fastify.register(taskRoutes, { prefix: '/api/tasks' });
await fastify.register(adminRoutes, { prefix: '/api/admin' });

try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`Augimo Programa V1.1 running on ${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
