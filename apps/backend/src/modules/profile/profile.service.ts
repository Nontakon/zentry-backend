import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../database/repositories/user.repository';
import { TimeInterval, TimeRange } from 'src/constants/time.const';
import ms from 'ms';
import { TimeHelper } from 'src/helpers/time.helper';

@Injectable()
export class ProfileService {
    constructor(
        private readonly userRepository: UserRepository,
        private timeHelper: TimeHelper,
    ) {}

    async getUserProfile(username: string, groupBy: TimeInterval,timeRange?: TimeRange) {
        const milliseconds = ms(groupBy)
        const bucketIntervalSeconds = milliseconds/1000
        const sinceDatetime = this.timeHelper.getSinceDatetime(timeRange);
        const userProfile = await this.userRepository.findUserProfile(username,bucketIntervalSeconds,sinceDatetime);
        if (!userProfile) {
        throw new NotFoundException(`User ${username} not found`);
        }
        const totalFriendCount = userProfile.friendCountByTime.reduce(
            (sum, current) => sum + current.count,
            0
        );
        const totalReferralCount = userProfile.referralCountByTime.reduce(
            (sum, current) => sum + current.count,
            0
        );
        return {
            ...userProfile,
            totalFriendCount,
            totalReferralCount,
        };
    }

    async getInfluentialFriends(username: string, limit: number) {
    return this.userRepository.findInfluentialUsers(limit, username);
    }

    async getFriendsPaginated(username: string, page: number, limit: number) {
        const totalFriends = await this.userRepository.countTotalFriends(username);
        const totalPage = Math.ceil(totalFriends / limit);
  
        if (page > totalPage && totalFriends > 0) {
            return {
                data: [],
                total: totalFriends,
                currentPage : page,
                limit,
                totalPage
            };
        }
  
        const friends = await this.userRepository.fecthFriends(username, page, limit);
        
        return {
            data: friends,
            total: totalFriends,
            currentPage : page,
            limit,
            totalPage
        };
    }
}
