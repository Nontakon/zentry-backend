import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { StreamDataModule } from './modules/stream-data/stream-data.module';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { TimeHelper } from './helpers/time.helper';
import { ConfigModule } from '@nestjs/config';
import { AnalyticModule } from './modules/analytic/analytic.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    StreamDataModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AnalyticModule,
    ProfileModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    TimeHelper],
})
export class AppModule {}