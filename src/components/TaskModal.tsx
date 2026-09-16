"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { Priority, TaskFormData, TaskItem } from "@/types/task";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialTask?: TaskItem | null;
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || "");
      setPriority(initialTask.priority);

      if (initialTask.dueDate) {
        // Format ISO string to YYYY-MM-DD
        const dateObj = new Date(initialTask.dueDate);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");
        setDueDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setDueDate("");
      }
    } else {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
    }

    setError(null);
    setIsSubmitting(false);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  // Used only when creating a new task.
  // The current date is allowed; past dates are not.
  const today = new Date();
  const minDueDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    // Only new tasks are restricted to today or a future date.
    // Editing an existing task allows any date.
    if (!initialTask && dueDate && dueDate < minDueDate) {
      setError("New tasks can only have a due date of today or later.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate ? dueDate : "",
      });

      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save task. Please try again.";

      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="text-base font-semibold text-stone-900">
            {initialTask ? "Edit Task" : "New Task"}
          </h2>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-lg border border-rose-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>

            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete Chapter 4 Physics Assignment"
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Description{" "}
              <span className="text-stone-400 font-normal">(optional)</span>
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, links, or notes..."
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all placeholder:text-stone-400 resize-none"
            />
          </div>

          {/* Row: Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Priority
              </label>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-lg border border-stone-200/60">
                {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1 text-xs font-medium rounded-md transition-all ${priority === p
                        ? p === "HIGH"
                          ? "bg-rose-500 text-white shadow-xs"
                          : p === "MEDIUM"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-emerald-600 text-white shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                      }`}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Due Date
              </label>

              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  min={!initialTask ? minDueDate : undefined}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 text-stone-700"
                />
              </div>

              {!initialTask && (
                <p className="mt-1 text-[10px] text-stone-400">
                  New tasks can be due today or later.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
            >
              {isSubmitting
                ? "Saving..."
                : initialTask
                  ? "Save Changes"
                  : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}