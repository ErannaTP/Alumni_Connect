import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly TEST_USER = {
    id: 'user-123',
    username: 'testuser',
    password: 'password123',
    name: 'Saavan Patel',
  };

  login(username: string, password: string) {
    if (
      username !== this.TEST_USER.username ||
      password !== this.TEST_USER.password
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: this.TEST_USER.id, name: this.TEST_USER.name },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' },
    );

    return {
      token,
      user: {
        id: this.TEST_USER.id,
        name: this.TEST_USER.name,
      },
    };
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    } catch {
      return null;
    }
  }
}
