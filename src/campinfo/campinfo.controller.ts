import {
  Controller,
  Get,
  HttpCode,
  Param,
  Query,
  UseFilters,
} from '@nestjs/common';
import { CampinfoService } from './campinfo.service';
import { ResponseGetCampWrapper } from './dto/response/response-get-camp-wrapper.dto';
import { ResponseGetCampLatestList } from './dto/response/response-get-camp-latest-list.dto';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CampListResponse } from './dto/swagger/camp-list.response';
import { ResponseGetCampDetail } from './dto/response/response-get-camp-detail.dto';
import { CampInfoExceptionFilter } from './filters/campinfo-exception.filter';
import { ResponseGetCampByKeywordList } from './dto/response/response-get-camp-by-keyword-list.dto';
import { ResponseGetReviewListWrapper } from './dto/response/response-get-review-list-wrapper.dto';

@ApiTags('camp-info-rest-controller')
@Controller('/api/camps')
@UseFilters(CampInfoExceptionFilter)
export class CampinfoController {
  constructor(private readonly campinfoService: CampinfoService) {}

  @Get('/test')
  getHello(): string {
    return 'hello';
  }

  @ApiOkResponse({ type: CampListResponse })
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
  @HttpCode(200)
  getCampListLatest(
    @Query('pageNo') pageNo: number = 1,
    @Query('size') size: number = 4,
  ): Promise<ResponseGetCampWrapper<ResponseGetCampLatestList>> {
    return this.campinfoService.getCampListLatest(pageNo, size);
  }

  @Get('/detail/:mapX/:mapY')
  @HttpCode(200)
  getCampDetail(
    @Param('mapX') mapX: string,
    @Param('mapY') mapY: string,
  ): Promise<ResponseGetCampDetail> {
    return this.campinfoService.getCampDetail(mapX, mapY);
  }

  @Get('/keyword')
  @HttpCode(200)
  getCampByKeyword(
    @Query('keyword') keyword: string,
    @Query('pageNo') pageNo: number = 1,
    @Query('size') size: number = 4,
  ): Promise<ResponseGetCampWrapper<ResponseGetCampByKeywordList>> {
    return this.campinfoService.getCampByKeyword(keyword, pageNo, size);
  }

  @Get('/reviews/:mapX/:mapY')
  @HttpCode(200)
  getReviewList(
    @Param('mapX') mapX: string,
    @Param('mapY') mapY: string,
    @Query('pageNo') pageNo: number = 0,
    @Query('size') size: number = 4,
  ): Promise<ResponseGetReviewListWrapper> {
    return this.campinfoService.getReviewList(mapX, mapY, pageNo, size);
  }
}
