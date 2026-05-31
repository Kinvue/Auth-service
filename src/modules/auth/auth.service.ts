import { LoginRequest,RegisterRequest,RefreshRequest,LogoutRequest, UserPayload, AuthResponse } from '@kinvue/contracts/dist/gen/auth';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, hashSync } from 'bcrypt';
import { AuthRepository } from './auth.repository';

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
        const {email, password, name} = userCredentials;

        //перевір чи є такий емейл
        const usersWithThisEmail = await this.authRepository.checkEmailCount(email);
        if(!usersWithThisEmail) {

        }


        //хешуєш пароль
        const passwordHash = this.hashPassword(password);


        //створюєш юзера
        const newUserData = {
            email,
            passwordHash,
            name
        }

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
            accessToken: "kjdhsfgosidkuisdfu",
            refreshToken: "dkfjhgsidfgfghdfj",
            user: {
                id: "6166a544-1a9e-4974-a192-4c1900475d72",
                email : "illyaklusniggerus@gmail.com",
                name: "ehdgf"
            }
        } as AuthResponse
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
