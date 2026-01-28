import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { TrueImpactBadUserInputError } from '@true-impact/data-types';
import { Request, Response } from 'express';

@Catch(TrueImpactBadUserInputError)
export class BadUserInputFilter implements ExceptionFilter {
  catch(exception: TrueImpactBadUserInputError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    const request = ctx.getRequest<Request>();

    const statusCode = HttpStatus.BAD_REQUEST;

    response.status(statusCode).json({
      timestamp: new Date().toISOString(),
      path: `${request.url}`,
      message: exception.toString(),
    });
  }
}
