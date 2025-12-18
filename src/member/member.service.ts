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

@Injectable()
export class MemberService {
  logger = new Logger('MemberService');
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
}
