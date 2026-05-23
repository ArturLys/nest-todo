import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async create(data: { text: string; category: string }) {
    if (!data.text || !data.category) {
      throw new BadRequestException('Text and category are required.');
    }

    const trimmedText = data.text.trim();
    const trimmedCategory = data.category.trim();

    if (!trimmedText || !trimmedCategory) {
      throw new BadRequestException('Text and category cannot be empty.');
    }

    // Check count of uncompleted (active) tasks in this category
    const activeCount = await this.prisma.todo.count({
      where: {
        category: trimmedCategory,
        completed: false,
      },
    });

    if (activeCount >= 5) {
      throw new BadRequestException(
        `Category "${trimmedCategory}" already has the maximum of 5 active tasks.`,
      );
    }

    return this.prisma.todo.create({
      data: {
        text: trimmedText,
        category: trimmedCategory,
        completed: false,
      },
    });
  }

  async findAll(category?: string) {
    return this.prisma.todo.findMany({
      where: category ? { category } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, data: { completed: boolean }) {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      throw new BadRequestException(`Todo with ID ${id} not found.`);
    }

    // If we are marking as uncompleted (active), verify that this doesn't exceed the limit
    if (data.completed === false && todo.completed === true) {
      const activeCount = await this.prisma.todo.count({
        where: {
          category: todo.category,
          completed: false,
        },
      });
      if (activeCount >= 5) {
        throw new BadRequestException(
          `Cannot restore task. Category "${todo.category}" already has the maximum of 5 active tasks.`,
        );
      }
    }

    return this.prisma.todo.update({
      where: { id },
      data: { completed: data.completed },
    });
  }

  async delete(id: number) {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      throw new BadRequestException(`Todo with ID ${id} not found.`);
    }
    return this.prisma.todo.delete({ where: { id } });
  }

  async getCategories() {
    const defaults = ['Work', 'Personal', 'Shopping', 'Health', 'Education'];
    const distinctDb = await this.prisma.todo.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    const dbCategories = distinctDb.map((t) => t.category);
    const merged = Array.from(new Set([...defaults, ...dbCategories])).sort();
    return merged;
  }
}
