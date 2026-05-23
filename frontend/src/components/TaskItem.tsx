import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import type { Todo } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Pencil,
  Check,
  Briefcase,
  User,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Tag,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface TaskItemProps {
  todo: Todo;
  isSelected: boolean;
  onSelectToggle: (id: number) => void;
  onCompleteToggle: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onEditSuccess: () => void;
  categories: string[];
}

const editSchema = z.object({
  text: z.string().min(1, "Task description is required").max(80, "Must be 80 characters or less"),
  category: z.string().min(1, "Category is required").max(20, "Must be 20 characters or less"),
});

type EditFormData = z.infer<typeof editSchema>;

export function TaskItem({
  todo,
  isSelected,
  onSelectToggle,
  onCompleteToggle,
  onDelete,
  onEditSuccess,
  categories,
}: TaskItemProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // React Hook Form for Edit Dialog
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      text: todo.text,
      category: todo.category,
    },
  });

  const categoryValue = watch("category");

  // Get category icon
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'work':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'personal':
        return <User className="w-3.5 h-3.5" />;
      case 'shopping':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'health':
        return <HeartPulse className="w-3.5 h-3.5" />;
      case 'education':
        return <GraduationCap className="w-3.5 h-3.5" />;
      default:
        return <Tag className="w-3.5 h-3.5" />;
    }
  };

  // Get category visual colors
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'work':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
      case 'personal':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25';
      case 'shopping':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
      case 'health':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      case 'education':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25';
    }
  };

  const handleEditSubmit = async (data: EditFormData) => {
    try {
      await axios.patch(`${API_URL}/todos/${todo.id}`, {
        text: data.text.trim(),
        category: data.category.trim(),
      });
      toast.success("Task updated successfully");
      setDialogOpen(false);
      onEditSuccess();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to update task";
      toast.error(message);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      reset({
        text: todo.text,
        category: todo.category,
      });
    }
    setDialogOpen(open);
  };

  return (
    <div
      onClick={() => !todo.completed && onSelectToggle(todo.id)}
      className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm hover:shadow-md dark:shadow-slate-950/20 transition-all duration-300 group cursor-pointer ${
        todo.completed
          ? 'opacity-65 border-emerald-500/20 dark:border-emerald-500/10 bg-emerald-500/[0.01] !cursor-default'
          : isSelected
          ? 'border-indigo-500 bg-indigo-500/[0.01]'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Main Status Checkmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering card selection click
            onCompleteToggle(todo);
          }}
          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300 flex-shrink-0 cursor-pointer ${
            todo.completed
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-950'
          }`}
          title={todo.completed ? "Mark as active" : "Mark as completed"}
        >
          {todo.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Text & Category Tag */}
        <div className="flex flex-col min-w-0 gap-1">
          <span
            className={`text-sm font-semibold break-words leading-tight transition-all duration-300 ${
              todo.completed
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {todo.text}
          </span>
          
          <div className="flex items-center">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(
                todo.category
              )}`}
            >
              {getCategoryIcon(todo.category)}
              <span>{todo.category}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 ml-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Edit Button with Shadcn Dialog */}
        {!todo.completed && (
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer outline-none" onClick={(e) => e.stopPropagation()} title="Edit task">
              <Pencil className="w-4 h-4" />
            </DialogTrigger>
            <DialogContent 
              onClick={(e) => e.stopPropagation()} // Avoid card select when clicking dialog background
              className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl max-w-sm w-full p-6"
            >
              <DialogHeader>
                <DialogTitle className="text-lg font-bold tracking-tight">Edit Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleEditSubmit)} className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editTaskText" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Task Description</label>
                  <Input
                    id="editTaskText"
                    type="text"
                    placeholder="Prepare presentation..."
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-visible:ring-indigo-500 h-10"
                    {...register("text")}
                  />
                  {errors.text && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.text.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editTaskCategory" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</label>
                  <Select value={categoryValue} onValueChange={(val) => setValue("category", val || "")}>
                    <SelectTrigger id="editTaskCategory" className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold h-10 w-full outline-none cursor-pointer">
                      <SelectValue placeholder="Category..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs font-semibold cursor-pointer rounded-lg">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.category.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-indigo-650 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold cursor-pointer h-10 mt-2 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation(); // Avoid card select
            onDelete(todo);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
