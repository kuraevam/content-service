import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseSerializerInterceptor } from './interceptors/response-serializer.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Logger
  app.useLogger(app.get(Logger));

  // API Version
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Simple Project')
    .setDescription('The API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(
    new ResponseSerializerInterceptor(app.get(Reflector)),
  );

  const configService = app.get(ConfigService);

  //add handle Exception
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapter, configService));

  const port = configService.get('PORT');

  await app.listen(port);
}
bootstrap();
