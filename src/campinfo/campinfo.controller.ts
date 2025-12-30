import {
  Controller,
  Get,
  HttpCode,
  Param,
  Query,
  UseFilters,
  Post,
  Body,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { CampinfoService } from './campinfo.service';
import { ResponseGetCampWrapper } from './dto/response/response-get-camp-wrapper.dto';
import { ResponseGetCampLatestList } from './dto/response/response-get-camp-latest-list.dto';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CampListResponse } from './dto/swagger/camp-list.response';
import { ResponseGetCampDetail } from './dto/response/response-get-camp-detail.dto';
import { CampInfoExceptionFilter } from './filters/campinfo-exception.filter';
import { ResponseGetCampByKeywordList } from './dto/response/response-get-camp-by-keyword-list.dto';
import { ResponseGetReviewListWrapper } from './dto/response/response-get-review-list-wrapper.dto';
import { ResponseGetBoardReviewRankList } from './dto/response/response-get-board-review-rank-list.dto';
import { RequestAddReviewDto } from './dto/request/request-add-review.dto';
import { RequestRemoveReviewDto } from './dto/request/request-remove-review.dto';
import { AccessAuthGuard } from 'src/auth/passport/access-auth.guard';
import { AccessMember } from 'src/auth/decorators/jwt-member.decorator';
import { type JwtData } from 'src/auth/interfaces/jwt.interface';
import { ResponseGetBoardReview } from './dto/response/response-get-board-review.dto';
import { RequestSetReview } from './dto/request/request-set-review.dto';
import { CampKeywordResponse } from './dto/swagger/camp-keyword.response';

@ApiTags('camp-info-rest-controller')
@Controller('/api/camps')
@UseFilters(CampInfoExceptionFilter)
export class CampinfoController {
  constructor(private readonly campinfoService: CampinfoService) {}

  @ApiOkResponse({ type: CampListResponse })
  @ApiQuery({
    name: 'size',
    required: false,
    default: 4,
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    default: 1,
  })
  @Get('/list')
  @HttpCode(200)
  getCampListLatest(
    @Query('pageNo') pageNo: number = 1,
    @Query('size') size: number = 4,
  ): Promise<ResponseGetCampWrapper<ResponseGetCampLatestList>> {
    return this.campinfoService.getCampListLatest(pageNo, size);
  }

  @ApiOkResponse({ type: CampKeywordResponse })
  @ApiQuery({
    name: 'size',
    required: false,
    default: 4,
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    default: 1,
  })
  @Get('/keyword')
  @HttpCode(200)
  getCampByKeyword(
    @Query('keyword') keyword: string,
    @Query('pageNo') pageNo: number = 1,
    @Query('size') size: number = 4,
  ): Promise<ResponseGetCampWrapper<ResponseGetCampByKeywordList>> {
    return this.campinfoService.getCampByKeyword(keyword, pageNo, size);
  }

  @ApiOkResponse({ type: ResponseGetBoardReviewRankList })
  @ApiQuery({
    name: 'limit',
    required: false,
    default: 3,
  })
  @Get('/reviews/board/rank')
  @HttpCode(200)
  getBoardReviewRank(
    @Query('limit') limit: number = 3,
  ): Promise<ResponseGetBoardReviewRankList[]> {
    return this.campinfoService.getBoardReviewRank(limit);
  }

  @ApiOkResponse({
    type: ResponseGetReviewListWrapper,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    default: 4,
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    default: 1,
  })
  @Get('/reviews/:mapX/:mapY')
  @HttpCode(200)
  getReviewList(
    @Param('mapX') mapX: string,
    @Param('mapY') mapY: string,
    @Query('pageNo') pageNo: number = 1,
    @Query('size') size: number = 4,
  ): Promise<ResponseGetReviewListWrapper> {
    return this.campinfoService.getReviewList(
      mapX,
      mapY,
      Math.max(1, pageNo),
      size,
    );
  }

  @ApiCreatedResponse({
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
  })
  @UseGuards(AccessAuthGuard)
  @Post('/members/reviews')
  @HttpCode(201)
  async addReview(
    @Body() dto: RequestAddReviewDto,
    @AccessMember() accessMember: JwtData,
  ) {
    dto.email = accessMember.email;
    await this.campinfoService.addReview(dto);
    return { message: '리뷰가 등록되었습니다.' };
  }

  @ApiNoContentResponse({
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
  })
  @Delete('/members/reviews')
  @HttpCode(204)
  async deleteReview(@Body() dto: RequestRemoveReviewDto) {
    await this.campinfoService.removeReview(dto);
  }

  @ApiOkResponse({ type: ResponseGetBoardReview })
  @Get('/reviews/board/:mapX/:mapY')
  @HttpCode(200)
  getBoardReview(
    @Param('mapX') mapX: string,
    @Param('mapY') mapY: string,
  ): Promise<ResponseGetBoardReview> {
    return this.campinfoService.getBoardReview(mapX, mapY);
  }

  @ApiOkResponse({ type: ResponseGetCampDetail })
  @Get('/detail/:mapX/:mapY')
  @HttpCode(200)
  getCampDetail(
    @Param('mapX') mapX: string,
    @Param('mapY') mapY: string,
  ): Promise<ResponseGetCampDetail> {
    return this.campinfoService.getCampDetail(mapX, mapY);
  }

  @ApiNoContentResponse({
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
  })
  @UseGuards(AccessAuthGuard)
  @Put('/members/reviews')
  @HttpCode(204)
  async setReview(
    @AccessMember() accessMember: JwtData,
    @Body() requestSetReview: RequestSetReview,
  ): Promise<void> {
    await this.campinfoService.setReview(accessMember.email, requestSetReview);
  }
}
