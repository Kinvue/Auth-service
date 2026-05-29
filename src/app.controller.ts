import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import { AUTH_PACKAGE } from '@kinvue/contracts/dist/gen/constants';
import { AUTH_SERVICE_NAME, AuthResponse, LoginRequest } from '@kinvue/contracts/dist/gen/auth';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod(AUTH_SERVICE_NAME, 'Login')
  public login (userCredentials : LoginRequest) : AuthResponse {
    return this.appService.login(userCredentials);
  }
}
