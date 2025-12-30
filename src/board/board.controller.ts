import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  UseFilters,
  Get,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { RequestAddBoardDto } from './dto/request/request-add-board.dto';
import { RequestSetBoardDto } from './dto/request/request-set-board.dto';
import { BoardExceptionFilter } from './filters/board-exception.filter';
import { ResponseGetBoardRankDto } from './dto/response/response-get-board-rank.dto';
import { AccessAuthGuard } from 'src/auth/passport/access-auth.guard';
import { AccessMember } from 'src/auth/decorators/jwt-member.decorator';
import { type JwtData } from 'src/auth/interfaces/jwt.interface';
import { HttpCode } from '@nestjs/common/decorators/http/http-code.decorator';
import { RequestAddCommentDto } from './dto/request/request-add-comment.dto';
import { ResponseGetCommentsWrapper } from './dto/response/response-get-comments-wrapper.dto';
import { RequestSetCommentDto } from './dto/request/request-set-comment.dto';
import { ResponseGetLikeDto } from './dto/response/response-get-like.dto';
import { RequestAddLikeDto } from './dto/request/request-add-like.dto';
import { ResponseToggleLikeDto } from './dto/response/response-toggle-like.dto';

@Controller('api/boards')
@UseFilters(BoardExceptionFilter)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @UseGuards(AccessAuthGuard)
  @HttpCode(201)
  @Post()
  async create(
    @AccessMember() accessMember: JwtData,
    @Body() requestAddBoardDto: RequestAddBoardDto,
  ) {
    requestAddBoardDto.email = accessMember.email;
    const board = await this.boardService.addBoard(requestAddBoardDto);
    return {
      message: '게시글이 등록되었습니다.',
      boardId: board.boardId,
    };
  }

  @UseGuards(AccessAuthGuard)
  @Put(':boardId')
  @HttpCode(200)
  async update(
    @AccessMember() accessMember: JwtData,
    @Param('boardId') boardId: string,
    @Body() dto: RequestSetBoardDto,
  ) {
    dto.email = accessMember.email;
    await this.boardService.setBoard({ ...dto, boardId });
    return { message: '게시글이 수정되었습니다.' };
  }

  @Get('rank')
  @HttpCode(200)
  async getBoardRank(
    @Query('limit') limit: number = 3,
  ): Promise<ResponseGetBoardRankDto[]> {
    return this.boardService.getBoardRank(limit);
  }

  @Delete(':boardId')
  @HttpCode(204)
  async delete(@Param('boardId') boardId: string) {
    await this.boardService.deleteBoard(boardId);
    return;
  }

  @Get('search')
  @HttpCode(200)
  async searchBoards(
    @Query('keyword') keyword: string,
    @Query('category') category: string = '',
    @Query('page') page: number = 1,
    @Query('size') size: number = 3,
  ) {
    const result = await this.boardService.searchBoards(
      keyword,
      category,
      page,
      size,
    );
    return result;
  }

  @Get('category')
  @HttpCode(200)
  async getBoardsByCategory(
    @Query('category') category: string,
    @Query('page') page: number = 1,
    @Query('size') size: number = 3,
  ) {
    const result = await this.boardService.getBoardsByCategory(
      category,
      page,
      size,
    );
    return result;
  }

  @Get(':boardId')
  @HttpCode(200)
  async getBoardDetail(
    @Param('boardId') boardId: string,
    @Query('userEmail') userEmail?: string,
  ) {
    const boardDetail = await this.boardService.getBoardDetail(
      boardId,
      userEmail,
    );
    return boardDetail;
  }

  @UseGuards(AccessAuthGuard)
  @HttpCode(201)
  @Post(':boardId/comment')
  async addComment(
    @Param('boardId') boardId: string,
    @Body() dto: RequestAddCommentDto,
    @AccessMember() accessMember: JwtData,
  ) {
    dto.boardId = boardId;
    dto.email = accessMember.email;
    const saved = await this.boardService.addComment(boardId, dto);
    return {
      message: '댓글이 등록되었습니다.',
      boardId: boardId,
      commentId: saved.commentId,
    };
  }

  @Get(':boardId/comments')
  @HttpCode(200)
  async getComments(
    @Param('boardId') boardId: string,
    @Query('page') page: number = 1,
    @Query('size') size: number = 3,
  ): Promise<ResponseGetCommentsWrapper> {
    return await this.boardService.getComments(boardId, page, size);
  }

  @UseGuards(AccessAuthGuard)
  @Put(':boardId/comments/:commentId')
  @HttpCode(200)
  async updateComment(
    @Param('boardId') boardId: string,
    @Param('commentId') commentId: string,
    @Body() dto: RequestSetCommentDto,
    @AccessMember() accessMember: JwtData,
  ) {
    dto.boardId = boardId;
    dto.commentId = commentId;
    dto.email = accessMember.email;
    await this.boardService.updateComment(boardId, commentId, dto);
    return {
      message: '댓글이 수정되었습니다.',
      status: 'success',
    };
  }

  @UseGuards(AccessAuthGuard)
  @Delete(':boardId/comments/:commentId')
  @HttpCode(200)
  async deleteComment(
    @Param('boardId') boardId: string,
    @Param('commentId') commentId: string,
    @AccessMember() accessMember: JwtData,
  ) {
    await this.boardService.deleteComment(
      boardId,
      commentId,
      accessMember.email,
    );
    return {
      message: '댓글이 삭제되었습니다.',
      status: 'success',
    };
  }

  @Get(':boardId/likes')
  @HttpCode(200)
  async getLikes(
    @Param('boardId') boardId: string,
  ): Promise<ResponseGetLikeDto> {
    return await this.boardService.getLikes(boardId);
  }

  @UseGuards(AccessAuthGuard)
  @Post(':boardId/likes')
  @HttpCode(201)
  async addLike(
    @Param('boardId') boardId: string,
    @Body() dto: RequestAddLikeDto,
    @AccessMember() accessMember: JwtData,
  ): Promise<ResponseToggleLikeDto> {
    dto.email = accessMember.email;
    return await this.boardService.addLike(boardId, dto);
  }

  @UseGuards(AccessAuthGuard)
  @Delete(':boardId/likes')
  @HttpCode(200)
  async deleteLike(
    @Param('boardId') boardId: string,
    @AccessMember() accessMember: JwtData,
  ): Promise<ResponseToggleLikeDto> {
    return await this.boardService.deleteLike(boardId, accessMember.email);
  }
}
