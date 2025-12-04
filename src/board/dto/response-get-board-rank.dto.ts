export class ResponseGetBoardRankDto {
  boardId: string;
  boardImage: string | null;
  title: string;
  nickname: string;
  rank: number;
  viewCount: number;
}
