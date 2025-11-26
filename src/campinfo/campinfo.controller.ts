import { Controller, Get, Query } from '@nestjs/common';
import { CampinfoService } from './campinfo.service';
import { ResponseGetCampWrapper } from './dto/response/response-get-camp-wrapper.dto';
import { ResponseGetCampLatestList } from './dto/response/response-get-camp-latest-list.dto';

@Controller('/api/camps')
export class CampinfoController {
  constructor(private readonly campinfoService: CampinfoService) {}

  @Get('/test')
  getHello(): string {
    return 'hello';
  }

  @Get('/list')
  getCampListLatest(
    @Query('pageNo') pageNo = 1,
    @Query('size') size = 4
  ): Promise<ResponseGetCampWrapper<ResponseGetCampLatestList>> {
    return this.campinfoService.getCampListLatest(pageNo, size);
  }
}
