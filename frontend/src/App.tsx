import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import {
  Plus,
  Trash2,
  Moon,
  Sun,
  Loader2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Briefcase,
  User,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Tag,
  Check,
  Sparkles,
  Undo2,
  Square,
  CheckSquare,
  ChevronDown
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

// Interfaces
interface Todo {
  id: number;
  text: string;
  category: string;
  completed: boolean;
  createdAt: string;
}

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface PendingAction {
  timeoutId: any;
  todoIds: number[];
  type: 'complete' | 'delete';
  originalTodos: Todo[];
}

// Form Validation Schema
const formSchema = z.object({
  text: z.string().min(1, 'Task description is required').max(80, 'Must be 80 characters or less'),
  category: z.string().min(1, 'Category is required').max(20, 'Must be 20 characters or less'),
});

type FormData = z.infer<typeof formSchema>;

export default function App() {
  // Theme state (system preference or localStorage)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // App State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom Category dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Multi-select state
  const [selectedTodoIds, setSelectedTodoIds] = useState<number[]>([]);

  // Toast state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Pending (Optimistic) Actions for Undo
  const pendingActionsRef = useRef<Record<string, PendingAction>>({});

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
      category: '',
    },
  });

  const categoryValue = watch('category');

  // Sync class name for Dark Mode
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Click outside listener for category select dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial data on mount and category changes
  useEffect(() => {
    fetchTodos();
    fetchCategories();
  }, [selectedCategory]);

  const fetchTodos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = selectedCategory === 'All' 
        ? `${API_URL}/todos` 
        : `${API_URL}/todos?category=${encodeURIComponent(selectedCategory)}`;
      const res = await axios.get<Todo[]>(url);
      
      // Filter out permanently completed tasks that are NOT in a pending grace period
      const activePendingCompletedIds = Object.values(pendingActionsRef.current)
        .filter(act => act.type === 'complete')
        .flatMap(act => act.todoIds);

      const filtered = res.data.filter(todo => {
        if (todo.completed) {
          // Keep it only if it's currently in a pending undo state
          return activePendingCompletedIds.includes(todo.id);
        }
        return true;
      });

      setTodos(filtered);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch tasks. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get<string[]>(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  // Toast Helper
  const showToast = (
    message: string, 
    type: 'success' | 'error' | 'info' = 'success', 
    action?: { label: string; onClick: () => void }
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastNotification = { id, message, type, action };
    setToasts((prev) => [...prev, newToast]);

    // Automatically remove toast after 5 seconds if no action, or 6s with action
    setTimeout(() => {
      removeToast(id);
    }, action ? 6000 : 4000);

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Create Todo
  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await axios.post<Todo>(`${API_URL}/todos`, {
        text: data.text,
        category: data.category,
      });

      // Insert new todo at top
      setTodos((prev) => [res.data, ...prev]);
      reset({ text: '', category: '' });
      showToast(`Task created in "${res.data.category}"!`, 'success');
      fetchCategories(); // Refresh categories
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to create task.';
      showToast(errMsg, 'error');
    }
  };

  // 5-second Grace Period for Completing Tasks
  const handleToggleComplete = (todo: Todo) => {
    const targetStatus = !todo.completed;
    
    if (targetStatus === true) {
      // Optimistic Completion: mark completed locally
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: true } : t))
      );

      const actionId = `complete-${todo.id}`;
      
      // Setup timeout to write to DB in 5 seconds
      const timeoutId = setTimeout(async () => {
        try {
          await axios.patch(`${API_URL}/todos/${todo.id}`, { completed: true });
          // Remove from local list after 5s grace period
          setTodos((prev) => prev.filter((t) => t.id !== todo.id));
          delete pendingActionsRef.current[actionId];
        } catch (err: any) {
          console.error(err);
          // Revert on backend error
          setTodos((prev) =>
            prev.map((t) => (t.id === todo.id ? { ...t, completed: false } : t))
          );
          showToast(err.response?.data?.message || 'Failed to update task on server.', 'error');
        }
      }, 5000);

      // Save pending action
      pendingActionsRef.current[actionId] = {
        timeoutId,
        todoIds: [todo.id],
        type: 'complete',
        originalTodos: [todo]
      };

      // Show toast with Undo
      showToast('Task completed', 'success', {
        label: 'Undo',
        onClick: () => {
          // Clear timeout
          clearTimeout(timeoutId);
          delete pendingActionsRef.current[actionId];
          // Revert state
          setTodos((prev) =>
            prev.map((t) => (t.id === todo.id ? { ...t, completed: false } : t))
          );
        },
      });
    } else {
      // Toggle back from completed (if visually completed but not yet committed)
      // Or if it was already committed, just make direct call
      const actionId = `complete-${todo.id}`;
      if (pendingActionsRef.current[actionId]) {
        clearTimeout(pendingActionsRef.current[actionId].timeoutId);
        delete pendingActionsRef.current[actionId];
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? { ...t, completed: false } : t))
        );
      } else {
        // Toggle completed task back to active directly
        axios.patch(`${API_URL}/todos/${todo.id}`, { completed: false })
          .then(() => {
            fetchTodos();
            showToast('Task marked as active', 'info');
          })
          .catch((err) => {
            showToast(err.response?.data?.message || 'Failed to restore task.', 'error');
          });
      }
    }
  };

  // 5-second Grace Period for Deleting Tasks
  const handleDelete = (todo: Todo) => {
    // Hide from UI optimistically
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    setSelectedTodoIds((prev) => prev.filter((id) => id !== todo.id));

    const actionId = `delete-${todo.id}`;

    // Setup DB write timeout
    const timeoutId = setTimeout(async () => {
      try {
        await axios.delete(`${API_URL}/todos/${todo.id}`);
        delete pendingActionsRef.current[actionId];
        fetchCategories(); // Refresh categories in case it was the last task
      } catch (err) {
        console.error('Failed to delete task permanently', err);
        // Restore if backend fails
        setTodos((prev) => [todo, ...prev]);
        showToast('Failed to delete task on server.', 'error');
      }
    }, 5000);

    // Save pending action
    pendingActionsRef.current[actionId] = {
      timeoutId,
      todoIds: [todo.id],
      type: 'delete',
      originalTodos: [todo]
    };

    // Show toast with Undo
    showToast('Task deleted', 'info', {
      label: 'Undo',
      onClick: () => {
        clearTimeout(timeoutId);
        delete pendingActionsRef.current[actionId];
        // Restore to local list
        setTodos((prev) => [todo, ...prev].sort((a, b) => b.id - a.id));
      },
    });
  };

  // Bulk Actions
  const handleSelectTodo = (id: number) => {
    setSelectedTodoIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    // Only select currently visible, uncompleted todos
    const visibleActiveIds = todos.filter(t => !t.completed).map(t => t.id);
    const allSelected = visibleActiveIds.every(id => selectedTodoIds.includes(id));
    
    if (allSelected) {
      // Deselect visible active todos
      setSelectedTodoIds(prev => prev.filter(id => !visibleActiveIds.includes(id)));
    } else {
      // Select all visible active todos
      setSelectedTodoIds(prev => Array.from(new Set([...prev, ...visibleActiveIds])));
    }
  };

  const handleBulkComplete = () => {
    if (selectedTodoIds.length === 0) return;

    const selectedTodos = todos.filter((t) => selectedTodoIds.includes(t.id) && !t.completed);
    if (selectedTodos.length === 0) return;

    const idsToComplete = selectedTodos.map((t) => t.id);

    // Optimistically update locally
    setTodos((prev) =>
      prev.map((t) => (idsToComplete.includes(t.id) ? { ...t, completed: true } : t))
    );

    const actionId = `bulk-complete-${Date.now()}`;
    setSelectedTodoIds([]);

    // DB Timeout
    const timeoutId = setTimeout(async () => {
      try {
        await Promise.all(
          idsToComplete.map((id) =>
            axios.patch(`${API_URL}/todos/${id}`, { completed: true })
          )
        );
        // Remove completed tasks from state after 5 seconds
        setTodos((prev) => prev.filter((t) => !idsToComplete.includes(t.id)));
        delete pendingActionsRef.current[actionId];
      } catch (err) {
        console.error(err);
        // Revert
        setTodos((prev) =>
          prev.map((t) => (idsToComplete.includes(t.id) ? { ...t, completed: false } : t))
        );
        showToast('Failed to complete some tasks on server.', 'error');
      }
    }, 5000);

    // Save pending action
    pendingActionsRef.current[actionId] = {
      timeoutId,
      todoIds: idsToComplete,
      type: 'complete',
      originalTodos: selectedTodos
    };

    // Show toast with Undo
    showToast(`${idsToComplete.length} tasks completed`, 'success', {
      label: 'Undo',
      onClick: () => {
        clearTimeout(timeoutId);
        delete pendingActionsRef.current[actionId];
        // Revert local state
        setTodos((prev) =>
          prev.map((t) => (idsToComplete.includes(t.id) ? { ...t, completed: false } : t))
        );
      },
    });
  };

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

  // Category Colors
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 antialiased flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        
        {/* Header Section */}
        <header className="flex justify-between items-center bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Taskly</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Keep it smart, up to 5 tasks</p>
            </div>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
            title="Toggle theme"
            aria-label="Toggle dark/light mode"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Task Form Card */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Create New Task</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Task Text Input */}
              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label htmlFor="taskText" className="text-xs font-medium text-slate-500 dark:text-slate-400">What needs to be done?</label>
                <input
                  id="taskText"
                  type="text"
                  placeholder="e.g. Prepare meeting agenda..."
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all duration-200 ${
                    errors.text ? 'border-red-500 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  {...register('text')}
                />
                {errors.text && (
                  <span className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" /> {errors.text.message}
                  </span>
                )}
              </div>

              {/* Category Dropdown Input */}
              <div className="md:col-span-2 flex flex-col gap-1.5 relative" ref={dropdownRef}>
                <label htmlFor="taskCategory" className="text-xs font-medium text-slate-500 dark:text-slate-400">Category</label>
                <div className="relative">
                  <input
                    id="taskCategory"
                    type="text"
                    placeholder="Select or type..."
                    className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all duration-200 ${
                      errors.category ? 'border-red-500 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-800'
                    }`}
                    {...register('category')}
                    onClick={() => setShowCategoryDropdown(true)}
                    onFocus={() => setShowCategoryDropdown(true)}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {errors.category && (
                  <span className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" /> {errors.category.message}
                  </span>
                )}

                {/* Dropdown Suggestions */}
                {showCategoryDropdown && (
                  <div className="absolute top-[102%] left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-lg z-55 max-h-48 overflow-y-auto p-1 flex flex-col gap-0.5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 py-1.5">Suggestions</div>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setValue('category', cat);
                          setShowCategoryDropdown(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-xs text-left rounded-lg transition-colors duration-150 ${
                          categoryValue === cat 
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {getCategoryIcon(cat)}
                        <span>{cat}</span>
                      </button>
                    ))}
                    {categories.length === 0 && (
                      <div className="text-xs text-slate-400 px-3 py-2 text-center">Type a custom category name!</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650 text-white font-medium text-sm py-2.5 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Task
                </>
              )}
            </button>
          </form>
        </section>

        {/* Filter & Bulk Actions Bar */}
        <section className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm">
          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter:</span>
            <div className="relative flex-1 md:flex-none">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-indigo-500 transition-colors duration-200 appearance-none cursor-pointer w-full"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Bulk Action Panel */}
          {todos.filter(t => !t.completed).length > 0 && (
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/50 dark:border-slate-800/50">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-xs font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
              >
                {todos.filter(t => !t.completed).every(t => selectedTodoIds.includes(t.id)) ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                Select All Active
              </button>

              {selectedTodoIds.length > 0 && (
                <button
                  onClick={handleBulkComplete}
                  className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-[0.97]"
                >
                  Complete Selected ({selectedTodoIds.length})
                </button>
              )}
            </div>
          )}
        </section>

        {/* Task List */}
        <section className="flex flex-col gap-3 min-h-[250px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Loading your tasks...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 border border-red-500/20 dark:border-red-500/10 rounded-2xl bg-red-500/5 text-red-500 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-500/80 animate-bounce" />
              <p className="text-sm font-medium max-w-sm">{error}</p>
              <button
                onClick={() => { fetchTodos(); fetchCategories(); }}
                className="mt-2 text-xs font-bold px-4 py-2 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/20 p-6 text-center text-slate-400 dark:text-slate-500">
              <Inbox className="w-12 h-12 stroke-[1.25] mb-2 text-slate-300 dark:text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No tasks found</h3>
              <p className="text-xs max-w-xs mt-1">
                {selectedCategory === 'All'
                  ? "You are completely clear! Get started by adding a task above."
                  : `No active tasks found in the "${selectedCategory}" category.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {todos.map((todo) => {
                const isSelected = selectedTodoIds.includes(todo.id);
                return (
                  <div
                    key={todo.id}
                    className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm hover:shadow-md dark:shadow-slate-950/20 transition-all duration-300 group ${
                      todo.completed
                        ? 'opacity-65 border-emerald-500/20 dark:border-emerald-500/10 bg-emerald-500/[0.01]'
                        : isSelected
                        ? 'border-indigo-500 bg-indigo-500/[0.01]'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Batch Checkbox (Hidden for completed tasks) */}
                      {!todo.completed && (
                        <button
                          onClick={() => handleSelectTodo(todo.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors duration-150 flex-shrink-0"
                          title="Select task"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Main Status Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(todo)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300 flex-shrink-0 ${
                          todo.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-950'
                        }`}
                        title={todo.completed ? "Mark as active" : "Mark as completed"}
                      >
                        {todo.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Todo Text & Category */}
                      <div className="flex flex-col min-w-0 gap-1">
                        <span
                          className={`text-sm font-medium break-words leading-tight transition-all duration-300 ${
                            todo.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {todo.text}
                        </span>
                        
                        {/* Category tag */}
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(
                              todo.category
                            )}`}
                          >
                            {getCategoryIcon(todo.category)}
                            <span>{todo.category}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-3">
                      <button
                        onClick={() => handleDelete(todo)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-all duration-200"
                        title="Delete task"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Floating Glassmorphic Toast Notifications */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-100 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 backdrop-blur-xl border pointer-events-auto transition-all duration-300 animate-slide-in ${
              toast.type === 'error'
                ? 'bg-red-500/90 text-white border-red-500/20'
                : toast.type === 'info'
                ? 'bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 border-slate-800/40 dark:border-slate-200/40'
                : 'bg-indigo-650/90 dark:bg-indigo-950/90 text-white border-indigo-600/30'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-white" />
              ) : toast.type === 'info' ? (
                <Inbox className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              )}
              <span>{toast.message}</span>
            </div>

            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  removeToast(toast.id);
                }}
                className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-[0.97] px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all duration-150"
              >
                <Undo2 className="w-3.5 h-3.5" />
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Toast Slide-In Animation CSS */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(1.5rem) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
