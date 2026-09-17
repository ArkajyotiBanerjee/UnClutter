"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Priority, TaskItem } from "@/types/task";

interface TaskRowProps {
  task: TaskItem;
  onToggleComplete: (id: string, current: boolean) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
}

export function TaskRow({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const priorityStyles: Record<
    Priority,
    { label: string; badge: string; dot: string }
  > = {
    LOW: {
      label: "Low",
      badge: "bg-emerald-100 text-emerald-900 border-2 border-stone-900",
      dot: "bg-emerald-500",
    },
    MEDIUM: {
      label: "Medium",
      badge: "bg-amber-100 text-amber-900 border-2 border-stone-900",
      dot: "bg-amber-500",
    },
    HIGH: {
      label: "High",
      badge: "bg-rose-100 text-rose-900 border-2 border-stone-900",
      dot: "bg-rose-500",
    },
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return {
        text: "Today",
        isOverdue: false,
        isToday: true,
      };
    }

    if (diffDays === 1) {
      return {
        text: "Tomorrow",
        isOverdue: false,
        isToday: false,
      };
    }

    if (diffDays === -1) {
      return {
        text: "Yesterday",
        isOverdue: true,
        isToday: false,
      };
    }

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        isOverdue: true,
        isToday: false,
      };
    }

    return {
      text: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      isOverdue: false,
      isToday: false,
    };
  };

  const dueInfo = formatDueDate(task.dueDate);

  return (
    <div
      className={`group relative flex items-start gap-4 p-4 sm:px-5 sm:py-4 bg-white border-2 border-stone-900 rounded-xl transition-all shadow-[3px_3px_0px_#1c1917] hover:shadow-[5px_5px_0px_#1c1917] hover:-translate-x-0.5 hover:-translate-y-0.5 ${menuOpen ? "z-30" : "z-0"
        } ${task.completed ? "bg-stone-100/90 opacity-80" : ""}`}
    >
      {/* Completion Checkbox */}
      <button
        type="button"
        onClick={() => onToggleComplete(task.id, task.completed)}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-stone-900 transition-all ${task.completed
          ? "bg-emerald-400 text-stone-900 shadow-[1px_1px_0px_#1c1917]"
          : "bg-white hover:bg-amber-100 hover:shadow-[1px_1px_0px_#1c1917]"
          }`}
      >
        {task.completed && <Check className="h-3.5 w-3.5 stroke-[3.5]" />}
      </button>

      {/* Task Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`text-sm sm:text-base font-bold tracking-tight transition-all break-words ${task.completed
              ? "text-stone-400 line-through font-medium"
              : "text-stone-900"
              }`}
          >
            {task.title}
          </span>

          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityStyles[task.priority].badge}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full border border-stone-900 ${priorityStyles[task.priority].dot}`}
            />
            {priorityStyles[task.priority].label}
          </span>
        </div>

        {/* Description Preview */}
        {task.description && (
          <p
            className={`mt-1 text-xs text-stone-600 line-clamp-2 break-words font-medium ${task.completed ? "text-stone-400 line-through" : ""
              }`}
          >
            {task.description}
          </p>
        )}

        {/* Due Date Indicator */}
        {dueInfo && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border-2 border-stone-900 ${task.completed
                ? "bg-stone-200 text-stone-500"
                : dueInfo.isOverdue
                  ? "bg-rose-200 text-rose-900 shadow-[1px_1px_0px_#1c1917]"
                  : dueInfo.isToday
                    ? "bg-amber-200 text-amber-900 shadow-[1px_1px_0px_#1c1917]"
                    : "bg-stone-100 text-stone-700"
                }`}
            >
              <Calendar className="w-3 h-3 stroke-[2.5]" />
              {dueInfo.text}
            </span>
          </div>
        )}
      </div>

      {/* Actions Menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 rounded-lg border-2 border-transparent text-stone-600 hover:border-stone-900 hover:bg-amber-100 hover:text-stone-900 hover:shadow-[2px_2px_0px_#1c1917] transition-all"
          aria-label="Task options"
        >
          <MoreVertical className="w-4 h-4 stroke-[2.5]" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-white border-2 border-stone-900 shadow-[4px_4px_0px_#1c1917] py-1.5 z-20 text-xs font-bold text-stone-900 overflow-hidden">
            {/* Complete / Incomplete */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onToggleComplete(task.id, task.completed);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-amber-100 text-stone-900 transition-colors"
            >
              <Check className="w-4 h-4 stroke-[2.5] text-stone-700" />
              {task.completed ? "Mark incomplete" : "Mark complete"}
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(task);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-amber-100 text-stone-900 transition-colors"
            >
              <Pencil className="w-4 h-4 stroke-[2.5] text-stone-700" />
              Edit
            </button>

            <div className="my-1 border-t-2 border-stone-900" />

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete(task.id);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-rose-100 text-rose-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5] text-rose-600" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}