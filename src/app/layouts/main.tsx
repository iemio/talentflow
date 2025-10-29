import { AppSidebar } from "@/components/app-sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Outlet, useLocation } from "react-router";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import React from "react";

const routeTitles: Record<string, { title: string; parent?: string }> = {
    "/": { title: "Dashboard" },
    "/jobs": { title: "Jobs" },
    "/candidates": { title: "Candidates" },
};

export default function MainLayout() {
    const location = useLocation();

    // Get current route info
    const currentRoute = routeTitles[location.pathname] || { title: "Page" };

    // Function to generate breadcrumbs based on path
    const getBreadcrumbs = () => {
        const path = location.pathname;

        // Home/Dashboard
        if (path === "/") {
            return [{ title: "Dashboard", href: "/", isLast: true }];
        }

        // Other routes
        const segments = path.split("/").filter(Boolean);
        const breadcrumbs = [{ title: "Dashboard", href: "/", isLast: false }];

        let currentPath = "";
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === segments.length - 1;
            const title =
                routeTitles[currentPath]?.title ||
                segment.charAt(0).toUpperCase() + segment.slice(1);
            breadcrumbs.push({
                title,
                href: currentPath,
                isLast,
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "19rem",
                } as React.CSSProperties
            }
        >
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.href}>
                                    {index > 0 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        {crumb.isLast ? (
                                            <BreadcrumbPage>
                                                {crumb.title}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={crumb.href}>
                                                {crumb.title}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </header>
                <div className="flex flex-1 flex-col">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
