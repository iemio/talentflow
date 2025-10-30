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
import { useLocation } from "react-router";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import React, { useMemo, memo, useCallback } from "react";
import AnimatedOutlet from "@/components/animated-outlet";

const routeTitles: Record<string, { title: string; parent?: string }> = {
    "/": { title: "Dashboard" },
    "/jobs": { title: "Jobs" },
    "/candidates": { title: "Candidates" },
    "/assessments": { title: "Assessments" },
};

// Memoized breadcrumb item to prevent unnecessary re-renders
const BreadcrumbItemMemo = memo(
    ({
        crumb,
        showSeparator,
    }: {
        crumb: { title: string; href: string; isLast: boolean };
        showSeparator: boolean;
    }) => (
        <>
            {showSeparator && <BreadcrumbSeparator />}
            <BreadcrumbItem>
                {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                ) : (
                    <BreadcrumbLink href={crumb.href}>
                        {crumb.title}
                    </BreadcrumbLink>
                )}
            </BreadcrumbItem>
        </>
    )
);

BreadcrumbItemMemo.displayName = "BreadcrumbItemMemo";

// Memoized header component
const LayoutHeader = memo(
    ({
        breadcrumbs,
    }: {
        breadcrumbs: Array<{ title: string; href: string; isLast: boolean }>;
    }) => {
        return (
            <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                            <BreadcrumbItemMemo
                                key={crumb.href}
                                crumb={crumb}
                                showSeparator={index > 0}
                            />
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto">
                    <ThemeToggle />
                </div>
            </header>
        );
    }
);

LayoutHeader.displayName = "LayoutHeader";

// Memoize the entire layout to prevent re-renders
const MainLayout = memo(() => {
    const location = useLocation();

    // Memoize breadcrumbs calculation - only recalculates when pathname changes
    const breadcrumbs = useMemo(() => {
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
    }, [location.pathname]);

    // Memoize the style object to prevent re-creation
    const sidebarStyle = useMemo(
        () =>
            ({
                "--sidebar-width": "19rem",
            } as React.CSSProperties),
        []
    );

    return (
        <SidebarProvider style={sidebarStyle}>
            <AppSidebar />
            <SidebarInset>
                <LayoutHeader breadcrumbs={breadcrumbs} />
                <div className="flex flex-1 flex-col">
                    <AnimatedOutlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
});

MainLayout.displayName = "MainLayout";

export default MainLayout;
