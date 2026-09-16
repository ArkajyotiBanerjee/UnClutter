const GUEST_STORAGE_KEY = "unclutter_guest_tasks_v1";

import { TaskItem, TaskFormData } from "@/types/task";

export function getGuestTasks(): TaskItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read guest tasks from localStorage:", err);
    return [];
  }
}

export function saveGuestTasks(tasks: TaskItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error("Failed to save guest tasks to localStorage:", err);
  }
}

export function clearGuestTasks(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear guest tasks from localStorage:", err);
  }
}

export function createGuestTask(data: TaskFormData): TaskItem {
  const now = new Date().toISOString();
  const newTask: TaskItem = {
    id: "guest_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now(),
    title: data.title.trim(),
    description: data.description.trim() || null,
    completed: false,
    priority: data.priority,
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    createdAt: now,
    updatedAt: now,
  };

  const current = getGuestTasks();
  const updated = [newTask, ...current];
  saveGuestTasks(updated);
  return newTask;
}

export function updateGuestTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
  const current = getGuestTasks();
  let updatedTask: TaskItem | null = null;

  const next = current.map((t) => {
    if (t.id === id) {
      updatedTask = {
        ...t,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedTask;
    }
    return t;
  });

  if (updatedTask) {
    saveGuestTasks(next);
  }
  return updatedTask;
}

export function deleteGuestTask(id: string): boolean {
  const current = getGuestTasks();
  const next = current.filter((t) => t.id !== id);
  saveGuestTasks(next);
  return next.length !== current.length;
}
