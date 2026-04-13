import { hashSync, compareSync } from 'bcrypt';

const SALT_ROUNDS = 12;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
}

export interface Session {
  token: string;
  userId: string;
}

export const hashPassword = (plainPassword: string): string =>
  hashSync(plainPassword, SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): boolean =>
  compareSync(plain, hash);

export class InMemoryAuthService {
  private readonly usersByEmail = new Map<string, User>();

  register(email: string, password: string): User {
    if (this.usersByEmail.has(email)) {
      throw new Error('User already exists');
    }

    const user: User = {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashPassword(password)
    };

    this.usersByEmail.set(email, user);
    return user;
  }

  login(email: string, password: string): Session | null {
    const user = this.usersByEmail.get(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return null;
    }

    return {
      token: crypto.randomUUID(),
      userId: user.id
    };
  }
}
