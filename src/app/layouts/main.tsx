import { Outlet, Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { Briefcase, Users, ClipboardList, Home } from "lucide-react";

export default function MainLayout() {
    const location = useLocation();

    const navigation = [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Jobs", href: "/jobs", icon: Briefcase },
        { name: "Candidates", href: "/candidates", icon: Users },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
                        <ClipboardList className="w-8 h-8 text-blue-600" />
                        <span className="text-xl font-bold text-gray-900">
                            TalentFlow
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const isActive =
                                location.pathname === item.href ||
                                (item.href !== "/" &&
                                    location.pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-700 hover:bg-gray-100"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="px-4 py-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            © 2025 TalentFlow
                        </p>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="pl-64">
                <main className="min-h-screen">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
