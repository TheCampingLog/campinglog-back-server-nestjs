import { Module } from '@nestjs/common';
import { CampinfoService } from './campinfo.service';
import { CampinfoController } from './campinfo.controller';
import { HttpConfigModule } from '../config/http-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewOfBoard } from './entities/review-of-board.entity';

@Module({
  imports: [HttpConfigModule, TypeOrmModule.forFeature([ReviewOfBoard])],
  controllers: [CampinfoController],
  providers: [CampinfoService],
})
export class CampinfoModule {}
