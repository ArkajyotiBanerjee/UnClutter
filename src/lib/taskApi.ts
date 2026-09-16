import { TaskItem, TaskFormData, Priority } from "@/types/task";

interface RawApiTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAuthenticatedTasks(): Promise<TaskItem[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) {
    const errorData: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch tasks (HTTP ${res.status})`);
  }
  const data: { tasks?: RawApiTask[] } = await res.json();
  return (data.tasks || []).map((t) => ({
    ...t,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    createdAt: new Date(t.createdAt).toISOString(),
    updatedAt: new Date(t.updatedAt).toISOString(),
  }));
}

export async function createAuthenticatedTask(data: TaskFormData): Promise<TaskItem> {
  const payload: {
    title: string;
    description: string | null;
    priority: Priority;
    dueDate?: string | null;
  } = {
    title: data.title.trim(),
    description: data.description.trim() || null,
    priority: data.priority,
  };
  if (data.dueDate) {
    payload.dueDate = data.dueDate;
  } else {
    payload.dueDate = null;
  }

  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create task (HTTP ${res.status})`);
  }

  const result: { task: RawApiTask } = await res.json();
  return {
    ...result.task,
    dueDate: result.task.dueDate ? new Date(result.task.dueDate).toISOString() : null,
    createdAt: new Date(result.task.createdAt).toISOString(),
    updatedAt: new Date(result.task.updatedAt).toISOString(),
  };
}

export async function updateAuthenticatedTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
  const payload: {
    title?: string;
    description?: string | null;
    completed?: boolean;
    priority?: Priority;
    dueDate?: string | null;
  } = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.completed !== undefined) payload.completed = updates.completed;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate;

  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update task (HTTP ${res.status})`);
  }

  const result: { task: RawApiTask } = await res.json();
  return {
    ...result.task,
    dueDate: result.task.dueDate ? new Date(result.task.dueDate).toISOString() : null,
    createdAt: new Date(result.task.createdAt).toISOString(),
    updatedAt: new Date(result.task.updatedAt).toISOString(),
  };
}

export async function deleteAuthenticatedTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete task (HTTP ${res.status})`);
  }
}
