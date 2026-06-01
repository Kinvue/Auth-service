import {USER_V1_PACKAGE_NAME } from "@kinvue/contracts/dist/gen/user";
import { ConfigService } from "@nestjs/config";
import { GrpcOptions, Transport } from "@nestjs/microservices";

import {USER_PROTO_PATH} from "@kinvue/contracts/dist/gen/constants"

export const userGrpcConfig = (
    config : ConfigService
) : GrpcOptions  => ({
    transport: Transport.GRPC,
    options: {
        package: USER_V1_PACKAGE_NAME,
        protoPath : USER_PROTO_PATH,
        url: `${config.getOrThrow('USER_GRPC_HOST')}:${config.getOrThrow('USER_GRPC_PORT')}`,
    },
});