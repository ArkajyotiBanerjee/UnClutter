"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { AppNavigation } from "@/components/AppNavigation";
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  ListTodo,
  LogOut,
  LogIn,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Priority, TaskFormData, TaskItem } from "@/types/task";
import {
  getGuestTasks,
  createGuestTask,
  updateGuestTask,
  deleteGuestTask,
  clearGuestTasks,
} from "@/lib/guestStorage";
import {
  fetchAuthenticatedTasks,
  createAuthenticatedTask,
  updateAuthenticatedTask,
  deleteAuthenticatedTask,
} from "@/lib/taskApi";
import { TaskRow } from "@/components/TaskRow";
import { TaskModal } from "@/components/TaskModal";

export function UnClutterApp() {
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated" && !!session?.user;

  // Task State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "ALL">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // 1. Initial Loading & Guest Migration Effect
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (authStatus === "loading") {
        return; // wait for session status resolution
      }

      if (isAuthenticated) {
        // Authenticated mode: check for guest tasks to migrate
        const guestTasks = getGuestTasks();
        if (guestTasks.length > 0) {
          try {
            // Migrate guest tasks sequentially to authenticated backend
            for (const gt of guestTasks) {
              await createAuthenticatedTask({
                title: gt.title,
                description: gt.description || "",
                priority: gt.priority,
                dueDate: gt.dueDate ? gt.dueDate.slice(0, 10) : "",
              });
            }
            clearGuestTasks();
          } catch (migrationErr) {
            console.warn("Guest task migration encountered an issue:", migrationErr);
          }
        }

        // Fetch fresh authenticated tasks from DB
        const serverTasks = await fetchAuthenticatedTasks();
        setTasks(serverTasks);
      } else {
        // Guest mode: load from localStorage
        const localTasks = getGuestTasks();
        setTasks(localTasks);
      }
    } catch (err: unknown) {
      console.error("Failed to load tasks:", err);
      const msg = err instanceof Error ? err.message : "Could not load tasks.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [authStatus, isAuthenticated]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 2. Computed Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  // 3. Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Tab filter
      if (activeTab === "PENDING" && t.completed) return false;
      if (activeTab === "COMPLETED" && !t.completed) return false;

      // Priority filter
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [tasks, activeTab, priorityFilter, searchQuery]);

  // 4. Task Operations
  const handleCreateOrEditTask = async (data: TaskFormData) => {
    if (editingTask) {
      // Edit
      if (isAuthenticated) {
        const updated = await updateAuthenticatedTask(editingTask.id, {
          title: data.title,
          description: data.description || null,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        });
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const updated = updateGuestTask(editingTask.id, {
          title: data.title,
          description: data.description || null,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        });
        if (updated) {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }
      }
    } else {
      // Create
      if (isAuthenticated) {
        const created = await createAuthenticatedTask(data);
        setTasks((prev) => [created, ...prev]);
      } else {
        const created = createGuestTask(data);
        setTasks((prev) => [created, ...prev]);
      }
    }
  };

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newStatus } : t))
    );

    try {
      if (isAuthenticated) {
        await updateAuthenticatedTask(id, { completed: newStatus });
      } else {
        updateGuestTask(id, { completed: newStatus });
      }
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: currentStatus } : t))
      );
      setError("Failed to update task status. Please try again.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    // Optimistic UI update
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      if (isAuthenticated) {
        await deleteAuthenticatedTask(id);
      } else {
        deleteGuestTask(id);
      }
    } catch {
      setTasks(previous);
      setError("Failed to delete task. Please try again.");
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 selection:bg-stone-200">
      <AppNavigation />
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
              U
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-stone-900 block leading-tight">
                UnClutter
              </span>
              <span className="text-[10px] text-stone-500 block leading-tight font-normal">
                Focused Student Tasks
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xs relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 placeholder:text-stone-400 text-stone-800 transition-all"
            />
          </div>

          {/* User Status / Auth CTA */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="block text-xs font-medium text-stone-800 leading-tight">
                    {session?.user?.name || "Student"}
                  </span>
                  <span className="block text-[10px] text-emerald-600 font-normal leading-tight">
                    Syncing to Cloud
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Sign out"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-lg border border-stone-200/80 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-stone-400" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 rounded-lg border border-stone-200 shadow-2xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-stone-500" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        {/* Context Greeting & Main Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">
              {isAuthenticated
                ? `Welcome back, ${session?.user?.name?.split(" ")[0] || "Student"}`
                : "Welcome to UnClutter"}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {isAuthenticated
                ? "Your tasks are saved securely to your account."
                : "Using guest mode. Your tasks are saved locally on this browser."}
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Search for Mobile */}
        <div className="relative mb-6 sm:hidden">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 text-stone-800"
          />
        </div>

        {/* 3 Compact Stat Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-stone-500 mb-1">
              <ListTodo className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-bold text-stone-900">{stats.total}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-amber-600 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Pending</span>
            </div>
            <span className="text-xl font-bold text-stone-900">{stats.pending}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Completed</span>
            </div>
            <span className="text-xl font-bold text-stone-900">{stats.completed}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-200/60">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200/70">
            {(["ALL", "PENDING", "COMPLETED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === tab
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800"
                  }`}
              >
                {tab === "ALL" ? "All" : tab === "PENDING" ? "Pending" : "Completed"}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              Priority:
            </span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | "ALL")}
              className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-4 flex items-center justify-between p-3.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadTasks}
              className="inline-flex items-center gap-1 font-medium underline hover:text-rose-900"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Task List / States */}
        <div className="flex-1 space-y-2.5">
          {isLoading ? (
            /* Loading State */
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-5 h-5 text-stone-400 animate-spin mx-auto" />
              <p className="text-xs text-stone-500">Loading your tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 bg-white/50 p-8">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
                <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-semibold text-stone-800">
                {searchQuery || priorityFilter !== "ALL" || activeTab !== "ALL"
                  ? "No tasks match your filters"
                  : "All clear! No tasks on your list"}
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                {searchQuery || priorityFilter !== "ALL" || activeTab !== "ALL"
                  ? "Try resetting your search query or adjusting your priority filters."
                  : "Capture assignments, deadlines, and study goals in one uncluttered space."}
              </p>
              {!searchQuery && priorityFilter === "ALL" && activeTab === "ALL" && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Task
                </button>
              )}
            </div>
          ) : (
            /* Task Rows */
            filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={openEditModal}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>
      </main>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrEditTask}
        initialTask={editingTask}
      />
    </div>
  );
}
