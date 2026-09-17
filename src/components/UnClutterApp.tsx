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
    <div className="relative z-10 min-h-screen flex flex-col text-stone-900 selection:bg-amber-300">
      <AppNavigation />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-amber-50/90 backdrop-blur-md border-b-2 border-stone-900 shadow-[0_2px_0px_#1c1917]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-stone-900 border-2 border-stone-900 flex items-center justify-center text-amber-300 font-black text-base shadow-[2px_2px_0px_#1c1917]">
              U
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-stone-900 block leading-none">
                UnClutter
              </span>
              <span className="text-[10px] text-stone-600 block leading-tight font-bold tracking-wide uppercase mt-0.5">
                Student Task Flow
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xs relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 stroke-[2.5]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] focus:outline-none focus:bg-amber-50 focus:shadow-[3px_3px_0px_#1c1917] placeholder:text-stone-400 text-stone-900 transition-all"
            />
          </div>

          {/* User Status / Auth CTA */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="block text-xs font-black text-stone-900 leading-tight">
                    {session?.user?.name || "Student"}
                  </span>
                  <span className="block text-[10px] text-emerald-700 font-bold uppercase tracking-wider leading-tight">
                    • Cloud Synced
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Sign out"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-900 bg-white hover:bg-stone-100 rounded-xl border-2 border-stone-900 shadow-[2px_2px_0px_#1c1917] hover:shadow-[3px_3px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5 text-stone-700 stroke-[2.5]" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-black text-stone-900 bg-amber-300 hover:bg-amber-200 rounded-xl border-2 border-stone-900 shadow-[3px_3px_0px_#1c1917] hover:shadow-[4px_4px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-stone-900 stroke-[2.5]" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        {/* Context Greeting & Main Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 bg-white p-5 rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0px_#1c1917]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 border border-stone-900" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900">
                {isAuthenticated
                  ? `Welcome, ${session?.user?.name?.split(" ")[0] || "Student"}`
                  : "Welcome to UnClutter"}
              </h1>
            </div>
            <p className="text-xs font-medium text-stone-600 mt-1 pl-4.5">
              {isAuthenticated
                ? "Your tasks are actively persisted to your cloud account."
                : "Guest Mode active. All tasks are saved locally on this browser."}
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-xl border-2 border-stone-900 shadow-[3px_3px_0px_#1c1917] hover:shadow-[4px_4px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Search for Mobile */}
        <div className="relative mb-6 sm:hidden">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 stroke-[2.5]" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] focus:outline-none focus:bg-amber-50 text-stone-900"
          />
        </div>

        {/* 3 Compact Neo-Brutalist Stat Cards */}
        <div className="grid grid-cols-3 gap-3.5 mb-8">
          <div className="bg-white p-4 rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0px_#1c1917] flex flex-col">
            <div className="flex items-center gap-1.5 text-stone-700 mb-1">
              <ListTodo className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase tracking-wider">Total</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-stone-900">{stats.total}</span>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0px_#1c1917] flex flex-col">
            <div className="flex items-center gap-1.5 text-amber-900 mb-1">
              <Clock className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase tracking-wider">Pending</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-stone-900">{stats.pending}</span>
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0px_#1c1917] flex flex-col">
            <div className="flex items-center gap-1.5 text-emerald-900 mb-1">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase tracking-wider">Done</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-stone-900">{stats.completed}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-3 border-b-2 border-stone-900/40">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-stone-200/80 p-1.5 rounded-xl border-2 border-stone-900 shadow-[2px_2px_0px_#1c1917]">
            {(["ALL", "PENDING", "COMPLETED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-all ${
                  activeTab === tab
                    ? "bg-amber-300 text-stone-900 border-stone-900 shadow-[2px_2px_0px_#1c1917]"
                    : "border-transparent text-stone-600 hover:text-stone-900 hover:bg-white/60"
                }`}
              >
                {tab === "ALL" ? "All" : tab === "PENDING" ? "Pending" : "Completed"}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
              Priority:
            </span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | "ALL")}
              className="text-xs font-bold bg-white border-2 border-stone-900 rounded-xl px-3 py-1.5 text-stone-900 shadow-[2px_2px_0px_#1c1917] focus:outline-none focus:bg-amber-50"
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
          <div className="mb-5 flex items-center justify-between p-4 text-xs font-bold text-rose-900 bg-rose-100 border-2 border-stone-900 rounded-2xl shadow-[3px_3px_0px_#1c1917]">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 stroke-[2.5]" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadTasks}
              className="inline-flex items-center gap-1.5 font-black uppercase underline hover:text-rose-950"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" /> Retry
            </button>
          </div>
        )}

        {/* Task List / States */}
        <div className="flex-1 space-y-3">
          {isLoading ? (
            /* Loading State */
            <div className="py-20 text-center space-y-3 bg-white/80 rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0px_#1c1917]">
              <RefreshCw className="w-6 h-6 text-stone-900 animate-spin mx-auto stroke-[2.5]" />
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center rounded-2xl border-2 border-dashed border-stone-900 bg-white/80 p-8 shadow-[4px_4px_0px_#1c1917]">
              <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2 border-stone-900 flex items-center justify-center text-stone-900 shadow-[2px_2px_0px_#1c1917] mx-auto mb-3.5">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-stone-900">
                {searchQuery || priorityFilter !== "ALL" || activeTab !== "ALL"
                  ? "No tasks match your filter criteria"
                  : "Desk is Clear! No tasks on your list"}
              </h3>
              <p className="text-xs font-medium text-stone-600 mt-1 max-w-sm mx-auto">
                {searchQuery || priorityFilter !== "ALL" || activeTab !== "ALL"
                  ? "Try resetting your search query or adjusting your priority filters."
                  : "Capture assignments, deadlines, and study goals in one uncluttered space."}
              </p>
              {!searchQuery && priorityFilter === "ALL" && activeTab === "ALL" && (
                <button
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-xl border-2 border-stone-900 shadow-[3px_3px_0px_#1c1917] hover:shadow-[4px_4px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
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
