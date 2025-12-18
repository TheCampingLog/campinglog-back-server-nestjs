import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestAddBoardDto } from './dto/request/request-add-board.dto';
import { RequestSetBoardDto } from './dto/request/request-set-board.dto';
import { ResponseGetBoardRankDto } from './dto/response/response-get-board-rank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository, MoreThan } from 'typeorm';
import { Member } from '../auth/entities/member.entity';
import { BoardNotFoundException } from './exceptions/board-not-found.exception';
import { NotYourBoardException } from './exceptions/not-your-board.exception';
import { InvalidBoardRequestException } from './exceptions/invalid-board-request.exception';
import { ResponseGetBoardByKeywordWrapper } from './dto/response/response-get-board-by-keyword-wrapper.dto';
import { ILike } from 'typeorm';
import { ResponseGetBoardDetailDto } from './dto/response/response-get-board-detail.dto';
import { BoardLike } from './entities/board-like.entity';
import { ResponseGetBoardByCategoryWrapper } from './dto/response/response-get-board-by-category-wrapper.dto';
import { Comment } from './entities/comment.entity';
import { RequestAddCommentDto } from './dto/request/request-add-comment.dto';
import { CommentNotFoundException } from './exceptions/comment-not-found.exception';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(BoardLike)
    private readonly boardLikeRepository: Repository<BoardLike>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
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

  private async getCommentOrThrow(commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { commentId },
      relations: ['member', 'board'],
    });

    if (!comment) {
      throw new CommentNotFoundException('댓글을 찾을 수 없습니다.');
    }

    return comment;
  }

  async addBoard(dto: RequestAddBoardDto): Promise<Board> {
    const member = await this.getMemberOrThrow(dto.email as string);

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
  async deleteBoard(boardId: string): Promise<void> {
    const board = await this.getBoardOrThrow(boardId);
    await this.boardRepository.remove(board);
  }

  async searchBoards(
    keyword: string,
    category: string,
    page: number,
    size: number,
  ): Promise<ResponseGetBoardByKeywordWrapper> {
    if (page < 1 || size < 1) {
      throw new InvalidBoardRequestException('page>=1, size>=1 이어야 합니다.');
    }

    const skip = (page - 1) * size;

    const [boards, total] = await this.boardRepository.findAndCount({
      where: {
        categoryName: category.trim(),
        title: ILike(`%${keyword.trim()}%`),
      },
      relations: ['member'],
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: size,
    });

    const content = boards.map((board) => ({
      boardId: board.boardId,
      title: board.title,
      content: board.content,
      categoryName: board.categoryName,
      viewCount: board.viewCount,
      likeCount: board.likeCount,
      commentCount: board.commentCount,
      boardImage: board.boardImage ?? '',
      createdAt: board.createdAt.toISOString(),
      nickName: board.member.nickname,
      keyword: keyword,
    }));

    const totalPages = Math.ceil(total / size);

    return {
      content,
      totalPages,
      totalElements: total,
      pageNumber: page - 1,
      pageSize: size,
      isFirst: page === 1,
      isLast: page >= totalPages,
    };
  }

  async getBoardDetail(
    boardId: string,
    userEmail?: string,
  ): Promise<ResponseGetBoardDetailDto> {
    const board = await this.getBoardOrThrow(boardId);

    // 조회수 증가
    board.viewCount += 1;
    await this.boardRepository.save(board);

    // 좋아요 여부 확인
    let isLiked = false;
    if (userEmail && userEmail.trim() !== '') {
      isLiked = await this.boardLikeRepository.exists({
        where: {
          board: { id: board.id },
          member: { email: userEmail },
        },
      });
    }

    return {
      boardId: board.boardId,
      title: board.title,
      content: board.content,
      categoryName: board.categoryName,
      viewCount: board.viewCount,
      likeCount: board.likeCount,
      commentCount: board.commentCount,
      boardImage: board.boardImage ?? '',
      createdAt: board.createdAt.toISOString(),
      nickName: board.member.nickname,
      email: board.member.email,
      isLiked: isLiked,
    };
  }

  async getBoardsByCategory(
    category: string,
    page: number,
    size: number,
  ): Promise<ResponseGetBoardByCategoryWrapper> {
    if (page < 1 || size < 1) {
      throw new InvalidBoardRequestException('page>=1, size>=1 이어야 합니다.');
    }

    const skip = (page - 1) * size;

    const [boards, total] = await this.boardRepository.findAndCount({
      where: {
        categoryName: category.trim(),
      },
      relations: ['member'],
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: size,
    });

    const content = boards.map((board) => ({
      boardId: board.boardId,
      title: board.title,
      content: board.content,
      categoryName: board.categoryName,
      viewCount: board.viewCount,
      likeCount: board.likeCount,
      commentCount: board.commentCount,
      boardImage: board.boardImage ?? '',
      createdAt: board.createdAt.toISOString(),
      nickName: board.member.nickname,
    }));

    const totalPages = Math.ceil(total / size);

    return {
      content,
      totalPages,
      totalElements: total,
      pageNumber: page - 1,
      pageSize: size,
      isFirst: page === 1,
      isLast: page >= totalPages,
    };
  }

  async addComment(
    boardId: string,
    dto: RequestAddCommentDto,
  ): Promise<Comment> {
    const board = await this.getBoardOrThrow(boardId);

    if (!dto.email) {
      throw new InvalidBoardRequestException('이메일이 필요합니다.');
    }
    const member = await this.getMemberOrThrow(dto.email);

    const comment = this.commentRepository.create({
      content: dto.content,
      board,
      member,
    });

    const savedComment = await this.commentRepository.save(comment);

    board.commentCount += 1;
    await this.boardRepository.save(board);

    return savedComment;
  }
}
