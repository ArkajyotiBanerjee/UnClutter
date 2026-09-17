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
        <div className="relative z-10 min-h-screen text-stone-900 selection:bg-amber-300">
            <AppNavigation />
            <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
                {/* Header */}
                <div className="mb-8 bg-white p-5 rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0px_#1c1917]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 border-2 border-stone-900 text-stone-900 shadow-[2px_2px_0px_#1c1917]">
                            <BarChart3 className="h-5 w-5 stroke-[2.5]" />
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900">
                                Productivity Overview
                            </h1>
                            <p className="mt-0.5 text-xs font-bold text-stone-600 uppercase tracking-wider">
                                Task metrics and progress breakdown
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center justify-between rounded-2xl border-2 border-stone-900 bg-rose-100 p-4 text-xs font-bold text-rose-900 shadow-[3px_3px_0px_#1c1917]">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="h-5 w-5 shrink-0 stroke-[2.5]" />
                            <span>{error}</span>
                        </div>

                        <button
                            type="button"
                            onClick={loadTasks}
                            className="inline-flex items-center gap-1.5 font-black uppercase underline hover:text-rose-950"
                        >
                            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
                            Retry
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="py-20 text-center bg-white/80 rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0px_#1c1917]">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-stone-900 stroke-[2.5]" />
                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-600">
                            Loading statistics...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Overview */}
                        <section className="mb-6">
                            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                                <div className="rounded-2xl border-2 border-stone-900 bg-white p-4 shadow-[4px_4px_0px_#1c1917]">
                                    <div className="mb-2 flex items-center gap-1.5 text-stone-700">
                                        <BarChart3 className="h-4 w-4 stroke-[2.5]" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                            Total
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-stone-900">
                                        {statistics.total}
                                    </p>
                                </div>

                                <div className="rounded-2xl border-2 border-stone-900 bg-amber-50 p-4 shadow-[4px_4px_0px_#1c1917]">
                                    <div className="mb-2 flex items-center gap-1.5 text-amber-900">
                                        <Clock className="h-4 w-4 stroke-[2.5]" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                            Pending
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-stone-900">
                                        {statistics.pending}
                                    </p>
                                </div>

                                <div className="rounded-2xl border-2 border-stone-900 bg-emerald-50 p-4 shadow-[4px_4px_0px_#1c1917]">
                                    <div className="mb-2 flex items-center gap-1.5 text-emerald-900">
                                        <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                            Completed
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-stone-900">
                                        {statistics.completed}
                                    </p>
                                </div>

                                <div className="rounded-2xl border-2 border-stone-900 bg-amber-300 p-4 shadow-[4px_4px_0px_#1c1917]">
                                    <div className="mb-2 flex items-center gap-1.5 text-stone-900">
                                        <Flag className="h-4 w-4 stroke-[2.5]" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                            Rate
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-stone-900">
                                        {statistics.completionRate}%
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Completion Progress */}
                        <section className="mb-6 rounded-2xl border-2 border-stone-900 bg-white p-5 shadow-[4px_4px_0px_#1c1917]">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wider text-stone-900">
                                        Completion Rate
                                    </h2>
                                    <p className="mt-0.5 text-xs font-medium text-stone-600">
                                        {statistics.completed} of {statistics.total} tasks completed
                                    </p>
                                </div>

                                <span className="text-lg font-black text-stone-900 bg-amber-300 px-2.5 py-0.5 rounded-lg border-2 border-stone-900 shadow-[2px_2px_0px_#1c1917]">
                                    {statistics.completionRate}%
                                </span>
                            </div>

                            <div className="h-4 overflow-hidden rounded-xl bg-stone-200 border-2 border-stone-900 shadow-[inset_1px_1px_0px_#1c1917]">
                                <div
                                    className="h-full bg-emerald-400 border-r-2 border-stone-900 transition-all duration-500"
                                    style={{ width: `${statistics.completionRate}%` }}
                                />
                            </div>
                        </section>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Priority */}
                            <section className="rounded-2xl border-2 border-stone-900 bg-white p-5 shadow-[4px_4px_0px_#1c1917]">
                                <h2 className="text-sm font-black uppercase tracking-wider text-stone-900">
                                    Priority Breakdown
                                </h2>
                                <p className="mt-0.5 text-xs font-medium text-stone-600">
                                    Distribution across your tasks.
                                </p>

                                <div className="mt-5 space-y-4">
                                    {[
                                        {
                                            label: "High Priority",
                                            count: statistics.high,
                                            bar: "bg-rose-400",
                                            badge: "bg-rose-100 text-rose-900",
                                        },
                                        {
                                            label: "Medium Priority",
                                            count: statistics.medium,
                                            bar: "bg-amber-400",
                                            badge: "bg-amber-100 text-amber-900",
                                        },
                                        {
                                            label: "Low Priority",
                                            count: statistics.low,
                                            bar: "bg-emerald-400",
                                            badge: "bg-emerald-100 text-emerald-900",
                                        },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                                                <span className="text-stone-800">{item.label}</span>
                                                <span className={`px-2 py-0.5 rounded-md border-2 border-stone-900 text-[10px] font-black ${item.badge}`}>
                                                    {item.count}
                                                </span>
                                            </div>

                                            <div className="h-3 overflow-hidden rounded-lg bg-stone-200 border-2 border-stone-900 shadow-[inset_1px_1px_0px_#1c1917]">
                                                <div
                                                    className={`h-full border-r-2 border-stone-900 ${item.bar}`}
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
                            <section className="rounded-2xl border-2 border-stone-900 bg-white p-5 shadow-[4px_4px_0px_#1c1917]">
                                <h2 className="text-sm font-black uppercase tracking-wider text-stone-900">
                                    Upcoming Deadlines
                                </h2>
                                <p className="mt-0.5 text-xs font-medium text-stone-600">
                                    Overview of your pending tasks.
                                </p>

                                <div className="mt-4 divide-y-2 divide-stone-900/10">
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs font-bold text-stone-700">Overdue</span>
                                        <span className="px-2 py-0.5 rounded-md border-2 border-stone-900 bg-rose-200 text-rose-900 text-xs font-black shadow-[1px_1px_0px_#1c1917]">
                                            {statistics.overdue}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs font-bold text-stone-700">Due Today</span>
                                        <span className="px-2 py-0.5 rounded-md border-2 border-stone-900 bg-amber-200 text-amber-900 text-xs font-black shadow-[1px_1px_0px_#1c1917]">
                                            {statistics.dueToday}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs font-bold text-stone-700">Upcoming</span>
                                        <span className="px-2 py-0.5 rounded-md border-2 border-stone-900 bg-stone-100 text-stone-900 text-xs font-black">
                                            {statistics.upcoming}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs font-bold text-stone-700">
                                            No Due Date
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md border-2 border-stone-900 bg-stone-100 text-stone-900 text-xs font-black">
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