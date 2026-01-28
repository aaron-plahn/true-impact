import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { TrueImpactBadUserInputError } from '@true-impact/data-types';

@Catch(TrueImpactBadUserInputError)
export class BadUserInputFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse();

    const request = ctx.getRequest();

    const statusCode = HttpStatus.BAD_REQUEST;

    response.status(statusCode).json({
      timestamp: new Date().toISOString(),
      path: `${request.url}`,
      message: exception.toString(),
    });
  }
}
