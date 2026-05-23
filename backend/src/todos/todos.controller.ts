import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { TodosService } from './todos.service';

@Controller()
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post('todos')
  create(@Body() body: { text: string; category: string }) {
    return this.todosService.create(body);
  }

  @Get('todos')
  findAll(@Query('category') category?: string) {
    return this.todosService.findAll(category);
  }

  @Patch('todos/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { completed?: boolean; text?: string; category?: string },
  ) {
    return this.todosService.update(id, body);
  }

  @Delete('todos/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.delete(id);
  }

  @Get('categories')
  getCategories() {
    return this.todosService.getCategories();
  }
}
