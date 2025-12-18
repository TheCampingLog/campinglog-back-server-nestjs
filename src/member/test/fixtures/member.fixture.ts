import * as bcrypt from 'bcrypt';
import { Member } from 'src/auth/entities/member.entity';
import { RequestAddBoardDto } from 'src/board/dto/request/request-add-board.dto';

export const createTestMember = async (email?: string): Promise<Member> => {
  const hashedPassword = await bcrypt.hash('test1234', 10);

  return {
    email: email ?? 'test@example.com',
    password: hashedPassword,
    name: 'choi',
    nickname: 'testnickname',
    birthday: new Date(2002, 8, 20),
    phoneNumber: '010-1234-1234',
  };
};

export const createInvalidTestMember = async (): Promise<Member> => {
  const hashedPassword = await bcrypt.hash('test1234', 10);

  return {
    email: 'invalid@example.com',
    password: hashedPassword,
    name: 'choi',
    nickname: 'testnickname',
    birthday: new Date(2002, 8, 20),
    phoneNumber: '010-1234-1234',
  };
};

export const createTestBoardDto = (email: string): RequestAddBoardDto => {
  const dto: RequestAddBoardDto = {
    title: '제목 테스트',
    content: '내용 테스트',
    categoryName: 'FREE',
    boardImage: 'default',
    email: email,
  };
  return dto;
};
