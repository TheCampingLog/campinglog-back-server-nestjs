export class ResponseToggleLikeDto {
  isLiked: boolean;
  likeCount: number;

  constructor(isLiked: boolean, likeCount: number) {
    this.isLiked = isLiked;
    this.likeCount = likeCount;
  }
}
