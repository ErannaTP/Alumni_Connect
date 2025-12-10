// src/user/user.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user') // ✅ NOT 'api/user'
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile() {
    return this.userService.getProfile();
  }

  @Post('profile')
  async updateProfile(@Body() body: any) {
    return this.userService.updateProfile(body);
  }
}
