import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

export class RequestAddReviewDto {
  @ApiProperty()
  @IsString()
  mapX: string;

  @ApiProperty()
  @IsString()
  mapY: string;

  @ApiProperty()
  @IsNotEmpty({ message: '리뷰 내용을 입력해 주세요.' })
  @IsString()
  @MaxLength(500)
  reviewContent: string;

  @ApiProperty({ example: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.5, { message: '별점은 0.5 이상이어야 합니다.' })
  @Max(5.0, { message: '별점은 5.0 이하여야 합니다.' })
  reviewScore: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewImage?: string;

  @ApiHideProperty()
  email?: string;
}
