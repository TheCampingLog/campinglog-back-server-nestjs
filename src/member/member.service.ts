import { Injectable } from '@nestjs/common';
import { Member, MemberGrade } from '../auth/entities/member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { MemberLikeSummary } from './interfaces/member.interface';

@Injectable()
export class MemberService {
  logger = new Logger('MemberService');
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
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
}
