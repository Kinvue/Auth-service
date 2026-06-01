import { LoginRequest,RegisterRequest,RefreshRequest,LogoutRequest, AuthResponse , UserPayload } from '@kinvue/contracts/dist/gen/auth';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';




@Injectable()
export class AuthService {
    public constructor(
        private readonly jwtService : JwtService,
        private readonly config : ConfigService,
        private readonly authRepository : AuthRepository,
        //private readonly userService : UserService
    ){}

    public async login (userCredentials : LoginRequest) : Promise<AuthResponse> {
        const {email, password } = userCredentials;

        const currentUser = await this.authRepository.findByEmail(email);
        if(!currentUser) {
            throw new RpcException({
                code: status.UNAUTHENTICATED,
                message: "Invalid credentials!"
            })
        }
        const isPasswordValid = await this.comparePasswords(
            password,
            currentUser.passwordHash
        );
        if(!isPasswordValid){
             throw new RpcException({
                code: status.UNAUTHENTICATED,
                message: "Invalid credentials!"
            })
        }

        //отримати юзера з USER service
        const userData : UserPayload = {
            id : currentUser.id,
            email : currentUser.email,
            role : currentUser.role, 
            status : currentUser.status
        } 
        const secretForAccess = this.config.getOrThrow<string>("JWT_ACCESS_SECRET");
        const secretForRefresh = this.config.getOrThrow<string>("JWT_REFRESH_SECRET");
        
        const refreshToken = await this.generateToken(userData, secretForRefresh, "30d");
        const accessToken = await this.generateToken(userData, secretForAccess, "15m");

        return {
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: userData,
        }
    }
    public async register(userCredentials : RegisterRequest) :  Promise<AuthResponse>{
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
        //Створити юзера в USER
        //this.userService.createProfile({
        //  username: name,
        //  ?,?,?
        //})


        //генеруємо токени
        const userData : UserPayload = {
            id : user.id,
            email : user.email,
            role : user.role, 
            status : user.status
        } 
        const secretForAccess = this.config.getOrThrow<string>("JWT_ACCESS_SECRET");
        const secretForRefresh = this.config.getOrThrow<string>("JWT_REFRESH_SECRET");

        const refreshToken = await this.generateToken(userData, secretForRefresh, "30d");
        const accessToken = await this.generateToken(userData, secretForAccess, "15m");

        //повертаємо відповідь
        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: userData
        } 
    }

    

    public async logout(userCredentials : LogoutRequest) {
        return 
    }

    public async refresh(dto: RefreshRequest) {
  
      return {
        accessToken: "sdiufgsoid",
        refreshToken : "sdiufgsoid",
        user: undefined
      };
}

    private async hashPassword (password : string) {
        return await hash(password, 10)
    }
    private async comparePasswords (password : string , hash: string) : Promise<boolean> {
        return await compare(password, hash)
    }
    private async verifyToken (tocken: string, secret: string) {
        return await this.jwtService.verifyAsync<UserPayload>(
            tocken,
            { 
                secret
            }
        )
    }
    private async generateToken (payload: UserPayload, secret: string, expiresIn) {
        return await this.jwtService.signAsync(
            payload,
            { 
                secret ,
                expiresIn,
            }
        )
    }
}
