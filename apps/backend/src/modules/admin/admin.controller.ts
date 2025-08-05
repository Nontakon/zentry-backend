import { Controller, Get, Param, Delete, Body, Post, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Delete('all-data')
    deleteAllData() {
        return this.adminService.deleteAllData();
    }

    @Get('circular-referrals')
    findCircularReferrals() {
        return this.adminService.findCircularReferrals();
    }

    @Delete('users')
    deleteSpecificUsers(@Body('userNames') userNames: string[]) {
        return this.adminService.deleteSpecificUsers(userNames);
    }

    @Get('multi-referrers')
    findReferrersOf() {
        return this.adminService.findUsersWithMultipleReferrers();
    }

    @Post('stream-data')
    streamData(@Query('total', new DefaultValuePipe(1) ,ParseIntPipe) total: number) {
        return this.adminService.streamData(total);
    }

    @Post('users/')
    createUser(
        @Body('user') user: string,
        @Body('createAt') createAt: string
    ) {
        return this.adminService.createUser(user,createAt);
    }

    @Post('users/relationship/referral')
    createReferralRelationShip(
        @Body('referredBy') referredBy: string,
        @Body('user') user: string,
        @Body('createAt') createAt: string
    ) {
        return this.adminService.createReferralRelationShip(referredBy,user,createAt);
    }

    @Post('users/relationship/friend')
    createFriendRelationShip(
        @Body('user1') user1: string,
        @Body('user2') user2: string,
        @Body('createAt') createAt: string
    ) {
        return this.adminService.createFriendRelationShip(user1,user2,createAt);
    }

    @Delete('users/relationship/friend')
    deleteFriendRelationShip(
        @Body('user1') user1: string,
        @Body('user2') user2: string
    ) {
        return this.adminService.deleteFriendRelationShip(user1,user2);
    }

}
