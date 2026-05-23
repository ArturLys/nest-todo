import { Test, TestingModule } from '@nestjs/testing';
import { TodosService } from './todos.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('TodosService', () => {
  let service: TodosService;
  let prisma: PrismaService;

  const mockPrisma = {
    todo: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task when count is less than 5', async () => {
      mockPrisma.todo.count.mockResolvedValue(3);
      mockPrisma.todo.create.mockResolvedValue({
        id: 1,
        text: 'Test task',
        category: 'Work',
        completed: false,
      });

      const result = await service.create({ text: 'Test task', category: 'Work' });
      expect(result).toBeDefined();
      expect(result.text).toBe('Test task');
      expect(prisma.todo.count).toHaveBeenCalledWith({
        where: { category: 'Work', completed: false },
      });
    });

    it('should throw BadRequestException when count is 5 or more', async () => {
      mockPrisma.todo.count.mockResolvedValue(5);

      await expect(
        service.create({ text: 'Test task', category: 'Work' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
