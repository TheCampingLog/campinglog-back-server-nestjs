export interface MemberLikeSummary {
  memberId: string;
  totalLike: number;
}

export interface WeeklyLikeAggRow {
  email: string;
  nickname: string;
  profileImage: string;
  totalLikes: number;
  memberGrade: string;
}

export interface RankResult {
  rank: number;
  email: string;
  nickname: string;
  profileImage: string;
  totalLikes: number;
  memberGrade: string;
}
