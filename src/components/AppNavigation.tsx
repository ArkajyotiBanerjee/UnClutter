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
            <aside className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 md:block">
                <nav className="flex w-[80px] flex-col items-center gap-2 rounded-2xl border-2 border-stone-900 bg-amber-50/95 p-2.5 shadow-[4px_4px_0px_#1c1917] backdrop-blur-sm">
                    {/* Top U Logo */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-stone-900 bg-stone-900 text-sm font-black text-amber-300 shadow-[2px_2px_0px_#1c1917]">
                        U
                    </div>

                    <div className="my-1.5 h-0.5 w-10 bg-stone-900" />

                    {/* Nav links */}
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
                                className={`flex min-h-[64px] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 p-1.5 transition-all ${isActive
                                    ? "border-stone-900 bg-amber-300 font-bold text-stone-900 shadow-[2px_2px_0px_#1c1917]"
                                    : "border-transparent text-stone-600 hover:border-stone-900 hover:bg-white hover:text-stone-900"
                                    }`}
                            >
                                <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
                                <span className="w-full text-center text-[10px] font-bold leading-tight tracking-tight">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Navigation */}
            <nav className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border-2 border-stone-900 bg-amber-50/95 p-2 shadow-[4px_4px_0px_#1c1917] backdrop-blur-md md:hidden">
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
                            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all ${isActive
                                ? "border-stone-900 bg-amber-300 text-stone-900 shadow-[2px_2px_0px_#1c1917]"
                                : "border-transparent text-stone-600 hover:border-stone-900 hover:bg-white hover:text-stone-900"
                                }`}
                        >
                            <Icon className="h-4 w-4" strokeWidth={2.2} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}