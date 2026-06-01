import {
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  LogoutRequest,
  AuthResponse,
  UserPayload,
} from '@kinvue/contracts/dist/gen/auth';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { UserService } from '../user/user.service';
import { AuthUserStatus } from 'generated/prisma/client';

@Injectable()
export class AuthService {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly userService: UserService,
  ) {}

  public async login(userCredentials: LoginRequest): Promise<AuthResponse> {
    const { email, password } = userCredentials;

    const currentUser = await this.authRepository.findByEmail(email);

    if (!currentUser) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid credentials!',
      });
    }

    const isPasswordValid = await this.comparePasswords(
      password,
      currentUser.passwordHash,
    );

    if (!isPasswordValid) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid credentials!',
      });
    }

    if (currentUser.status !== 'ACTIVE') {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Registration is not completed',
      });
    }

    const { id } = await this.userService.getProfileByAuthUserId(
      currentUser.id,
    );

    return this.issueTokens(currentUser, id);
  }

  public async register( userCredentials: RegisterRequest,): Promise<AuthResponse> {
    const { email, password, clientInfo } = userCredentials;

    if (!clientInfo?.name?.trim()) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Name value must not be undefined',
      });
    }
    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser?.status === 'ACTIVE') {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'User with this credentials already exists',
      });
    }
    if (existingUser?.status === 'PENDING') {
      await this.userService.createProfile({
        authUserId: existingUser.id,
        username: clientInfo.name,
      });

      const activatedUser = await this.authRepository.updateStatus(
        existingUser.id,
        'ACTIVE',
      );

      const { id } = await this.userService.getProfileByAuthUserId(
        activatedUser.id,
      );
      return this.issueTokens(activatedUser, id);
    }

    const hash = await this.hashPassword(password);
    const newUserData = {
      email: email,
      passwordHash: hash,
      status: 'PENDING' as AuthUserStatus,
    };

    const user = await this.authRepository.createUser(newUserData);

    await this.userService.createProfile({
      authUserId: user.id,
      username: clientInfo.name,
    });

    const activatedUser = await this.authRepository.updateStatus(
      user.id,
      'ACTIVE',
    );

    return this.issueTokens(activatedUser, user.id);
  }

  public async logout(userCredentials: LogoutRequest) {
    return;
  }

  public async refresh(dto: RefreshRequest): Promise<AuthResponse> {
    const { refreshToken } = dto;

    if (!refreshToken) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Refresh token is missing',
      });
    }

    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

    let payload: UserPayload;

    try {
      payload = await this.jwtService.verifyAsync<UserPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid or expired refresh token',
      });
    }

    const currentUser = await this.authRepository.findById(payload.authId);

    if (!currentUser) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'User not found',
      });
    }

    if (currentUser.status !== 'ACTIVE') {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'User is not active',
      });
    }

    const userData: UserPayload = {
      userId: payload.userId,
      authId: currentUser.id,
      email:  currentUser.email,
      role: currentUser.role,
      status: currentUser.status,
    };

    return this.issueTokens(userData,payload.userId);
  }

  private async issueTokens(user, userId: string): Promise<AuthResponse> {
    const userData: UserPayload = {
      authId: user.id, 
      userId,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const secretForAccess = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const secretForRefresh =
      this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

    const refreshToken = await this.generateToken(
      userData,
      secretForRefresh,
      '30d',
    );
    const accessToken = await this.generateToken(
      userData,
      secretForAccess,
      '15m',
    );

    return {
      accessToken,
      refreshToken,
      user: userData,
    };
  }

  private async hashPassword(password: string) {
    return await hash(password, 10);
  }

  private async comparePasswords(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return await compare(password, hash);
  }

  private async generateToken(payload: UserPayload, secret: string, expiresIn) {
    return await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
  }
}
