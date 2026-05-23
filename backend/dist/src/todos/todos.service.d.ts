import { PrismaService } from '../prisma/prisma.service';
export declare class TodosService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        text: string;
        category: string;
    }): Promise<{
        category: string;
        completed: boolean;
        text: string;
        createdAt: Date;
        id: number;
    }>;
    findAll(category?: string): Promise<{
        category: string;
        completed: boolean;
        text: string;
        createdAt: Date;
        id: number;
    }[]>;
    update(id: number, data: {
        completed: boolean;
    }): Promise<{
        category: string;
        completed: boolean;
        text: string;
        createdAt: Date;
        id: number;
    }>;
    delete(id: number): Promise<{
        category: string;
        completed: boolean;
        text: string;
        createdAt: Date;
        id: number;
    }>;
    getCategories(): Promise<string[]>;
}
