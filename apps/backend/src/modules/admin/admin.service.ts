import { Injectable } from '@nestjs/common';
import { UserRepository } from '../database/repositories/user.repository';
import { User, UserReferralCount } from 'src/interfaces/user.interface';
import { StreamDataService } from '../stream-data/stream-data.service';
import { generator } from 'src/bacefook-core';
import { CreateUserAndRelationShip, RegisterUser } from '../database/entities/user.entity';

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

    async createUser (user:string,createAt: string): Promise<{status: string}> {
        const createUserAndRelationShip: CreateUserAndRelationShip = {
            registerUser : [
                {
                    name : user,
                    created_at: new Date(createAt).toISOString(),
                }
            ],
            referralRelationShip : [],
            addFriendRelationShip: [],
            unFriendRelationShip: [],
        }
        await this.userRepository.bulkUpsertUserAndRelationShips(createUserAndRelationShip);
        return { status: 'User has been created.' };
    }

    async createReferralRelationShip (referredBy:string, user: string,createAt: string): Promise<{status: string}> {
        const createUserAndRelationShip: CreateUserAndRelationShip = {
            registerUser : [],
            referralRelationShip : [
                { referredBy: referredBy , user: user, created_at:new Date(createAt).toISOString()}
            ],
            addFriendRelationShip: [],
            unFriendRelationShip: [],
        }
        await this.userRepository.bulkUpsertUserAndRelationShips(createUserAndRelationShip);
        return { status: 'ReferralRelationShip has been created.' };
    }

    async createFriendRelationShip (user1:string,user2: string,createAt: string): Promise<{status: string}> {
        const createUserAndRelationShip: CreateUserAndRelationShip = {
            registerUser : [],
            referralRelationShip : [],
            addFriendRelationShip: [
                { user1_name: user1, user2_name: user2, created_at:new Date(createAt).toISOString()}  
            ],
            unFriendRelationShip: [],
        }
        await this.userRepository.bulkUpsertUserAndRelationShips(createUserAndRelationShip);
        return { status: 'FriendRelationShip has been created.' };
    }

    async deleteFriendRelationShip (user1:string,user2: string): Promise<{status: string}> {
        const createUserAndRelationShip: CreateUserAndRelationShip = {
            registerUser : [],
            referralRelationShip : [],
            addFriendRelationShip: [],
            unFriendRelationShip: [
                { user1_name: user1, user2_name: user2 }
            ],
        }
        await this.userRepository.bulkUpsertUserAndRelationShips(createUserAndRelationShip);
        return { status: 'FriendRelationShip has been deleted.' };
    }
}
