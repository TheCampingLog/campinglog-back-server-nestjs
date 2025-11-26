import { Module } from '@nestjs/common';
import { CampinfoService } from './campinfo.service';
import { CampinfoController } from './campinfo.controller';
import { HttpConfigModule } from 'src/config/http-config.module';

@Module({
  imports: [HttpConfigModule],
  controllers: [CampinfoController],
  providers: [CampinfoService]
})
export class CampinfoModule {}
