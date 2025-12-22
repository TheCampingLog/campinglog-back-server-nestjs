export class ResponseGetMyReviewList {
  reviewContent: string; // review
  reviewScore: number; // review
  facltNm: string | null; // 외부 API
  firstImageUrl: string | null; // 외부 API
  mapX: string;
  mapY: string;
  createAt: Date;
  id: number;
}
