import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionManager');

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(request),
            message: (exception as any)?.response?.message || (exception as any)?.message || 'Internal server error',
        };

        // Advanced Logging Logic
        this.logError(exception, request, httpStatus);

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }

    private logError(exception: any, request: any, status: number) {
        const { method, url, body, user } = request;
        const userStr = user ? `[User ID: ${user.sub || user.id}]` : '[Guest]';

        let explanation = 'Backend logic error';

        // Attempt to explain common errors
        if (status === 404) explanation = 'The requested resource/page was not found on the server.';
        if (status === 401) explanation = 'Unauthorized access. Check your token or login credentials.';
        if (status === 403) explanation = 'Forbidden. You do not have permission for this action.';
        if (status === 400) explanation = 'Bad Request. Check validation or sent data format.';

        // Check for TypeORM errors
        if (exception?.code === '23505') explanation = 'Database Conflict: Unique constraint violation (Duplicate data).';
        if (exception?.code === '23503') explanation = 'Database Conflict: Foreign key violation (Referenced ID not found).';

        this.logger.error(`
--- [ ERROR REPORT ] ---
🚨 STATUS: ${status} (${explanation})
🔍 REQUEST: ${method} ${url}
🧑 AUTH: ${userStr}
📦 BODY: ${JSON.stringify(this.sanitizeBody(body))}
📄 MESSAGE: ${exception?.message || 'Unknown error'}
🔥 STACK: ${exception?.stack || 'No stack trace available'}
------------------------
    `);
    }

    private sanitizeBody(body: any) {
        if (!body) return {};
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'secret', 'key'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) sanitized[field] = '********';
        });
        return sanitized;
    }
}
