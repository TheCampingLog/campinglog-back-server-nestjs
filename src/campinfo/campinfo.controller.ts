import { Controller, Get, Query } from '@nestjs/common';
import { CampinfoService } from './campinfo.service';
import { ResponseGetCampWrapper } from './dto/response/response-get-camp-wrapper.dto';
import { ResponseGetCampLatestList } from './dto/response/response-get-camp-latest-list.dto';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CampListResponse } from './dto/swagger/camp-list.response';

@ApiTags('camp-info-rest-controller')
@Controller('/api/camps')
export class CampinfoController {
  constructor(private readonly campinfoService: CampinfoService) {}

  @Get('/test')
  getHello(): string {
    return 'hello';
  }

  @ApiOkResponse({ type: CampListResponse }) // ⭐ Swagger 자동 스키마
  @ApiQuery({
    name: 'size',
    required: false,
    schema: { type: 'integer', default: 4 },
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    schema: { type: 'integer', default: 1 },
  })
  @Get('/list')
  getCampListLatest(
    @Query('pageNo') pageNo = 1,
    @Query('size') size = 4,
  ): Promise<ResponseGetCampWrapper<ResponseGetCampLatestList>> {
    return this.campinfoService.getCampListLatest(pageNo, size);
  }
}
