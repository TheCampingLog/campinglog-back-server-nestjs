import { Controller, Post, Body } from '@nestjs/common';
import { BoardService } from './board.service';
import { RequestAddBoardDto } from './dto/request-add-board.dto';

@Controller('api/boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  create(@Body() requestAddBoardDto: RequestAddBoardDto) {
    return this.boardService.addBoard(requestAddBoardDto);
  }
}
