import { Injectable } from '@nestjs/common';
import { Member, MemberGrade } from '../auth/entities/member.entity';
import { Board } from 'src/board/entities/board.entity';
import { BoardLike } from 'src/board/entities/board-like.entity';
import { Comment } from 'src/board/entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import {
  MemberLikeSummary,
  RankResult,
  WeeklyLikeAggRow,
} from './interfaces/member.interface';
import { ResponseGetMemberDto } from './dto/response/response-get-member.dto';
import { MemberNotFoundException } from './exceptions/member-not-found.exception';
import { DuplicatePhoneNumberException } from './exceptions/duplicate-phone-number.exception';
import { DuplicateNicknameException } from './exceptions/duplicate-nickname.exception';
import { RequestUpdateMemberDto } from './dto/request/request-update-member.dto';
import { ResponseGetMemberBoardDto } from './dto/response/response-get-member-board.dto';
import { ResponseGetMemberBoardListDto } from './dto/response/response-get-member-board-list.dto';
import { ResponseGetMemberCommentDto } from './dto/response/response-get-member-comment.dto';
import { ResponseGetMemberCommentListDto } from './dto/response/response-get-member-comment-list.dto';
import { ResponseGetMemberProfileImageDto } from './dto/response/response-get-member-profile-image.dto';
import { RequestSetProfileImageDto } from './dto/request/request-set-profile-image.dto';
import { ProfileImageNotFoundException } from './exceptions/profile-image-not-found.exception';
import { ReqeustVerifyPasswordDto } from './dto/request/request-verify-password.dto';
import { RequestChangePasswordDto } from './dto/request/request-change-password.dto';
import * as bcrypt from 'bcrypt';
import { InvalidPasswordException } from './exceptions/invalid-password.exception';
import { PasswordMissMatchException } from './exceptions/password-miss-match.exception';

@Injectable()
export class MemberService {
  logger = new Logger('MemberService');
  private readonly PAGE_SIZE = 4;

  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardLike)
    private readonly boardLikeRepository: Repository<BoardLike>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async getMemberByEmail(email: string): Promise<Member | null> {
    return await this.memberRepository.findOneBy({ email });
  }

  async updateGradeWeekly(): Promise<number> {
    // 회원들의 게시판들의 좋아요 수를 합치고
    // 회원의 이메일과 좋아요 수의 객체들을 반환하는 함수
    const rows = await this.sumLikesGroupByMember();

    if (rows.length === 0) {
      this.logger.log('No boards found. No grade changes.');
      return 0;
    }

    const totals: MemberLikeSummary[] = rows.map((p) => ({
      memberId: p.memberId,
      totalLike: p.totalLike ?? 0,
    }));

    const memberIds = totals.map((t) => t.memberId);
    const members = await this.memberRepository.findBy({
      email: In(memberIds),
    });

    const memberMap = new Map<string, Member>(members.map((m) => [m.email, m]));

    const changedMembers: Member[] = [];
    for (const t of totals) {
      const m = memberMap.get(t.memberId);
      if (!m) continue;

      const newGrade = this.decideByLikes(t.totalLike);
      if (m.memberGrade !== newGrade) {
        m.memberGrade = newGrade;
        changedMembers.push(m);
      }
    }

    if (changedMembers.length > 0) {
      await this.memberRepository.save(changedMembers);
    }
    this.logger.log(
      `Weekly promotion executed. changed=${changedMembers.length}`,
    );
    return changedMembers.length;
  }

  //회원 승급
  private decideByLikes(totalLikes: number): MemberGrade {
    if (totalLikes >= 100) return MemberGrade.BLACK;
    if (totalLikes >= 50) return MemberGrade.RED;
    if (totalLikes >= 20) return MemberGrade.BLUE;
    return MemberGrade.GREEN;
  }

  //회원 승급
  private async sumLikesGroupByMember(): Promise<MemberLikeSummary[]> {
    const result = await this.memberRepository
      .createQueryBuilder('m')
      .leftJoin('m.boards', 'b')
      .select('m.email', 'memberId')
      .addSelect('COALESCE(SUM(b.likeCount), 0)', 'totalLike')
      .groupBy('m.email')
      .getRawMany<{ memberId: string; totalLike: string }>();

    return result.map((r) => ({
      memberId: r.memberId,
      totalLike: Number(r.totalLike),
    }));
  }

  //회원 랭킹 조회
  async findTopMembersByLikeCreatedAt(
    start: Date,
    end: Date,
  ): Promise<WeeklyLikeAggRow[]> {
    const results = await this.boardLikeRepository
      .createQueryBuilder('l')
      .innerJoin('l.board', 'b')
      .innerJoin('b.member', 'm')
      .select('m.email', 'email')
      .addSelect('m.nickname', 'nickname')
      .addSelect('m.profileImage', 'profileImage')
      .addSelect('m.memberGrade', 'memberGrade')
      .addSelect('COUNT(l.id)', 'totalLikes')
      .where('l.createdAt >= :start', { start })
      .andWhere('l.createdAt < :end', { end })
      .groupBy('m.email')
      .addGroupBy('m.nickname')
      .addGroupBy('m.profileImage')
      .addGroupBy('m.memberGrade')
      .orderBy('COUNT(l.id)', 'DESC')
      .getRawMany<{
        email: string;
        nickname: string;
        profileImage: string;
        memberGrade: string;
        totalLikes: string;
      }>();

    return results.map((r) => ({
      email: r.email,
      nickname: r.nickname,
      profileImage: r.profileImage,
      memberGrade: r.memberGrade,
      totalLikes: Number(r.totalLikes),
    }));
  }

  //회원 랭킹 조회
  async updateRankWeekly(memberNo: number): Promise<RankResult[]> {
    const today = new Date();
    const thisThursday = this.getThisThursday(today);
    const nextThursday = new Date(thisThursday);
    nextThursday.setDate(nextThursday.getDate() + 7);

    const rows = await this.findTopMembersByLikeCreatedAt(
      thisThursday,
      nextThursday,
    );

    return rows.slice(0, memberNo).map((r, i) => ({
      rank: i + 1,
      email: r.email,
      nickname: r.nickname,
      profileImage: r.profileImage,
      totalLikes: r.totalLikes,
      memberGrade: r.memberGrade,
    }));
  }

  //회원 랭킹 조회
  private getThisThursday(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const thursday = 4;

    const diff = day >= thursday ? day - thursday : day + 7 - thursday;
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);

    return result;
  }

  // 마이페이지 조회
  async getMember(email: string): Promise<ResponseGetMemberDto> {
    const member = await this.memberRepository.findOneBy({ email });

    if (!member) {
      throw new MemberNotFoundException(email);
    }

    const responseGetMember: ResponseGetMemberDto = {
      email: member.email,
      name: member.name,
      nickname: member.nickname,
      birthday: member.birthday,
      phoneNumber: member.phoneNumber,
      profileImage: member.profileImage as string,
      role: member.role as string,
      memberGrade: member.memberGrade as string,
      joinDate: member.joinDate as Date,
    };

    return responseGetMember;
  }

  // 마이 페이지 정보 수정
  async setMember(email: string, requestUpdateMember: RequestUpdateMemberDto) {
    const member = await this.memberRepository.findOneBy({ email });

    if (!member) {
      throw new MemberNotFoundException(email);
    }

    //닉네임 변경 시 중복 체크
    if (
      requestUpdateMember.nickname !== null &&
      !(requestUpdateMember.nickname === member.nickname)
    ) {
      const isExistNickname = await this.memberRepository.existsBy({
        nickname: requestUpdateMember.nickname,
      });

      if (isExistNickname) {
        throw new DuplicateNicknameException();
      }
      member.nickname = requestUpdateMember.nickname;
    }

    //전화번호 변경 시 중복 체크
    if (
      requestUpdateMember.phoneNumber !== null &&
      !(requestUpdateMember.phoneNumber === member.phoneNumber)
    ) {
      const isExistPhoneNumber = await this.memberRepository.existsBy({
        phoneNumber: requestUpdateMember.phoneNumber,
      });

      if (isExistPhoneNumber) {
        throw new DuplicatePhoneNumberException();
      }
      member.phoneNumber = requestUpdateMember.phoneNumber;
    }

    await this.memberRepository.save(member);
  }

  // 내가 쓴 글 조회
  async getBoards(
    email: string,
    pageNo: number,
  ): Promise<ResponseGetMemberBoardListDto> {
    const isExist = await this.memberRepository.existsBy({ email });

    if (!isExist) {
      throw new MemberNotFoundException(email);
    }

    const pageIndex = Math.max(pageNo - 1, 0); // 1-based → 0-based

    const [items, totalElements] = await this.boardRepository.findAndCount({
      where: { member: { email } },
      order: { createdAt: 'DESC' },
      take: this.PAGE_SIZE,
      skip: pageIndex * this.PAGE_SIZE,
    });

    const totalPages = Math.ceil(totalElements / this.PAGE_SIZE);
    const isFirst = pageIndex === 0;
    const isLast = pageNo >= totalPages;

    // DTO 변환
    const boards = items.map((board) =>
      this.mapToResponseGetMemberBoardDto(board),
    );

    return {
      items: boards,
      page: pageNo,
      size: this.PAGE_SIZE,
      totalElements,
      totalPages,
      first: isFirst,
      last: isLast,
    };
  }

  //내가 쓴 글 조회
  private mapToResponseGetMemberBoardDto(
    board: Board,
  ): ResponseGetMemberBoardDto {
    return {
      boardId: board.boardId,
      title: board.title,
      content: board.content,
      boardImage: board.boardImage ?? 'default.png',
      createdAt: board.createdAt,
    };
  }

  // 내가 작성한 댓글 리스트 조회
  async getComments(
    email: string,
    pageNo: number,
  ): Promise<ResponseGetMemberCommentListDto> {
    const isExist = await this.memberRepository.existsBy({ email });

    if (!isExist) {
      throw new MemberNotFoundException(email);
    }

    const pageIndex = Math.max(pageNo - 1, 0); // 1-based → 0-based

    const [items, totalElements] = await this.commentRepository.findAndCount({
      where: { member: { email } },
      relations: ['member', 'board'],
      order: { createdAt: 'DESC' },
      take: this.PAGE_SIZE,
      skip: pageIndex * this.PAGE_SIZE,
    });

    const totalPages = Math.ceil(totalElements / this.PAGE_SIZE);
    const isFirst = pageIndex === 0;
    const isLast = pageNo >= totalPages;

    // DTO 변환
    const comments = items.map((comment) =>
      this.mapToResponseMemberCommentDto(comment),
    );

    return {
      items: comments,
      page: pageNo,
      size: this.PAGE_SIZE,
      totalElements,
      totalPages,
      first: isFirst,
      last: isLast,
    };
  }

  //내가 작성한 댓글 리스트 조회
  private mapToResponseMemberCommentDto(
    comment: Comment,
  ): ResponseGetMemberCommentDto {
    return {
      commentId: comment.commentId,
      content: comment.content,
      nickname: comment.member.nickname,
      createdAt: comment.createdAt,
      boardId: comment.board.boardId,
    };
  }

  //프로필 사진 조회
  async getProfileImage(
    email: string,
  ): Promise<ResponseGetMemberProfileImageDto> {
    const member = await this.memberRepository.findOneBy({ email });

    if (!member) {
      throw new MemberNotFoundException(email);
    }

    if (!member.profileImage) {
      member.profileImage = '/images/member/profile/default.png';
    }

    return {
      profileImage: member.profileImage,
    };
  }

  //프로필 사진 등록
  async addProfileImage(
    email: string,
    request: RequestSetProfileImageDto,
  ): Promise<void> {
    const member = await this.memberRepository.findOneBy({ email });

    if (!member) {
      throw new MemberNotFoundException(email);
    }

    member.profileImage = request.profileImage;

    await this.memberRepository.save(member);
  }

  //프로필 사진 수정
  async setProfileImage(
    email: string,
    request: RequestSetProfileImageDto,
  ): Promise<void> {
    const member = await this.memberRepository.findOneBy({ email });

    if (!member) {
      throw new MemberNotFoundException(email);
    }

    member.profileImage = request.profileImage;

    await this.memberRepository.save(member);
  }

  //프로필 사진 삭제
  async deleteProfileImage(email: string): Promise<void> {
    const member = await this.memberRepository.findOneBy({ email });

    if (!member) {
      throw new MemberNotFoundException(email);
    }

    if (!member.profileImage) {
      throw new ProfileImageNotFoundException(email);
    }

    member.profileImage = null;

    await this.memberRepository.save(member);
  }

  // 마이페이지 수정 전 비밀번호 확인
  async verifyPassword(email: string, request: ReqeustVerifyPasswordDto) {
    const member = await this.memberRepository.findOneBy({ email });

    if (!member) {
      throw new MemberNotFoundException(email);
    }

    const isPasswordValid = await bcrypt.compare(
      request.password,
      member.password,
    );

    if (!isPasswordValid) {
      throw new PasswordMissMatchException();
    }
  }

  // 비밀번호 수정
  async setPassword(email: string, request: RequestChangePasswordDto) {
    const member = await this.memberRepository.findOneBy({ email });

    if (!member) {
      throw new MemberNotFoundException(email);
    }

    const isPasswordValid = await bcrypt.compare(
      request.currentPassword,
      member.password,
    );

    if (!isPasswordValid) {
      throw new PasswordMissMatchException();
    }

    const isSame = await bcrypt.compare(request.newPassword, member.password);

    if (isSame) {
      throw new InvalidPasswordException();
    }
    member.password = await bcrypt.hash(request.newPassword, 10);

    await this.memberRepository.save(member);
  }
}
