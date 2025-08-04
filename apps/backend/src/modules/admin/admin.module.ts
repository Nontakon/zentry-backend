import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserRepository } from '../database/repositories/user.repository';
import { TimeHelper } from 'src/helpers/time.helper';
import { StreamDataModule } from '../stream-data/stream-data.module';

@Module({
  imports : [StreamDataModule],
  controllers: [AdminController],
  providers: [AdminService,UserRepository,TimeHelper]
})
export class AdminModule {}
