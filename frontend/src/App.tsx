import { useState, useEffect } from 'react'
import axios from 'axios'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TaskForm } from '@/components/TaskForm'
import { CategoryFilter } from '@/components/CategoryFilter'
import { TaskList } from '@/components/TaskList'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import type { Todo } from '@/types'
import { CheckSquare, Square } from 'lucide-react'

const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000'
}

const API_URL = getApiUrl()

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Selection states for bulk actions
  const [selectedTodoIds, setSelectedTodoIds] = useState<number[]>([])

  useEffect(() => {
    fetchTodos()
    fetchCategories()
  }, [selectedCategory])

  const fetchTodos = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = selectedCategory === 'All' ? `${API_URL}/todos` : `${API_URL}/todos?category=${encodeURIComponent(selectedCategory)}`
      const res = await axios.get<Todo[]>(url)

      // Defensive guard to prevent crashes if the API returns an HTML error page instead of an array
      const rawData = Array.isArray(res.data) ? res.data : []
      const activeTodos = rawData.filter((todo) => !todo.completed)
      setTodos(activeTodos)
    } catch (err: any) {
      console.error(err)
      setError('Failed to connect to the backend server. Please verify it is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await axios.get<string[]>(`${API_URL}/categories`)
      setCategories(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

  const handleTaskCreated = () => {
    fetchTodos()
    fetchCategories()
  }

  // Complete Toggle logic (Completed task remains in list for 5 seconds, then removes visually)
  const handleCompleteToggle = async (todo: Todo) => {
    const targetStatus = !todo.completed

    try {
      // Mark completed in DB
      await axios.patch(`${API_URL}/todos/${todo.id}`, { completed: targetStatus })

      // Update state locally
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: targetStatus } : t)))

      if (targetStatus) {
        toast.success('Task completed', {
          action: {
            label: 'Undo',
            onClick: async () => {
              try {
                // Restore status in DB
                await axios.patch(`${API_URL}/todos/${todo.id}`, { completed: false })
                setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: false } : t)))
                fetchTodos()
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to restore task.')
              }
            },
          },
          duration: 5000,
        })

        // Visually remove it from the list after 5 seconds
        setTimeout(() => {
          setTodos((prev) => prev.filter((t) => t.id !== todo.id || !t.completed))
        }, 5000)
      } else {
        toast.info('Task marked as active')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task.')
    }
  }

  // Delete task logic (Delete immediately, show toast with option to restore)
  const handleDelete = async (todo: Todo) => {
    try {
      await axios.delete(`${API_URL}/todos/${todo.id}`)
      setTodos((prev) => prev.filter((t) => t.id !== todo.id))
      setSelectedTodoIds((prev) => prev.filter((id) => id !== todo.id))

      toast.info('Task deleted', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              // Re-create the deleted task
              const res = await axios.post(`${API_URL}/todos`, {
                text: todo.text,
                category: todo.category,
              })
              setTodos((prev) => [res.data, ...prev])
              fetchCategories()
            } catch (err: any) {
              toast.error(err.response?.data?.message || 'Failed to restore deleted task.')
            }
          },
        },
        duration: 5000,
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete task.')
    }
  }

  // Bulk Actions
  const handleSelectToggle = (id: number) => {
    setSelectedTodoIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSelectAll = () => {
    const activeTodos = todos.filter((t) => !t.completed)
    const allSelected = activeTodos.every((t) => selectedTodoIds.includes(t.id))

    if (allSelected) {
      setSelectedTodoIds((prev) => prev.filter((id) => !activeTodos.map((t) => t.id).includes(id)))
    } else {
      setSelectedTodoIds((prev) => Array.from(new Set([...prev, ...activeTodos.map((t) => t.id)])))
    }
  }

  const handleBulkComplete = async () => {
    if (selectedTodoIds.length === 0) return
    const selectedTodos = todos.filter((t) => selectedTodoIds.includes(t.id) && !t.completed)
    if (selectedTodos.length === 0) return

    const idsToComplete = selectedTodos.map((t) => t.id)
    setSelectedTodoIds([])

    try {
      // Mark all completed in DB
      await Promise.all(idsToComplete.map((id) => axios.patch(`${API_URL}/todos/${id}`, { completed: true })))

      // Update locally
      setTodos((prev) => prev.map((t) => (idsToComplete.includes(t.id) ? { ...t, completed: true } : t)))

      toast.success(`${idsToComplete.length} tasks completed`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              // Restore all in DB
              await Promise.all(idsToComplete.map((id) => axios.patch(`${API_URL}/todos/${id}`, { completed: false })))
              fetchTodos()
            } catch (err: any) {
              toast.error('Failed to restore tasks.')
            }
          },
        },
        duration: 5000,
      })

      // Visually remove after 5 seconds
      setTimeout(() => {
        setTodos((prev) => prev.filter((t) => !idsToComplete.includes(t.id) || !t.completed))
      }, 5000)
    } catch (err) {
      console.error(err)
      toast.error('Failed to complete selected tasks.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTodoIds.length === 0) return
    const selectedTodos = todos.filter((t) => selectedTodoIds.includes(t.id))
    if (selectedTodos.length === 0) return

    const idsToDelete = selectedTodos.map((t) => t.id)
    setSelectedTodoIds([])

    try {
      // Delete all in DB
      await Promise.all(idsToDelete.map((id) => axios.delete(`${API_URL}/todos/${id}`)))

      // Update locally
      setTodos((prev) => prev.filter((t) => !idsToDelete.includes(t.id)))

      toast.info(`${idsToDelete.length} tasks deleted`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              // Re-create all deleted tasks
              await Promise.all(
                selectedTodos.map((todo) =>
                  axios.post(`${API_URL}/todos`, {
                    text: todo.text,
                    category: todo.category,
                  })
                )
              )
              fetchTodos()
              fetchCategories()
            } catch (err: any) {
              toast.error('Failed to restore deleted tasks.')
            }
          },
        },
        duration: 5000,
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete selected tasks.')
    }
  }

  const activeTodosCount = todos.filter((t) => !t.completed).length

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 p-4 md:p-10 flex flex-col items-center'>
      <div className='w-full max-w-2xl flex flex-col gap-6'>
        {/* Task Form Card */}
        <section className='bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm'>
          <TaskForm onTaskCreated={handleTaskCreated} categories={categories} />
        </section>

        {/* Filters and Bulk Actions bar */}
        <section className='flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-4 shadow-sm'>
          <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} categories={categories} />

          {/* Bulk Action Actions */}
          {activeTodosCount > 0 && (
            <div className='flex items-center gap-4 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60 dark:border-slate-800/60'>
              <button
                onClick={handleSelectAll}
                className='flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 cursor-pointer transition-colors'
              >
                {todos.filter((t) => !t.completed).every((t) => selectedTodoIds.includes(t.id)) ? (
                  <CheckSquare className='w-4 h-4 text-indigo-600 dark:text-indigo-400' />
                ) : (
                  <Square className='w-4 h-4' />
                )}
                Select All
              </button>

              {selectedTodoIds.length > 0 && (
                <div className='flex gap-2'>
                  <button
                    onClick={handleBulkComplete}
                    className='bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 hover:bg-indigo-600/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer'
                  >
                    Complete ({selectedTodoIds.length})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className='bg-red-600/10 text-red-650 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-650/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer'
                  >
                    Delete ({selectedTodoIds.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Task List container */}
        <section className='min-h-[220px]'>
          <TaskList
            todos={todos}
            isLoading={isLoading}
            error={error}
            selectedTodoIds={selectedTodoIds}
            onSelectToggle={handleSelectToggle}
            onCompleteToggle={handleCompleteToggle}
            onDelete={handleDelete}
            onEditSuccess={handleTaskCreated}
            onRetry={fetchTodos}
            selectedCategory={selectedCategory}
            categories={categories}
          />
        </section>

        {/* Floating Theme Toggle in the Top-Right Corner */}
        <div className='fixed top-6 right-6 z-50'>
          <ThemeToggle />
        </div>
      </div>

      {/* Shadcn UI / Sonner Toast Provider */}
      <Toaster
        position='bottom-right'
        closeButton
        richColors
        toastOptions={{
          classNames: {
            actionButton:
              '!bg-transparent !text-indigo-600 !dark:text-indigo-400 !hover:bg-slate-100 !dark:hover:bg-slate-800 !border-none !shadow-none font-bold text-xs rounded-lg px-2.5 py-1 transition-colors cursor-pointer',
          },
        }}
      />
    </div>
  )
}
