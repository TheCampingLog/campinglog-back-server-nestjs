import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestAddMemeberDto } from './dto/request/request-add-member.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/api/members')
  async create(@Body() requestAddMemberDto: RequestAddMemeberDto) {
    return await this.authService.create(requestAddMemberDto);
  }
}
