export class ResponseGetBoardDetailDto {
  boardId: string;
  boardImage: string;
  title: string;
  content: string;
  categoryName: string;
  nickName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  email: string;
  isLiked: boolean;
}
