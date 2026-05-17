import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { AuthModule } from '../auth/auth.module';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { TaskReminderScheduler } from './task-reminder.scheduler';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    AuthModule,
    CollaborationModule,
    UserModule,
    ClientsModule.register([
      {
        name: 'TASK_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'task-service',
            port: 3003,
        },
      },
    ]),
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskReminderScheduler],
})
export class TaskModule {}
