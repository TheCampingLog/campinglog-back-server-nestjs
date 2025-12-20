import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export class RequestSetReview {
  @IsNumber()
  id: number;

  @IsString()
  mapX: string;

  @IsString()
  mapY: string;

  @IsNotEmpty({ message: '내용을 수정해 주세요.' })
  @IsString()
  @MaxLength(500)
  newReviewContent: string;

  @IsNumber()
  @Min(0.5, { message: '별점은 0.5 이상이어야 합니다.' })
  @Max(5.0, { message: '별점은 5.0 이하여야 합니다.' })
  newReviewScore: number;

  @IsOptional()
  @IsString()
  newReviewImage?: string;
}
