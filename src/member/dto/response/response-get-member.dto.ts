// 마이 페이지 조회
export interface ResponseGetMemberDto {
  email: string;
  name: string;
  nickname: string;
  birthday: Date;
  phoneNumber: string;
  profileImage: string;
  role: string;
  memberGrade: string;
  joinDate: Date;
}
