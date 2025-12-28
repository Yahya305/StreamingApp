import { Link } from "@tanstack/react-router";
import {
    Home,
    Compass,
    PlaySquare,
    Clock,
    ThumbsUp,
    Library,
} from "lucide-react";

const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: PlaySquare, label: "Subscriptions", href: "/subscriptions" },
];

const libraryItems = [
    { icon: Library, label: "Library", href: "/library" },
    { icon: Clock, label: "History", href: "/history" },
    { icon: ThumbsUp, label: "Liked Videos", href: "/liked" },
];

export function Sidebar() {
    return (
        <aside className="w-64 border-r border-border hidden lg:flex flex-col bg-background overflow-y-auto">
            <div className="p-4 space-y-6">
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.href}
                            className="flex items-center gap-4 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors [&.active]:bg-accent"
                            activeProps={{ className: "active" }}
                        >
                            <item.icon className="w-5 h-5 text-muted-foreground" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="h-px bg-border" />

                <div className="space-y-1">
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Library
                    </h3>
                    {libraryItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.href}
                            className="flex items-center gap-4 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors [&.active]:bg-accent"
                        >
                            <item.icon className="w-5 h-5 text-muted-foreground" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
}
