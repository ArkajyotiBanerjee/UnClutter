"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard } from "lucide-react";

const navigationItems = [
    {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/statistics",
        label: "Statistics",
        icon: BarChart3,
    },
];

export function AppNavigation() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Navigation */}
            <aside className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 md:block">
                <nav className="flex w-[72px] flex-col items-center gap-2 rounded-2xl border border-stone-200/80 bg-white/90 p-2 shadow-sm backdrop-blur-md">
                    <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-sm font-semibold text-white">
                        U
                    </div>

                    <div className="my-1 h-px w-8 bg-stone-200" />

                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.label}
                                className={`flex min-h-[58px] w-14 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 transition-colors ${isActive
                                    ? "bg-stone-900 text-white"
                                    : "text-stone-400 hover:bg-stone-100 hover:text-stone-800"
                                    }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                                <span className="w-full text-center text-[9px] font-medium leading-tight whitespace-nowrap">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Navigation */}
            <nav className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-stone-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur-md md:hidden">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${isActive
                                ? "bg-stone-900 text-white"
                                : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                                }`}
                        >
                            <Icon className="h-4 w-4" strokeWidth={1.8} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}