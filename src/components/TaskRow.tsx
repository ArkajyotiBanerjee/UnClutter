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
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      dot: "bg-emerald-500",
    },
    MEDIUM: {
      label: "Medium",
      badge: "bg-amber-50 text-amber-700 border-amber-100",
      dot: "bg-amber-500",
    },
    HIGH: {
      label: "High",
      badge: "bg-rose-50 text-rose-700 border-rose-100",
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
      className={`group relative flex items-start gap-3.5 p-3.5 sm:px-4 sm:py-3.5 bg-white border border-stone-200/80 rounded-xl transition-all hover:border-stone-300 hover:shadow-xs ${menuOpen
          ? "z-30"
          : "z-0"
        } ${task.completed ? "bg-stone-50/60 opacity-70" : ""
        }`}
    >
      {/* Completion Checkbox */}
      <button
        type="button"
        onClick={() => onToggleComplete(task.id, task.completed)}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${task.completed
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-stone-300 bg-white hover:border-stone-400 focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
          }`}
      >
        {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
      </button>

      {/* Task Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium tracking-tight transition-all break-words ${task.completed
              ? "text-stone-400 line-through font-normal"
              : "text-stone-800"
              }`}
          >
            {task.title}
          </span>

          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityStyles[task.priority].badge}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${priorityStyles[task.priority].dot}`}
            />
            {priorityStyles[task.priority].label}
          </span>
        </div>

        {/* Description Preview */}
        {task.description && (
          <p
            className={`mt-1 text-xs text-stone-500 line-clamp-1 break-words ${task.completed ? "text-stone-400" : ""
              }`}
          >
            {task.description}
          </p>
        )}

        {/* Due Date Indicator */}
        {dueInfo && (
          <div className="mt-2 flex items-center gap-1 text-[11px]">
            <Calendar
              className={`w-3 h-3 ${task.completed
                ? "text-stone-400"
                : dueInfo.isOverdue
                  ? "text-rose-500"
                  : dueInfo.isToday
                    ? "text-amber-600"
                    : "text-stone-400"
                }`}
            />

            <span
              className={
                task.completed
                  ? "text-stone-400"
                  : dueInfo.isOverdue
                    ? "text-rose-600 font-medium"
                    : dueInfo.isToday
                      ? "text-amber-700 font-medium"
                      : "text-stone-500"
              }
            >
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
          className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          aria-label="Task options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 rounded-lg bg-white shadow-lg border border-stone-100 py-1 z-20 text-xs text-stone-700">
            {/* Complete / Incomplete */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onToggleComplete(task.id, task.completed);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-stone-50 text-stone-700 transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-stone-400" />
              {task.completed ? "Mark incomplete" : "Mark complete"}
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(task);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-stone-50 text-stone-700 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-stone-400" />
              Edit
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete(task.id);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-rose-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}