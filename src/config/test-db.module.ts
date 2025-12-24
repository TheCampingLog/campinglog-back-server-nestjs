import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../auth/entities/member.entity';
import { Board } from '../board/entities/board.entity';
import { Comment } from '../board/entities/comment.entity';
import { BoardLike } from '../board/entities/board-like.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Review } from 'src/campinfo/entities/review.entity';
import { ReviewOfBoard } from 'src/campinfo/entities/review-of-board.entity';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

export const TestTypeOrmModule = () =>
  TypeOrmModule.forRootAsync({
    useFactory: () => ({
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
    }),
    dataSourceFactory(options) {
      if (!options) {
        throw new Error('Invalid options passed');
      }

      return Promise.resolve(
        addTransactionalDataSource(new DataSource(options)),
      );
    },
  });
