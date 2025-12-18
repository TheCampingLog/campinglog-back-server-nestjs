import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RequestAddMemberDto } from 'src/auth/dto/request/request-add-member.dto';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { Member } from 'src/auth/entities/member.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let memberRepository: Repository<Member>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await memberRepository.clear();
  });

  it('/api/members (POST) success', () => {
    //given
    const testUser: RequestAddMemberDto = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
      password: 'test1234',
      name: 'choi',
      nickname: 'test',
      birthday: '2000-06-21',
      phoneNumber: '010-1234-1234',
    };

    request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201)
      .expect({ message: 'success' });
  });

  it('/api/members (POST) validation fail', () => {
    //given
    const invalidName = 'choi'.repeat(30);
    const testUser: RequestAddMemberDto = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
      password: 'test1234',
      name: invalidName,
      nickname: 'test',
      birthday: '2000-06-12',
      phoneNumber: '010-1234-1234',
    };

    request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(400);
  });

  it('/login (POST) login success', async () => {
    const testUser: RequestAddMemberDto = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
      password: 'test1234',
      name: 'tester',
      nickname: 'nick',
      birthday: '2000-06-21',
      phoneNumber: '010-1234-5678',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    //given
    const validMember = {
      email: testUser.email,
      password: testUser.password,
    };
    //when && then
    const response = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    expect(response.headers['set-cookie']).toBeTruthy();
    expect(response.headers['authorization']).toBeTruthy();
  });

  it('/login (POST) login fail', async () => {
    //given
    const invalidMember = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
      password: 'test1234',
    };

    await request(app.getHttpServer())
      .post('/login')
      .send(invalidMember)
      .expect(401);
  });

  it('/api/members/refresh (GET) ok', async () => {
    const testUser: RequestAddMemberDto = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
      password: 'test1234',
      name: 'tester',
      nickname: 'nick',
      birthday: '2000-06-21',
      phoneNumber: '010-1234-5678',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    const validMember = {
      email: testUser.email,
      password: testUser.password,
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    //given
    const cookies = loginResponse.headers['set-cookie'];
    expect(cookies).toBeTruthy();
    expect(loginResponse.headers['authorization']).toBeTruthy();

    //when
    const refreshResponse = await request(app.getHttpServer())
      .get('/api/members/refresh')
      .set('Cookie', cookies)
      .expect(200);
    //then
    expect(refreshResponse.headers['authorization']).toBeTruthy();
  });

  // 회원 탈퇴
  it('/api/members (DELETE) success', async () => {
    const testUser: RequestAddMemberDto = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
      password: 'test1234',
      name: 'tester',
      nickname: 'nick',
      birthday: '2000-06-21',
      phoneNumber: '010-1234-5678',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    const validMember = {
      email: testUser.email,
      password: testUser.password,
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    //given
    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when & then
    await request(app.getHttpServer())
      .delete('/api/members')
      .set('authorization', accessToken)
      .expect(204);
  });

  // 회원 탈퇴
  it('/api/members (DELETE) fail', async () => {
    const testUser: RequestAddMemberDto = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
      password: 'test1234',
      name: 'tester',
      nickname: 'nick',
      birthday: '2000-06-21',
      phoneNumber: '010-1234-5678',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    const validMember = {
      email: testUser.email,
      password: testUser.password,
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    //given
    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    await request(app.getHttpServer())
      .delete('/api/members')
      .set('authorization', accessToken)
      .expect(204);

    //when & then
    await request(app.getHttpServer())
      .delete('/api/members')
      .set('authorization', accessToken)
      .expect(404);
  });
});
