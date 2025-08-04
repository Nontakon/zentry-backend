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
}
