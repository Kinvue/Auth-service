import { Injectable } from '@nestjs/common';
import { AuthUser, AuthUserStatus, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async checkEmailCount(email: string): Promise<number> {
    return await this.prisma.authUser.count({
      where: { email },
    });
  }

  public async findByEmail(email: string): Promise<AuthUser | null> {
    return await this.prisma.authUser.findUnique({
      where: { email },
    });
  }

  public async createUser(data: Prisma.AuthUserCreateInput): Promise<AuthUser> {
    return await this.prisma.authUser.create({
      data,
    });
  }

  public async updateStatus(
    id: string,
    status: AuthUserStatus,
  ): Promise<AuthUser> {
    return await this.prisma.authUser.update({
      where: { id },
      data: { status },
    });
  }
}