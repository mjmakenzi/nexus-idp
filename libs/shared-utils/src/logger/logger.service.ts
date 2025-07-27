import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

@Injectable()
export class LoggerService {
  constructor(private readonly logger: Logger) {}

  info(message: string, data: any) {
    this.logger.log('warn', message, data);
  }

  error(message: string, data: any) {
    this.logger.log('error', message, data);
  }
}
