import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../auth/entities/member.entity';
import { Board } from './entities/board.entity';
import { BoardLike } from './entities/board-like.entity';
import { Comment } from './entities/comment.entity';
import { Review } from 'src/campinfo/entities/review.entity';
import { ReviewOfBoard } from 'src/campinfo/entities/review-of-board.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      Board,
      BoardLike,
      Comment,
      Review,
      ReviewOfBoard,
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardService],
})
export class BoardModule {}
