export class ResponseGetCampWrapper<T> {
  items: T[];
  page: number;
  size: number;
  totalCount: number;
  totalPage: number;
  hasNext: boolean;
}
