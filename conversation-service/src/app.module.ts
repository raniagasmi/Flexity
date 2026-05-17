import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { CollaborationModule } from './collaboration/collaboration.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://mongo:27017/conversation_service'),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST ?? 'user-service',
          port: process.env.USER_SERVICE_PORT ? parseInt(process.env.USER_SERVICE_PORT, 10) : 3005,
        },
      },
      {
        name: 'TASK_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.TASK_SERVICE_HOST ?? 'task-service',
          port: process.env.TASK_SERVICE_PORT ? parseInt(process.env.TASK_SERVICE_PORT, 10) : 3003,
        },
      },
    ]),
    CollaborationModule,
  ],
    controllers: [HealthController],
  providers: [],
})
export class AppModule {}
