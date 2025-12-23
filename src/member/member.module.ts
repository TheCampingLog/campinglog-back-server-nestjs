import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../auth/entities/member.entity';
import { Board } from 'src/board/entities/board.entity';
import { BoardLike } from 'src/board/entities/board-like.entity';
import { Comment } from 'src/board/entities/comment.entity';
import { Review } from 'src/campinfo/entities/review.entity';
import { CampinfoModule } from 'src/campinfo/campinfo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, Board, BoardLike, Comment, Review]),
    CampinfoModule,
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
