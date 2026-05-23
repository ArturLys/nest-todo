import { TodosService } from './todos.service';
export declare class TodosController {
    private readonly todosService;
    constructor(todosService: TodosService);
    create(body: {
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
    update(id: number, body: {
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
