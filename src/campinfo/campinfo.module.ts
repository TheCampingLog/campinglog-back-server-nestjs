import { Module } from '@nestjs/common';
import { CampinfoService } from './campinfo.service';
import { CampinfoController } from './campinfo.controller';
import { HttpConfigModule } from '../config/http-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReviewOfBoard } from './entities/review-of-board.entity';
import { Member } from 'src/auth/entities/member.entity';
@Module({
  imports: [
    HttpConfigModule,
    TypeOrmModule.forFeature([ReviewOfBoard, Review, Member]),
  ],
  controllers: [CampinfoController],
  providers: [CampinfoService],
  exports: [CampinfoService],
})
export class CampinfoModule {}
