import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const formSchema = z.object({
  text: z.string().min(1, "Task description is required").max(80, "Must be 80 characters or less"),
  category: z.string().min(1, "Category is required").max(20, "Must be 20 characters or less"),
});

type FormData = z.infer<typeof formSchema>;

interface TaskFormProps {
  onTaskCreated: () => void;
  categories: string[];
}

export function TaskForm({ onTaskCreated, categories }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "", category: "" },
  });

  const categoryValue = watch("category");

  const onSubmit = async (data: FormData) => {
    try {
      await axios.post(`${API_URL}/todos`, {
        text: data.text,
        category: data.category.trim(),
      });
      toast.success(`Task added to "${data.category}"`);
      reset();
      onTaskCreated();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to create task.";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="What needs to be done?"
            className="rounded-xl focus-visible:ring-indigo-500 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10"
            {...register("text")}
          />
          {errors.text && (
            <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.text.message}
            </p>
          )}
        </div>

        <div className="w-full md:w-48">
          <Select value={categoryValue} onValueChange={(val) => setValue("category", val || "")}>
            <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold h-10 w-full outline-none cursor-pointer">
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
            <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.category.message}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold cursor-pointer shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 h-10 px-4 flex-shrink-0"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>Add</span>
        </Button>
      </div>
    </form>
  );
}
