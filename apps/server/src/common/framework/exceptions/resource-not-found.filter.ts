import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResourceNotFoundException } from './resource-not-found.exception';

@Catch(ResourceNotFoundException)
export class ResourceNotFoundFilter implements ExceptionFilter {
  catch(exception: ResourceNotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    const request = ctx.getRequest<Request>();

    const statusCode = HttpStatus.NOT_FOUND;

    response.status(statusCode).json({
      timestamp: new Date().toISOString(),
      path: `${request.url}`,
      message: exception.toString(),
    });
  }
}
