import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestAddBoardDto } from './dto/request-add-board.dto';
import { RequestSetBoardDto } from './dto/request-set-board.dto';
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
  private async getBoardOrThrow(boardId: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { boardId },
      relations: ['member'],
    });

    if (!board) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
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
    if (!dto.boardId || dto.boardId.trim() === '') {
      throw new NotFoundException('boardId는 필수입니다.');
    }
    const board = await this.getBoardOrThrow(dto.boardId);

    if (dto.email && board.member.email !== dto.email) {
      throw new NotFoundException('본인의 게시글만 수정할 수 있습니다.');
    }

    if (dto.title !== null && dto.title !== undefined) {
      board.title = dto.title;
    }
    if (dto.content !== null && dto.content !== undefined) {
      board.content = dto.content;
    }
    if (dto.categoryName !== null && dto.categoryName !== undefined) {
      board.categoryName = dto.categoryName;
    }
    if (dto.boardImage !== null && dto.boardImage !== undefined) {
      board.boardImage = dto.boardImage;
    }

    await this.boardRepository.save(board);
  }
}
