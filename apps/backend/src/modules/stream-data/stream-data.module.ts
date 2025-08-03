import { Module } from '@nestjs/common';
import { StreamDataService } from './stream-data.service';
import { DatabaseModule } from '../database/database.module';
import { UserRepository } from '../database/repositories/user.repositpry';
import { TimeHelper } from 'src/helpers/time.helper';

@Module({
  imports: [DatabaseModule],
  providers: [StreamDataService,UserRepository,TimeHelper]
})
export class StreamDataModule {}
