"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TodosService = class TodosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        if (!data.text || !data.category) {
            throw new common_1.BadRequestException('Text and category are required.');
        }
        const trimmedText = data.text.trim();
        const trimmedCategory = data.category.trim();
        if (!trimmedText || !trimmedCategory) {
            throw new common_1.BadRequestException('Text and category cannot be empty.');
        }
        const activeCount = await this.prisma.todo.count({
            where: {
                category: trimmedCategory,
                completed: false,
            },
        });
        if (activeCount >= 5) {
            throw new common_1.BadRequestException(`Category "${trimmedCategory}" already has the maximum of 5 active tasks.`);
        }
        return this.prisma.todo.create({
            data: {
                text: trimmedText,
                category: trimmedCategory,
                completed: false,
            },
        });
    }
    async findAll(category) {
        return this.prisma.todo.findMany({
            where: category ? { category } : {},
            orderBy: { createdAt: 'desc' },
        });
    }
    async update(id, data) {
        const todo = await this.prisma.todo.findUnique({ where: { id } });
        if (!todo) {
            throw new common_1.BadRequestException(`Todo with ID ${id} not found.`);
        }
        if (data.completed === false && todo.completed === true) {
            const activeCount = await this.prisma.todo.count({
                where: {
                    category: todo.category,
                    completed: false,
                },
            });
            if (activeCount >= 5) {
                throw new common_1.BadRequestException(`Cannot restore task. Category "${todo.category}" already has the maximum of 5 active tasks.`);
            }
        }
        return this.prisma.todo.update({
            where: { id },
            data: { completed: data.completed },
        });
    }
    async delete(id) {
        const todo = await this.prisma.todo.findUnique({ where: { id } });
        if (!todo) {
            throw new common_1.BadRequestException(`Todo with ID ${id} not found.`);
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
};
exports.TodosService = TodosService;
exports.TodosService = TodosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TodosService);
//# sourceMappingURL=todos.service.js.map