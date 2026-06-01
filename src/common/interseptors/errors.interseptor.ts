import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { isEmail, isUUID } from 'class-validator';
import { Observable, tap, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

export class AuthLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthLoggerInterceptor.name);

  public intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const rpcContext = context.switchToRpc();
    const methodName = context.getHandler().name;
    const controllerName = context.getClass().name;
    const data = rpcContext.getData() as Record<string, any>;

    this.logger.log(
      `gRPC ${controllerName}.${methodName} payload: ${this.safePayload(data)}`,
    );

    const validationError = this.validatePayload(data);

    if (validationError) {
      return throwError(() =>
        new RpcException({
          code: status.INVALID_ARGUMENT,
          message: validationError,
        }),
      );
    }

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `gRPC ${controllerName}.${methodName} - ${Date.now() - start}ms`,
        );
      }),
    );
  }

  private validatePayload(data: Record<string, any>): string | null {
    if (typeof data.id === 'string' && data.id.length > 0 && !isUUID(data.id)) {
      return 'id must be UUID';
    }

    if (
      typeof data.userId === 'string' &&
      data.userId.length > 0 &&
      !isUUID(data.userId)
    ) {
      return 'userId must be UUID';
    }

    if (
      typeof data.authUserId === 'string' &&
      data.authUserId.length > 0 &&
      !isUUID(data.authUserId)
    ) {
      return 'authUserId must be UUID';
    }

    if (
      typeof data.email === 'string' &&
      data.email.length > 0 &&
      !isEmail(data.email)
    ) {
      return 'email must be valid email';
    }

    if (
      typeof data.password === 'string' &&
      data.password.length > 0 &&
      data.password.length < 6
    ) {
      return 'password must be at least 6 characters';
    }

    if (
      data.clientInfo?.name !== undefined &&
      typeof data.clientInfo.name === 'string' &&
      data.clientInfo.name.trim().length === 0
    ) {
      return 'clientInfo.name must not be empty';
    }

    if (
      data.refreshToken !== undefined &&
      typeof data.refreshToken === 'string' &&
      data.refreshToken.trim().length === 0
    ) {
      return 'refreshToken must not be empty';
    }

    return null;
  }

  private safePayload(data: Record<string, any>): string {
    const copy = structuredClone(data);

    if (copy.password) {
      copy.password = '[hidden]';
    }

    if (copy.refreshToken) {
      copy.refreshToken = '[hidden]';
    }

    if (copy.accessToken) {
      copy.accessToken = '[hidden]';
    }

    return JSON.stringify(copy);
  }
}