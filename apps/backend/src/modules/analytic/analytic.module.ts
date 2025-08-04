import { Module } from '@nestjs/common';
import { AnalyticController } from './analytic.controller';
import { AnalyticService } from './analytic.service';
import { UserRepository } from '../database/repositories/user.repository';
import { TimeHelper } from 'src/helpers/time.helper';

@Module({
  controllers: [AnalyticController],
  providers: [AnalyticService,UserRepository,TimeHelper]
})
export class AnalyticModule {}
