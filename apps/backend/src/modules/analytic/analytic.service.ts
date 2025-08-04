import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../database/repositories/user.repository';
import { leaderBoardType } from 'src/constants/leaderboard.const';
import { UserNetwork } from 'src/interfaces/user.interface';
import {  TimeRange } from 'src/constants/time.const';
import { TimeHelper } from 'src/helpers/time.helper';

@Injectable()
export class AnalyticService {
    constructor(
        private readonly userRepository: UserRepository,  
        private timeHelper: TimeHelper,
    ) {}
    
    async getNetworkGraph(username: string): Promise<UserNetwork> {
        const user = await this.userRepository.findUserNetWork(username);

        if (!user) {
        throw new NotFoundException(`User ${username} not found`);
        }

        return user
    }

    async getLeaderboard(type: leaderBoardType,limit: number,timeRange?: TimeRange) {
        const sinceDatetime = this.timeHelper.getSinceDatetime(timeRange);
        if (type === leaderBoardType.strength) {
            return this.userRepository.findStrengthLeaderboard(limit,sinceDatetime);
        } else {
            return this.userRepository.findReferralLeaderboard(limit,sinceDatetime);
        }
    }

}
