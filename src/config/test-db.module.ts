import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../auth/entities/member.entity';
import { Board } from '../board/entities/board.entity';
import { Comment } from '../board/entities/comment.entity';
import { BoardLike } from '../board/entities/board-like.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Review } from 'src/campinfo/entities/review.entity';
import { ReviewOfBoard } from 'src/campinfo/entities/review-of-board.entity';

export const TestTypeOrmModule = () =>
  TypeOrmModule.forRoot({
    type: 'sqlite',
    database: ':memory:',
    entities: [
      Member,
      Board,
      Comment,
      BoardLike,
      RefreshToken,
      Review,
      ReviewOfBoard,
    ],
    synchronize: true,
    dropSchema: true,
    logging: false,
  });
