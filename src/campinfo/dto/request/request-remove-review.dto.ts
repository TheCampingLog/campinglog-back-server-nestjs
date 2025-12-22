import { IsNotEmpty, IsNumber } from 'class-validator';

export class RequestRemoveReviewDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
