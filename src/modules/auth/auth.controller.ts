import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse, LoginRequest } from '@kinvue/contracts/dist/gen/auth';
import { AUTH_SERVICE_NAME } from '@kinvue/contracts/dist/gen/constants';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

  @GrpcMethod(AUTH_SERVICE_NAME, 'Login')
  public login (userCredentials : LoginRequest) : AuthResponse {
    return this.authService.login(userCredentials);
  }
}
