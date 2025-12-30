import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestSetBoardDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  boardId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: '제목은 필수입니다.' })
  @MinLength(1, { message: '제목은 1자 이상이어야 합니다.' })
  @MaxLength(200, { message: '제목은 200자 이하여야 합니다.' })
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: '내용은 필수입니다.' })
  @MinLength(1, { message: '내용은 1자 이상이어야 합니다.' })
  @MaxLength(5000, { message: '내용은 5000자 이하여야 합니다.' })
  content: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: '카테고리는 필수입니다.' })
  categoryName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  boardImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;
}
