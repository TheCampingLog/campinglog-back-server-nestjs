import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RequestAddMemeberDto } from 'src/auth/dto/request/request-add-member.dto';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
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
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/members (POST) success', () => {
    //given
    const testUser: RequestAddMemeberDto = {
      email: 'test@example.com',
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
    const testUser: RequestAddMemeberDto = {
      email: 'test@example.com',
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
    const testUser: RequestAddMemeberDto = {
      email: 'test@example.com',
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
      email: 'test@example.com',
      password: 'test1234',
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
      email: 'test@example.com',
      password: 'test1234',
    };

    await request(app.getHttpServer())
      .post('/login')
      .send(invalidMember)
      .expect(401);
  });

  it('/api/members/refresh (GET) ok', async () => {
    const testUser: RequestAddMemeberDto = {
      email: 'test@example.com',
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
      email: 'test@example.com',
      password: 'test1234',
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
});
