import {
  ArgumentsHost,
  Catch,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AbstractHttpAdapter, BaseExceptionFilter } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

export type Error = {
  status: number;
  code?: string;
  title: string;
  detail?: string;
  stack?: string;
  source?: { [key: string]: string };
};

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  public readonly isDev: boolean;

  constructor(
    httpAdapter: AbstractHttpAdapter,
    config: ConfigService,
    private readonly logger = new Logger(),
  ) {
    super(httpAdapter);
    this.isDev = config.get('env') === 'development';
  }

  private buildErrors(exception: any, status: number): Error[] {
    const errors: Error[] = [];
    let detail: string;

    if (exception instanceof HttpException) {
      detail = exception.message;
    } else if (typeof exception === 'string') {
      detail = exception;
    } else {
      detail = (exception && exception.message) || 'Unknown error';
    }

    const error: Error = {
      detail,
      status,
      code: exception.code,
      title: 'error',
    };

    if (this.isDev) {
      error.stack = exception.stack;
    }

    if (exception.response && Array.isArray(exception.response.message)) {
      for (const message of exception.response.message) {
        errors.push({
          ...error,
          detail: message,
          status: exception.response.statusCode,
          source: {
            point: message,
          },
        });
      }
    } else {
      errors.push(error);
    }

    return errors;
  }

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (!(exception instanceof UnauthorizedException)) {
      this.logger.error(exception);
    }

    let code = 422;
    if (exception instanceof HttpException) {
      code = exception.getStatus();
    }

    const errors: Error[] = this.buildErrors(exception, code);
    response.status(code).json({
      errors,
    });
  }
}
