import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../auth/entities/member.entity';
import { Board } from '../board/entities/board.entity';
import { Comment } from '../board/entities/comment.entity';
import { BoardLike } from '../board/entities/board-like.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

export const TestTypeOrmModule = () =>
  TypeOrmModule.forRoot({
    type: 'sqlite',
    database: ':memory:',
    entities: [Member, Board, Comment, BoardLike, RefreshToken],
    synchronize: true,
    dropSchema: true,
    logging: false,
  });
