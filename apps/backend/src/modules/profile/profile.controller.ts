import { Controller, Get, Param, BadRequestException, Query, ParseIntPipe, DefaultValuePipe, ParseEnumPipe } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { TimeInterval, TimeRange } from 'src/constants/time.const';

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

  @Get(':username')
  async getUserProfile(
    @Param('username') username: string,
    @Query('groupBy', new DefaultValuePipe(TimeInterval.ONE_MINUTE), new ParseEnumPipe(TimeInterval)) groupBy: TimeInterval,
    @Query('timeRange', new ParseEnumPipe(TimeRange, { optional: true })) timeRange?: TimeRange,
  ) {
    return this.profileService.getUserProfile(username,groupBy,timeRange);
  }

  @Get(':username/influential-friends')
  async getInfluentialFriends(
      @Param('username') username: string,
      @Query('limit', new DefaultValuePipe(3), ParseIntPipe) limit: number,
  ) {
      return this.profileService.getInfluentialFriends(username, limit);
  }

  @Get(':username/friends')
  async getFriendsPaginated(
      @Param('username') username: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
      return this.profileService.getFriendsPaginated(username, page, limit);
  }
}
