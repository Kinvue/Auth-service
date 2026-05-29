import { LoginRequest } from '@kinvue/contracts/dist/gen/auth';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    public login (userCredentials : LoginRequest) {
        return {
          accessToken: "access",
          refreshToken: "refresh",
          user: undefined,
        }
    }
}
