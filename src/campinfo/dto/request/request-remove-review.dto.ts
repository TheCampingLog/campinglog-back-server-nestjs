import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class RequestRemoveReviewDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
