import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { ResourceNotFoundException } from './resource-not-found.exception';

@Catch(ResourceNotFoundException)
export class ResourceNotFoundFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse();

    const request = ctx.getRequest();

    const statusCode = HttpStatus.NOT_FOUND;

    response.status(statusCode).json({
      timestamp: new Date().toISOString(),
      path: `${request.url}`,
      message: exception.toString(),
    });
  }
}
