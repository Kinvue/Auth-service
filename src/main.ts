import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { AUTH_V1_PACKAGE_NAME } from '@kinvue/contracts/dist/gen/auth';
import { join } from 'path';
import {AUTH_PROTO_PATH} from "@kinvue/contracts/dist/gen/constants"
import { Logger, UseInterceptors } from '@nestjs/common';
import { LoggerInterceptor } from './interseptors/logger.interseptor';


async function bootstrap() {
  const logger = new Logger("Main");
  const host = process.env.AUTH_GRPC_HOST ?? '0.0.0.0';
  const port = process.env.AUTH_GRPC_PORT ?? '50051';


  logger.log("Setup Auth-service...");
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: AUTH_V1_PACKAGE_NAME,
      protoPath: join(process.cwd(), AUTH_PROTO_PATH),
      url: `${host}:${port}`,
    },
  });
  logger.log("Setup Auth-service completed");

  app.useGlobalInterceptors(new LoggerInterceptor())

  await app.listen();
  logger.log(`Service started on: ${host}:${port}`);

}
bootstrap();
