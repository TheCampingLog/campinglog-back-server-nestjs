import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestAddBoardDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  categoryName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  boardImage?: string;

  @Exclude()
  email?: string;
}
