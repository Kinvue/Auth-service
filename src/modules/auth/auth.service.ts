import { LoginRequest,RegisterRequest,RefreshRequest,LogoutRequest, UserPayload, AuthResponse } from '@kinvue/contracts/dist/gen/auth';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, hashSync } from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Injectable()
export class AuthService {

    public constructor(
        private readonly jwtService : JwtService,
        private readonly config : ConfigService,
        private readonly authRepository : AuthRepository,
    ){}



    public login (userCredentials : LoginRequest) {
        return {
          accessToken: "access",
          refreshToken: "refresh",
          user: undefined,
        }
    }

    public async register(userCredentials : RegisterRequest) {
        const {email, password , clientInfo} = userCredentials;

        //перевір чи є такий емейл
        const usersWithThisEmail = await this.authRepository.checkEmailCount(email);
        if(usersWithThisEmail) {
            throw new RpcException({
                code: status.ALREADY_EXISTS,
                message: "User with this credentials already exists"
            })
        }

        //хешуєш пароль
        const hash = await this.hashPassword(password);

        //створюєш юзера
        const newUserData = {
            email: email,
            passwordHash: hash,
        }
        const user = await this.authRepository.createUser(newUserData)
        const {passwordHash,...userData}=user


        //генеруємо токени
        const secretForAccess = this.config.getOrThrow<string>("JWT_ACCESS_SECRET");
        const secretForRefresh = this.config.getOrThrow<string>("JWT_REFRESH_SECRET");

        const accessToken = await this.jwtService.signAsync(
            newUserData,
            { 
                secret: secretForAccess,
                expiresIn: '15m',
            }
        )
        const refreshToken = await this.jwtService.signAsync(
            newUserData,
            { 
                secret: secretForRefresh,
                expiresIn: '7d',
            }
        )


        //повертаємо відповідь
        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: userData
        } 
    }

    
    public refresh (userCredentials : RefreshRequest) {
        return{
            accessToken: "access",
            refreshToken: "refresh",
        }
    }



    private async hashPassword (password : string) {
        return await hash(password, 10)
    }


}
