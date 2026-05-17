import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TaskModule } from './task/task.module';
import { HealthController } from './health.controller';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig),
    TaskModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
