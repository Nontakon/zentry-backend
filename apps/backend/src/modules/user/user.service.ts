import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../database/repositories/user.repositpry';
import { leaderBoardType } from 'src/constants/leaderboard.const';
import { UserNetwork } from 'src/interfaces/user.interface';
import { TimeInterval, TimeRange } from 'src/constants/time.const';

@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository) {}
    
    private _parseTimeIntervalToSeconds(time: TimeInterval): number {
        const duration = parseInt(time, 10);
        if (isNaN(duration)) return 60; // Default to 1 minute

        if (time.endsWith('s')) return duration;
        if (time.endsWith('min')) return duration * 60;
        if (time.endsWith('hr')) return duration * 3600;
        if (time.endsWith('days')) return duration * 86400;
        
        return 60; // Default fallback
    }
    
    private _getSinceDatetime(timeRange?: TimeRange): string {
        if (!timeRange) {
            return '1970-01-01T00:00:00Z'; // Default to a very old date if no range is specified
        }
        const now = new Date();
        switch (timeRange) {
            case TimeRange.HOUR:
                now.setHours(now.getHours() - 1);
                break;
            case TimeRange.DAY:
                now.setDate(now.getDate() - 1);
                break;
            case TimeRange.WEEK:
                now.setDate(now.getDate() - 7);
                break;
        }
        return now.toISOString();
    }
    
    async getNetworkGraph(username: string): Promise<UserNetwork> {
        const user = await this.userRepository.findUserNetWork(username);

        if (!user) {
        throw new NotFoundException(`User ${username} not found`);
        }

        return user
    }

    async getLeaderboard(type: leaderBoardType,limit: number,timeRange?: TimeRange) {
        const sinceDatetime = this._getSinceDatetime(timeRange);
        if (type === leaderBoardType.strength) {
            return this.userRepository.findStrengthLeaderboard(limit,sinceDatetime);
        } else {
            return this.userRepository.findReferralLeaderboard(limit,sinceDatetime);
        }
    }

    async getUserProfile(username: string, groupBy: TimeInterval,timeRange?: TimeRange) {
        const bucketIntervalSeconds = this._parseTimeIntervalToSeconds(groupBy);
        const sinceDatetime = this._getSinceDatetime(timeRange);
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
