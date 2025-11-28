import { Test, TestingModule } from '@nestjs/testing';
import { CampinfoService } from './campinfo.service';
import { ConfigModule } from '@nestjs/config';
import { HttpConfigModule } from '../config/http-config.module';

// interface ApiParamters {
//   serviceKey: string;
//   MobileOS: string;
//   MobileApp: string;
//   _type: string;
//   pageNo: number;
//   numOfRows: number;
// }

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
    // const pageNo = 1;
    // const size = 4;
    //when
    const result = await service.getCampListLatest(1, 4);
    //then
    expect(result.items.length).toBeGreaterThan(0);
  });
});
