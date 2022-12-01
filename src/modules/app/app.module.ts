import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import appConfig, { getConfigValidationSchema } from 'src/app.config';
import { AppController } from '../../controllers/app/app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    LoggerModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      validationSchema: getConfigValidationSchema(),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
