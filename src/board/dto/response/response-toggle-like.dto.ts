import { ApiProperty } from '@nestjs/swagger';

export class ResponseToggleLikeDto {
  @ApiProperty()
  isLiked: boolean;

  @ApiProperty()
  likeCount: number;

  constructor(isLiked: boolean, likeCount: number) {
    this.isLiked = isLiked;
    this.likeCount = likeCount;
  }
}
