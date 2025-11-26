import { Test, TestingModule } from '@nestjs/testing';
import { CampinfoController } from './campinfo.controller';
import { CampinfoService } from './campinfo.service';

describe('CampinfoController', () => {
  let controller: CampinfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampinfoController],
      providers: [CampinfoService],
    }).compile();

    controller = module.get<CampinfoController>(CampinfoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
