// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly MOCK_EMAIL = 'mock@example.com';

  constructor(private prisma: PrismaService) {}

  // Ensure mock user exists and return it
  private async ensureMockUser() {
    let user = await this.prisma.user.findFirst({
      where: { email: this.MOCK_EMAIL },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: this.MOCK_EMAIL,
          passwordHash: 'dummyhash',
          name: 'Test Alumni',
          domains: [],
          emailVerified: true,
        },
      });
    }

    return user;
  }

  async getProfile() {
    return this.ensureMockUser();
  }

  async updateProfile(body: any) {
    const user = await this.ensureMockUser();

    const domains: string[] = Array.isArray(body.domains)
      ? body.domains
      : typeof body.domains === 'string'
      ? body.domains
          .split(',')
          .map((d: string) => d.trim())
          .filter(Boolean)
      : [];

    const batchYear =
      body.batchYear && body.batchYear !== ''
        ? Number(body.batchYear)
        : undefined;

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name ?? undefined,
        bio: body.bio ?? undefined,
        company: body.company ?? undefined,
        position: body.position ?? undefined,
        batchYear,
        domains,
      },
    });
  }
}
