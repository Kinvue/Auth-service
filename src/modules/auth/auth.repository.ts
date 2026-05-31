import { UserPayload } from "@kinvue/contracts/dist/gen/auth";
import { Injectable } from "@nestjs/common";
import { AuthUser } from "generated/prisma/client";
import { PrismaService } from "src/infrastructure/prisma/prisma.service";






@Injectable()
export class AuthRepository {

    public constructor(
        private readonly prisma : PrismaService
    ){}

    public async checkEmailCount (email: string ) : Promise<number> {
        return await this.prisma.authUser.count({
            where:{ email }
        });
    }
    public async findByEmail (email: string) : Promise <AuthUser | null>
    {
        return await this.prisma.authUser.findUnique({
            where: {email}
        })
    }
    public async createUser (data) {
        return await this.prisma.authUser.create({
            data
        })
    }
}