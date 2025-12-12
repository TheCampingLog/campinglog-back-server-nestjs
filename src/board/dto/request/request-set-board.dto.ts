import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RequestSetBoardDto {
  @IsString()
  @IsOptional()
  boardId?: string;

  @IsString()
  @IsNotEmpty({ message: '제목은 필수입니다.' })
  @MinLength(1, { message: '제목은 1자 이상이어야 합니다.' })
  @MaxLength(200, { message: '제목은 200자 이하여야 합니다.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '내용은 필수입니다.' })
  @MinLength(1, { message: '내용은 1자 이상이어야 합니다.' })
  @MaxLength(5000, { message: '내용은 5000자 이하여야 합니다.' })
  content: string;

  @IsString()
  @IsNotEmpty({ message: '카테고리는 필수입니다.' })
  categoryName: string;

  @IsString()
  @IsOptional()
  boardImage?: string;

  @IsString()
  @IsOptional()
  email?: string;
}
