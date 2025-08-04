import { Injectable, Logger, OnApplicationBootstrap, Inject, OnModuleInit } from '@nestjs/common';
import { generator } from '../../bacefook-core';
import { ConnectionEvent, RegisterEvent, ReferralEvent, AddFriendEvent, UnfriendEvent } from '../../bacefook-core/types';
import { UserRepository } from '../database/repositories/user.repository';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TimeHelper } from 'src/helpers/time.helper';
import { AddFriendRelationShip, CreateUserAndRelationShip, ReferralRelationShip, RegisterUser, UnfriendRelationShip } from '../database/entities/user.entity';
import { streamUserCount } from 'src/constants/stream.const';

@Injectable()
export class StreamDataService {
  private readonly logger = new Logger(StreamDataService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private timeHelper: TimeHelper,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.log('Cron job started: Fetching new events from Bacefook Core...');
    const { value: events, done } = await generator.stream(streamUserCount).next();
    if (done) {
      this.logger.log('Event stream has finished.');
      return;
    }
    if (events && events.length > 0) {
      await this.processEvents(events);
      this.logger.log('Event batch processed successfully.');
    } else {
      this.logger.log('No new events in this iteration.');
    }
  }
  public async processEvents(events: ConnectionEvent[]): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Processing a batch of ${events.length} events...`);

    const createUserAndRelationShip : CreateUserAndRelationShip = {
      registerUser: [],
      referralRelationShip: [],
      addFriendRelationShip: [],
      unFriendRelationShip: [],
    }

    events.forEach(e => {
      switch (e.type) {
        case "register":
          e as RegisterEvent

          const registerUser: RegisterUser = {
            name : e.name,
            created_at: this.timeHelper.toISODate(e.created_at).toISOString(),
          }
          createUserAndRelationShip.registerUser.push(registerUser)
          break;
        case "referral":
          e as ReferralEvent 
          const referralRelationShip: ReferralRelationShip = {
            referredBy : e.referredBy,
            user : e.user,
            created_at: this.timeHelper.toISODate(e.created_at).toISOString(),
          }
          createUserAndRelationShip.referralRelationShip.push(referralRelationShip)
          break;
        case "addfriend":
          e as AddFriendEvent
          const addFriendRelationShip: AddFriendRelationShip = {
            user1_name : e.user1_name,
            user2_name : e.user2_name,
            created_at: this.timeHelper.toISODate(e.created_at).toISOString(),
          }
          createUserAndRelationShip.addFriendRelationShip.push(addFriendRelationShip)
          break;
        case "unfriend":
          e as UnfriendEvent
          const unfriendRelationShip: UnfriendRelationShip = {
            user1_name : e.user1_name,
            user2_name : e.user2_name,
            created_at: this.timeHelper.toISODate(e.created_at).toISOString(),
          }
          createUserAndRelationShip.unFriendRelationShip.push(unfriendRelationShip)
          break;
      }
    })

    try {
        await this.userRepository.bulkUpsertUserAndRelationShips(createUserAndRelationShip);
    } catch (error) {
        this.logger.error('Failed to process event batch', error);
    }

    const endTime = Date.now();
    this.logger.log(`Batch of ${events.length} events processed in ${endTime - startTime}ms`);
  }
}