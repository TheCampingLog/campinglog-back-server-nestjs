import { ResponseGetMyReviewList } from './response-get-my-review-list.dto';

export class ResponseGetMyReviewWrapper {
  content: ResponseGetMyReviewList[];
  page: number;
  size: number;
  totalElements: number;
  totalPage: number;
  hasNext: boolean;
}
