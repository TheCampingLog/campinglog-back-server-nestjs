import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestSetReview {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNotEmpty({ message: '내용을 수정해 주세요.' })
  @IsString()
  @MaxLength(500)
  newReviewContent: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0.5, { message: '별점은 0.5 이상이어야 합니다.' })
  @Max(5.0, { message: '별점은 5.0 이하여야 합니다.' })
  newReviewScore: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newReviewImage?: string;
}
