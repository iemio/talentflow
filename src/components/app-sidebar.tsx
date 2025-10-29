import * as React from "react";
import { ClipboardList, Home, Briefcase, Users } from "lucide-react";
import { useLocation } from "react-router";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar";

const navigation = [
    {
        title: "Dashboard",
        url: "/",
        icon: Home,
    },
    {
        title: "Jobs",
        url: "/jobs",
        icon: Briefcase,
    },
    {
        title: "Candidates",
        url: "/candidates",
        icon: Users,
    },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation();

    return (
        <Sidebar variant="floating" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/">
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <ClipboardList className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">
                                        TalentFlow
                                    </span>
                                    <span className="text-xs">v1.0.0</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu className="gap-1">
                        {navigation.map((item) => {
                            const isActive =
                                location.pathname === item.url ||
                                (item.url !== "/" &&
                                    location.pathname.startsWith(item.url));
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={item.title}
                                    >
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <div className="px-4 py-2">
                    <p className="text-xs text-muted-foreground">
                        © 2025 TalentFlow
                    </p>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
