import { Controller, Get, Param, BadRequestException, Query, ParseIntPipe, DefaultValuePipe, ParseEnumPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { leaderBoardType } from 'src/constants/leaderboard.const';
import { TimeInterval, TimeRange } from 'src/constants/time.const';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

  @Get('network/:username')
  async getNetworkGraph(@Param('username') username: string) {
    return this.userService.getNetworkGraph(username);
  }

  @Get('leaderboard/:type')
  async getLeaderboard(
    @Param('type') type: leaderBoardType,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('time-range', new ParseEnumPipe(TimeRange, { optional: true })) timeRange?: TimeRange,
    ) {
    if (type !== leaderBoardType.strength && type !== leaderBoardType.referral) {
      throw new BadRequestException('Invalid leaderboard type. Use "strength" or "referral".');
    }
    return this.userService.getLeaderboard(type,limit,timeRange);
  }

  @Get('profile/:username')
  async getUserProfile(
    @Param('username') username: string,
    @Query('group-by', new DefaultValuePipe(TimeInterval.ONE_MINUTE), new ParseEnumPipe(TimeInterval)) groupBy: TimeInterval,
    @Query('time-range', new ParseEnumPipe(TimeRange, { optional: true })) timeRange?: TimeRange,
  ) {
    return this.userService.getUserProfile(username,groupBy,timeRange);
  }

  @Get('profile/:username/influential-friends')
  async getInfluentialFriends(
      @Param('username') username: string,
      @Query('limit', new DefaultValuePipe(3), ParseIntPipe) limit: number,
  ) {
      return this.userService.getInfluentialFriends(username, limit);
  }

  @Get('profile/:username/friends')
  async getFriendsPaginated(
      @Param('username') username: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
      return this.userService.getFriendsPaginated(username, page, limit);
  }
}
