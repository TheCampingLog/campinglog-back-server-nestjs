import * as bcrypt from 'bcrypt';
import { Member } from 'src/auth/entities/member.entity';

export const createTestMember = async (): Promise<Member> => {
  const hashedPassword = await bcrypt.hash('test1234', 10);

  return {
    email: 'test@example.com',
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
