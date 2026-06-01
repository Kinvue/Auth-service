import {
  USER_PACKAGE,
  USER_SERVICE_NAME,
} from '@kinvue/contracts/dist/gen/constants';
import { CreateProfileRequest, USER_V1_PACKAGE_NAME, UserServiceClient } from '@kinvue/contracts/dist/gen/user';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class UserService implements OnModuleInit {
  private userClient: UserServiceClient;

  constructor(
    @Inject(USER_V1_PACKAGE_NAME)
    private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userClient =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  public async createProfile(data: CreateProfileRequest) {
    return await firstValueFrom(
      this.userClient.createProfile(data)
    );
  }

  public async getProfileByAuthUserId(authUserId: string) {
    return await firstValueFrom(this.userClient.getProfileByAuthUserId({ authUserId }));
  }

}