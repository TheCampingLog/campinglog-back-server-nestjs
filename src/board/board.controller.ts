import { Controller, Post, Body } from '@nestjs/common';
import { BoardService } from './board.service';
import { RequestAddBoardDto } from './dto/request-add-board.dto';

@Controller('api/boards')
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
}
