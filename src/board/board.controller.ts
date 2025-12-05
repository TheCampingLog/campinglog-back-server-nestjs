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
} from '@nestjs/common';
import { BoardService } from './board.service';
import { RequestAddBoardDto } from './dto/request-add-board.dto';
import { RequestSetBoardDto } from './dto/request-set-board.dto';
import { BoardExceptionFilter } from './filters/board-exception.filter';
import { ResponseGetBoardRankDto } from './dto/response-get-board-rank.dto';

@Controller('api/boards')
@UseFilters(BoardExceptionFilter)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  async create(@Body() requestAddBoardDto: RequestAddBoardDto) {
    const board = await this.boardService.addBoard(requestAddBoardDto);
    return {
      message: '게시글이 등록되었습니다.',
      boardId: board.boardId,
    };
  }
  @Put(':boardId')
  async update(
    @Param('boardId') boardId: string,
    @Body() dto: RequestSetBoardDto,
  ) {
    await this.boardService.setBoard({ ...dto, boardId });
    return { message: '게시글이 수정되었습니다.' };
  }

  @Get('rank')
  async getBoardRank(
    @Query('limit') limit: number = 3,
  ): Promise<ResponseGetBoardRankDto[]> {
    return this.boardService.getBoardRank(limit);
  }

  @Delete(':boardId')
  async delete(@Param('boardId') boardId: string) {
    await this.boardService.deleteBoard(boardId);
    return;
  }
}
