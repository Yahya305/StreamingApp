import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const Route = createRootRoute({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </QueryClientProvider>
    ),
});
