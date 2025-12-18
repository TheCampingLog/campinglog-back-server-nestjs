import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Member } from 'src/auth/entities/member.entity';
import { Board } from 'src/board/entities/board.entity';
import { BoardLike } from 'src/board/entities/board-like.entity';
import cookieParser from 'cookie-parser';
import { Comment } from 'src/board/entities/comment.entity';

describe('MemberController (e2e)', () => {
  let app: INestApplication<App>;
  let memberRepository: Repository<Member>;
  let boardRepository: Repository<Board>;
  let boardLikeRepository: Repository<BoardLike>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    memberRepository = moduleFixture.get('MemberRepository');
    boardRepository = moduleFixture.get('BoardRepository');
    boardLikeRepository = moduleFixture.get('BoardLikeRepository');
  });

  afterEach(async () => {
    await memberRepository.clear();
    await boardRepository.clear();
    await boardLikeRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  // 회원승급
  it('/api/members/grade (PUT) success', async () => {
    interface UpdateGradeResponse {
      changed: number;
    }

    //when & then
    const response = await request(app.getHttpServer())
      .put('/api/members/grade')
      .expect(200);

    const result = response.body as UpdateGradeResponse;

    expect(result.changed).toBe(0);
  });
});
