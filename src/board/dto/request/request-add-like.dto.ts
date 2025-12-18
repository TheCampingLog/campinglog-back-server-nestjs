import { IsEmail, IsOptional } from 'class-validator';

export class RequestAddLikeDto {
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;
}
