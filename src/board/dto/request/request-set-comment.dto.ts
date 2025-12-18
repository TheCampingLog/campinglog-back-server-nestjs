import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class RequestSetCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  boardId?: string;

  @IsOptional()
  @IsString()
  commentId?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
