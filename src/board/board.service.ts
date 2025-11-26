import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestAddBoardDto } from './dto/request-add-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository } from 'typeorm';
import { Member } from '../auth/entities/member.entity';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  private async getMemberOrThrow(email: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { email },
    });

    if (!member) {
      throw new NotFoundException(`회원을 찾을 수 없습니다. email=${email}`);
    }

    return member;
  }
  async addBoard(dto: RequestAddBoardDto): Promise<Board> {
    const member = await this.getMemberOrThrow(dto.email);

    const board = this.boardRepository.create({
      title: dto.title,
      content: dto.content,
      categoryName: dto.categoryName,
      boardImage: dto.boardImage,
      member,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
    });

    return this.boardRepository.save(board);
  }
}
