import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestAddCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  boardId?: string;
  email?: string;
}
