import { Test, TestingModule } from '@nestjs/testing';
import { CampinfoService } from './campinfo.service';
import { ConfigModule } from '@nestjs/config';
import { HttpConfigModule } from '../config/http-config.module';
import { ResponseGetCampByKeywordList } from './dto/response/response-get-camp-by-keyword-list.dto';
import { NoSearchResultException } from './exceptions/no-search-result.exception';
import { NoExistCampException } from './exceptions/no-exist-camp.exception';

describe('CampinfoService', () => {
  let service: CampinfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpConfigModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: 'src/config/env/.dev.env',
        }),
      ],
      providers: [CampinfoService],
    }).compile();

    service = module.get<CampinfoService>(CampinfoService);
  });

  it('캠핑장 목록 조회 테스트', async () => {
    //given
    const pageNo = 1;
    const size = 4;
    //when
    const result = await service.getCampListLatest(pageNo, size);
    //then
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('캠핑장 상세 조회 테스트', async () => {
    //given
    const mapX = '127.2636514';
    const mapY = '37.0323408';
    //when
    const result = await service.getCampDetail(mapX, mapY);
    //then
    expect(result).not.toBeNull();
    expect(result.facltNm).toBeDefined();
  });

  it('캠핑장 상세 없는 게시물 조회 테스트', async () => {
    //given
    const mapX = '127.263651312312123412312312312331223';
    const mapY = '37.0323408213123123123123';
    //when & then
    await expect(service.getCampDetail(mapX, mapY)).rejects.toThrow(
      NoExistCampException,
    );
  });

  it('캠핑장 키워드 검색 목록 조회 테스트', async () => {
    //given
    const pageNo = 1;
    const size = 4;
    const keyword = '야영장';
    //when & then
    const result: ResponseGetCampByKeywordList[] = (
      await service.getCampByKeyword(keyword, pageNo, size)
    ).items;
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].facltNm).toContain('야영장');
  });

  it('캠핑장 키워드 검색 없는 목록 조회 테스트', async () => {
    //given
    const pageNo = 1;
    const size = 4;
    const keyword = '헬스';
    //when & then
    await expect(
      service.getCampByKeyword(keyword, pageNo, size),
    ).rejects.toThrow(NoSearchResultException);
  });
});
