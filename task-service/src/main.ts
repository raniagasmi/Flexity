import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create a regular HTTP Nest application so HTTP routes (like /health) work
  const app = await NestFactory.create(AppModule);

  // Also connect the TCP microservice used for internal communication
  const microservice = app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: process.env.MICRO_PORT ? parseInt(process.env.MICRO_PORT) : (process.env.PORT ? parseInt(process.env.PORT) + 1 : 3003),
    },
  });

  await app.startAllMicroservices();
  const httpPort = process.env.PORT ? parseInt(process.env.PORT) : (process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3002);
  await app.listen(httpPort);
  console.log(`HTTP server listening on ${httpPort}`);
}

bootstrap();
