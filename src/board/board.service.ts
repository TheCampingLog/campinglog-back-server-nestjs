import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestAddBoardDto } from './dto/request-add-board.dto';
import { RequestSetBoardDto } from './dto/request-set-board.dto';
import { ResponseGetBoardRankDto } from './dto/response-get-board-rank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository, MoreThan } from 'typeorm';
import { Member } from '../auth/entities/member.entity';
import { BoardNotFoundException } from './exceptions/board-not-found.exception';
import { NotYourBoardException } from './exceptions/not-your-board.exception';
import { InvalidBoardRequestException } from './exceptions/invalid-board-request.exception';

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
  private async getBoardOrThrow(boardId: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { boardId },
      relations: ['member'],
    });

    if (!board) {
      throw new BoardNotFoundException('게시글을 찾을 수 없습니다.');
    }

    return board;
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
  async setBoard(dto: RequestSetBoardDto): Promise<void> {
    const board = await this.getBoardOrThrow(dto.boardId!);

    if (dto.email && board.member.email !== dto.email) {
      throw new NotYourBoardException('본인의 게시글만 수정할 수 있습니다.');
    }

    board.title = dto.title;
    board.content = dto.content;
    board.categoryName = dto.categoryName;

    if (dto.boardImage !== undefined) {
      board.boardImage = dto.boardImage;
    }

    await this.boardRepository.save(board);
  }

  async getBoardRank(limit: number): Promise<ResponseGetBoardRankDto[]> {
    if (limit < 1) {
      throw new InvalidBoardRequestException('limit는 1 이상이어야 합니다.');
    }

    // 1주일 전 날짜 계산
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const boards = await this.boardRepository.find({
      where: {
        createdAt: MoreThan(weekAgo),
      },
      relations: ['member'],
      order: {
        rank: 'DESC',
        viewCount: 'DESC',
      },
      take: limit,
    });

    return boards.map((board) => ({
      boardId: board.boardId,
      boardImage: board.boardImage ?? null,
      title: board.title,
      nickname: board.member.nickname,
      rank: board.rank,
      viewCount: board.viewCount,
    }));
  }
}
