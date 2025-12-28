import { Link } from "@tanstack/react-router";
import { Menu, Search, Upload, Video, Bell, User } from "lucide-react";

export function Header() {
    return (
        <header className="h-14 px-4 flex items-center justify-between bg-background border-b border-border sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-accent rounded-full lg:hidden">
                    <Menu className="w-6 h-6" />
                </button>
                <Link to="/" className="flex items-center gap-1 group">
                    <div className="bg-primary p-1 rounded-lg group-hover:bg-primary/90 transition-colors">
                        <Video className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold tracking-tight hidden sm:block">
                        StreamApp
                    </span>
                </Link>
            </div>

            <div className="flex-1 max-w-2xl px-4 hidden md:block">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search videos..."
                        className="block w-full pl-10 pr-3 py-2 border border-border rounded-full bg-secondary/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <Link
                    to="/upload"
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Upload</span>
                </Link>
                <button className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors">
                    <Bell className="w-5 h-5" />
                </button>
                <button className="p-1 border border-border rounded-full hover:bg-accent transition-colors">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                </button>
            </div>
        </header>
    );
}
