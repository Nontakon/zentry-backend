import { Injectable } from '@nestjs/common';
import { UserRepository } from '../database/repositories/user.repository';
import { User, UserReferralCount } from 'src/interfaces/user.interface';
import { StreamDataService } from '../stream-data/stream-data.service';
import { generator } from 'src/bacefook-core';

@Injectable()
export class AdminService {
    constructor(
        private readonly userRepository: UserRepository, 
        private readonly streamDataService: StreamDataService,
    ) {}
    
    async deleteAllData(): Promise<{ status: string }> {
        await this.userRepository.deleteAllData();
        return { status: 'All data has been deleted.' };
    }

    async findCircularReferrals(): Promise<{ user1: string; user2: string }[]> {
        return this.userRepository.findCircularReferrals();
    }

    async deleteSpecificUsers(userNames: string[]): Promise<{ status: string; deleted: number }> {
        await this.userRepository.deleteSpecificUsers(userNames);
        return { status: 'Specified users have been deleted.', deleted: userNames.length };
    }

    async findUsersWithMultipleReferrers(): Promise<UserReferralCount[]> {
        return this.userRepository.findUsersWithMultipleReferrers();
    }

    async streamData(total: number): Promise<{status: string}> {
        const { value: events, done } = await generator.stream(total).next();
        if (done) {
            return { status: 'Event stream has finished.'};
        }
        if (events && events.length > 0) {
            await this.streamDataService.processEvents(events);
        }
        return { status: 'All data has been deleted.' };
    }
}
