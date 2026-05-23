import type { Todo } from "../types";
import { TaskItem } from "@/components/TaskItem";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskListProps {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  selectedTodoIds: number[];
  onSelectToggle: (id: number) => void;
  onCompleteToggle: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onEditSuccess: () => void;
  onRetry: () => void;
  selectedCategory: string;
  categories: string[];
}

export function TaskList({
  todos,
  isLoading,
  error,
  selectedTodoIds,
  onSelectToggle,
  onCompleteToggle,
  onDelete,
  onEditSuccess,
  onRetry,
  selectedCategory,
  categories,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-450 dark:text-slate-505">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs font-bold">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 border border-red-500/20 dark:border-red-500/10 rounded-2xl bg-red-500/5 text-red-500 p-6 text-center">
        <AlertCircle className="w-9 h-9 text-red-500/80 animate-pulse" />
        <p className="text-xs font-bold max-w-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/15 p-6 text-center text-slate-400 dark:text-slate-500">
        <Inbox className="w-10 h-10 stroke-[1.25] mb-2 text-slate-300 dark:text-slate-700" />
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">No tasks found</h3>
        <p className="text-[10px] max-w-xs mt-0.5">
          {selectedCategory === 'All'
            ? "Your schedule is completely clear! Add a task above to get started."
            : `No active tasks in the "${selectedCategory}" category.`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {todos.map((todo) => (
        <TaskItem
          key={todo.id}
          todo={todo}
          isSelected={selectedTodoIds.includes(todo.id)}
          onSelectToggle={onSelectToggle}
          onCompleteToggle={onCompleteToggle}
          onDelete={onDelete}
          onEditSuccess={onEditSuccess}
          categories={categories}
        />
      ))}
    </div>
  );
}
