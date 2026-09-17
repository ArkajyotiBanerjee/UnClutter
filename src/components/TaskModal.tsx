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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-[#FFFDF8] rounded-2xl border-3 border-stone-900 shadow-[6px_6px_0px_#1c1917] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b-2 border-stone-900">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full border border-stone-900 bg-amber-400" />
            <h2 className="text-base font-black text-stone-900 tracking-tight">
              {initialTask ? "Edit Task" : "Create New Task"}
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg border-2 border-transparent text-stone-600 hover:border-stone-900 hover:bg-rose-100 hover:text-rose-900 transition-all"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-bold text-rose-900 bg-rose-100 rounded-xl border-2 border-stone-900 shadow-[2px_2px_0px_#1c1917]">
              <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-stone-900 mb-1.5">
              Task Title <span className="text-rose-600">*</span>
            </label>

            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete Chapter 4 Physics Assignment"
              className="w-full px-3.5 py-2.5 text-sm font-bold bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] focus:outline-none focus:bg-amber-50 focus:shadow-[4px_4px_0px_#1c1917] transition-all placeholder:text-stone-400 text-stone-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-stone-900 mb-1.5">
              Description{" "}
              <span className="text-stone-500 font-normal lowercase">(optional)</span>
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, key links, study points..."
              className="w-full px-3.5 py-2.5 text-sm font-medium bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] focus:outline-none focus:bg-amber-50 focus:shadow-[4px_4px_0px_#1c1917] transition-all placeholder:text-stone-400 text-stone-900 resize-none"
            />
          </div>

          {/* Row: Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-900 mb-1.5">
                Priority
              </label>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border-2 border-stone-900 shadow-[2px_2px_0px_#1c1917]">
                {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-all ${priority === p
                      ? p === "HIGH"
                        ? "bg-rose-400 text-stone-900 border-stone-900 shadow-[2px_2px_0px_#1c1917]"
                        : p === "MEDIUM"
                          ? "bg-amber-400 text-stone-900 border-stone-900 shadow-[2px_2px_0px_#1c1917]"
                          : "bg-emerald-400 text-stone-900 border-stone-900 shadow-[2px_2px_0px_#1c1917]"
                      : "border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      }`}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-900 mb-1.5">
                Due Date
              </label>

              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  min={!initialTask ? minDueDate : undefined}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-bold bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] focus:outline-none focus:bg-amber-50 focus:shadow-[4px_4px_0px_#1c1917] text-stone-900"
                />
              </div>

              {!initialTask && (
                <p className="mt-1 text-[10px] font-bold text-stone-500">
                  New tasks can be due today or later.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-stone-900 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider text-stone-800 bg-white hover:bg-stone-100 border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] hover:shadow-[3px_3px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-stone-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 border-2 border-stone-900 rounded-xl shadow-[3px_3px_0px_#1c1917] hover:shadow-[4px_4px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all"
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