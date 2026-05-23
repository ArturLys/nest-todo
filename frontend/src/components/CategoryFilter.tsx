import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categories,
}: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter:</span>
      <Select value={selectedCategory} onValueChange={(val) => onCategoryChange(val || "All")}>
        <SelectTrigger className="w-[180px] rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold h-9 focus:ring-indigo-500 outline-none cursor-pointer">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <SelectItem value="All" className="text-xs font-semibold cursor-pointer rounded-lg">
            All
          </SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat} className="text-xs font-semibold cursor-pointer rounded-lg">
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
