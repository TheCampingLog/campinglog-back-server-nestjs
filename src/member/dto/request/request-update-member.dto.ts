import { IsString, Length, Matches } from 'class-validator';

//마이 페이지 정보 수정
export class RequestUpdateMemberDto {
  @IsString()
  @Length(3, 16, { message: '닉네임은 3~16자여야 합니다' })
  nickname: string;

  @IsString()
  @Matches(/^[0-9\\-]{9,15}$/, { message: '전화번호 형식이 올바르지 않습니다' })
  phoneNumber: string;
}
