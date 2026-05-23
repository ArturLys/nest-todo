import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const activeTheme = theme === 'system' 
        ? (mediaQuery.matches ? 'dark' : 'light') 
        : theme;
      
      if (activeTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 transition-all flex items-center justify-center focus-visible:ring-indigo-500 outline-none">
        <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 cursor-pointer transition-colors duration-150 rounded-lg ${
            theme === 'light' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 cursor-pointer transition-colors duration-150 rounded-lg ${
            theme === 'dark' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <Moon className="h-3.5 w-3.5 text-indigo-400" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 cursor-pointer transition-colors duration-150 rounded-lg ${
            theme === 'system' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <Monitor className="h-3.5 w-3.5 text-slate-400" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
