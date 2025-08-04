import { Controller, Get, Param, BadRequestException, Query, ParseIntPipe, DefaultValuePipe, ParseEnumPipe } from '@nestjs/common';
import { AnalyticService } from './analytic.service';
import { leaderBoardType } from 'src/constants/leaderboard.const';
import {  TimeRange } from 'src/constants/time.const';

@Controller('analytic')
export class AnalyticController {
    constructor(private readonly analyticService: AnalyticService) {}

  @Get('network/:username')
  async getNetworkGraph(@Param('username') username: string) {
    return this.analyticService.getNetworkGraph(username);
  }

  @Get('leaderboard/:type')
  async getLeaderboard(
    @Param('type') type: leaderBoardType,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('timeRange', new ParseEnumPipe(TimeRange, { optional: true })) timeRange?: TimeRange,
    ) {
    if (type !== leaderBoardType.strength && type !== leaderBoardType.referral) {
      throw new BadRequestException('Invalid leaderboard type. Use "strength" or "referral".');
    }
    return this.analyticService.getLeaderboard(type,limit,timeRange);
  }
}
