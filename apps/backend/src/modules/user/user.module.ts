import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from '../database/repositories/user.repositpry';

@Module({
  controllers: [UserController],
  providers: [UserService,UserRepository]
})
export class UserModule {}
