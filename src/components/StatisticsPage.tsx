"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Clock,
    Flag,
    RefreshCw,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { TaskItem } from "@/types/task";
import { getGuestTasks } from "@/lib/guestStorage";
import { AppNavigation } from "@/components/AppNavigation";
import { fetchAuthenticatedTasks } from "@/lib/taskApi";

export function StatisticsPage() {
    const { data: session, status: authStatus } = useSession();
    const isAuthenticated = authStatus === "authenticated" && !!session?.user;

    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTasks = useCallback(async () => {
        if (authStatus === "loading") return;

        setIsLoading(true);
        setError(null);

        try {
            if (isAuthenticated) {
                const serverTasks = await fetchAuthenticatedTasks();
                setTasks(serverTasks);
            } else {
                setTasks(getGuestTasks());
            }
        } catch (err: unknown) {
            console.error("Failed to load statistics:", err);

            const message =
                err instanceof Error
                    ? err.message
                    : "Could not load your statistics.";

            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [authStatus, isAuthenticated]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const statistics = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter((task) => task.completed).length;
        const pending = total - completed;

        const completionRate =
            total === 0 ? 0 : Math.round((completed / total) * 100);

        const high = tasks.filter((task) => task.priority === "HIGH").length;
        const medium = tasks.filter((task) => task.priority === "MEDIUM").length;
        const low = tasks.filter((task) => task.priority === "LOW").length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let overdue = 0;
        let dueToday = 0;
        let upcoming = 0;
        let noDueDate = 0;

        tasks.forEach((task) => {
            if (!task.dueDate) {
                noDueDate++;
                return;
            }

            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            if (task.completed) return;

            if (dueDate < today) {
                overdue++;
            } else if (dueDate.getTime() === today.getTime()) {
                dueToday++;
            } else {
                upcoming++;
            }
        });

        return {
            total,
            completed,
            pending,
            completionRate,
            high,
            medium,
            low,
            overdue,
            dueToday,
            upcoming,
            noDueDate,
        };
    }, [tasks]);

    const priorityTotal =
        statistics.high + statistics.medium + statistics.low;

    const getPriorityWidth = (count: number) => {
        if (priorityTotal === 0) return "0%";
        return `${Math.round((count / priorityTotal) * 100)}%`;
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-stone-900">
            <AppNavigation />
            <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white">
                            <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-stone-900">
                                Statistics
                            </h1>
                            <p className="mt-0.5 text-xs text-stone-500">
                                A simple view of your task progress.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs text-rose-700">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>

                        <button
                            type="button"
                            onClick={loadTasks}
                            className="inline-flex items-center gap-1 font-medium underline hover:text-rose-900"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="py-20 text-center">
                        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-stone-400" />
                        <p className="mt-3 text-xs text-stone-500">
                            Loading your statistics...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Overview */}
                        <section className="mb-6">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-stone-200/80 bg-white p-4">
                                    <div className="mb-2 flex items-center gap-1.5 text-stone-500">
                                        <BarChart3 className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">
                                            Total
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-stone-900">
                                        {statistics.total}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-stone-200/80 bg-white p-4">
                                    <div className="mb-2 flex items-center gap-1.5 text-amber-600">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">
                                            Pending
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-stone-900">
                                        {statistics.pending}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-stone-200/80 bg-white p-4">
                                    <div className="mb-2 flex items-center gap-1.5 text-emerald-600">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">
                                            Completed
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-stone-900">
                                        {statistics.completed}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-stone-200/80 bg-white p-4">
                                    <div className="mb-2 flex items-center gap-1.5 text-stone-500">
                                        <Flag className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">
                                            Completion
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-stone-900">
                                        {statistics.completionRate}%
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Completion Progress */}
                        <section className="mb-6 rounded-xl border border-stone-200/80 bg-white p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold text-stone-900">
                                        Completion Progress
                                    </h2>
                                    <p className="mt-0.5 text-xs text-stone-500">
                                        {statistics.completed} of {statistics.total} tasks completed
                                    </p>
                                </div>

                                <span className="text-sm font-semibold text-stone-900">
                                    {statistics.completionRate}%
                                </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                                <div
                                    className="h-full rounded-full bg-stone-900 transition-all duration-500"
                                    style={{ width: `${statistics.completionRate}%` }}
                                />
                            </div>
                        </section>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Priority */}
                            <section className="rounded-xl border border-stone-200/80 bg-white p-5">
                                <h2 className="text-sm font-semibold text-stone-900">
                                    Priority
                                </h2>
                                <p className="mt-0.5 text-xs text-stone-500">
                                    Distribution across your tasks.
                                </p>

                                <div className="mt-5 space-y-4">
                                    {[
                                        {
                                            label: "High",
                                            count: statistics.high,
                                            bar: "bg-rose-500",
                                        },
                                        {
                                            label: "Medium",
                                            count: statistics.medium,
                                            bar: "bg-amber-500",
                                        },
                                        {
                                            label: "Low",
                                            count: statistics.low,
                                            bar: "bg-emerald-600",
                                        },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <div className="mb-1.5 flex items-center justify-between text-xs">
                                                <span className="text-stone-600">{item.label}</span>
                                                <span className="font-medium text-stone-900">
                                                    {item.count}
                                                </span>
                                            </div>

                                            <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                                                <div
                                                    className={`h-full rounded-full ${item.bar}`}
                                                    style={{
                                                        width: getPriorityWidth(item.count),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Due Dates */}
                            <section className="rounded-xl border border-stone-200/80 bg-white p-5">
                                <h2 className="text-sm font-semibold text-stone-900">
                                    Due Dates
                                </h2>
                                <p className="mt-0.5 text-xs text-stone-500">
                                    Overview of your unfinished deadlines.
                                </p>

                                <div className="mt-4 divide-y divide-stone-100">
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs text-stone-600">Overdue</span>
                                        <span className="text-xs font-semibold text-rose-600">
                                            {statistics.overdue}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs text-stone-600">Due today</span>
                                        <span className="text-xs font-semibold text-amber-600">
                                            {statistics.dueToday}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs text-stone-600">Upcoming</span>
                                        <span className="text-xs font-semibold text-stone-900">
                                            {statistics.upcoming}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs text-stone-600">
                                            No due date
                                        </span>
                                        <span className="text-xs font-semibold text-stone-900">
                                            {statistics.noDueDate}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}