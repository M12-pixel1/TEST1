import type { FastifyPluginAsync } from 'fastify';
import { hashSync, compareSync } from 'bcrypt';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'role'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', enum: ['learner', 'manager', 'admin'] },
        },
      },
    },
    handler: async (request, reply) => {
      const { email, password, role } = request.body as { email: string; password: string; role: string };
      const existing = await fastify.repo.findUserByEmail(email);
      if (existing) {
        return reply.code(409).send({ error: 'Email already registered' });
      }
      const passwordHash = hashSync(password, 12);
      const user = await fastify.repo.createUser({ email, passwordHash, role });
      const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
      return { user: { id: user.id, email: user.email, role: user.role }, token };
    },
  });

  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const { email, password } = request.body as { email: string; password: string };
      const user = await fastify.repo.findUserByEmail(email);
      if (!user || !compareSync(password, user.passwordHash)) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
      const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
      return { user: { id: user.id, email: user.email, role: user.role }, token };
    },
  });
};
