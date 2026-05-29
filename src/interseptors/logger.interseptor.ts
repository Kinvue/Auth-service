import { CallHandler, ExecutionContext, Logger, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { Observable, tap } from "rxjs";



export class LoggerInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggerInterceptor.name);

    public intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const rpcContext = context.switchToRpc();
        const methodName = context.getHandler().name;
        const controllerName = context.getClass().name;
        const data = rpcContext.getData();

        const start = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - start;
                this.logger.log(`gRPC ${controllerName}.${methodName} - ${Date.now() - start}ms`)
            })
        );
    }
}