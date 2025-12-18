import { ResponseGetReviewList } from './response-get-review-list.dto';

export class ResponseGetReviewListWrapper {
  items: ResponseGetReviewList[];

  page: number;

  size: number;

  hasNext: boolean;

  totalElement: number;

  totalPages: number;
}
