import { Controller, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse, LoginRequest, RegisterRequest } from '@kinvue/contracts/dist/gen/auth';
import { AUTH_SERVICE_NAME } from '@kinvue/contracts/dist/gen/constants';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class AuthController {
    constructor(
      private readonly authService: AuthService,
    ) {}

  @GrpcMethod(AUTH_SERVICE_NAME, 'Login')
  public login (userCredentials : LoginRequest) : AuthResponse {
    return this.authService.login(userCredentials);
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'Register')
  public async Register (userCredentials : RegisterRequest) : Promise<AuthResponse> {
    return await this.authService.register(userCredentials);
  }

}
