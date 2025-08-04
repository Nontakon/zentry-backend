import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UserRepository } from '../database/repositories/user.repository';
import { TimeHelper } from 'src/helpers/time.helper';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService,UserRepository,TimeHelper]
})
export class ProfileModule {}
