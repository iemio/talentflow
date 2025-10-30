import * as React from "react";
import { ClipboardList, Home, Briefcase, Users } from "lucide-react";
import { useLocation } from "react-router";
import { motion, type Variants } from "framer-motion";

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
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Jobs", url: "/jobs", icon: Briefcase },
    { title: "Candidates", url: "/candidates", icon: Users },
    { title: "Assessments", url: "/assessments", icon: ClipboardList },
];

const sidebarVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.3, ease: "easeOut" },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05, duration: 0.25, ease: "easeOut" },
    }),
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation();

    return (
        <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            className="h-full"
        >
            <Sidebar variant="floating" {...props}>
                {/* --- HEADER --- */}
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                className="flex items-center justify-center gap-3 w-full hover:bg-transparent hover:text-sidebar-accent-background transition-all duration-200"
                                asChild
                            >
                                <a href="/">
                                    <motion.div
                                        whileHover={{ rotate: 5, scale: 1.05 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 15,
                                        }}
                                        className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                                    >
                                        <ClipboardList className="size-4" />
                                    </motion.div>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span className="font-semibold">
                                            TalentFlow
                                        </span>
                                    </div>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                {/* --- CONTENT --- */}
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarMenu className="gap-1">
                            {navigation.map((item, i) => {
                                const isActive =
                                    location.pathname === item.url ||
                                    (item.url !== "/" &&
                                        location.pathname.startsWith(item.url));
                                return (
                                    <motion.div
                                        key={item.title}
                                        custom={i}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        <SidebarMenuItem>
                                            <motion.div
                                                whileHover={{
                                                    scale: 1.02,
                                                }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: "easeOut",
                                                }}
                                            >
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    className={`border-b mb-3 pt-5 pb-5 pl-5 transition-all duration-200 hover:border hover:bg-transparent hover:text-foreground ${
                                                        isActive ? "" : ""
                                                    }`}
                                                    tooltip={item.title}
                                                >
                                                    <a href={item.url}>
                                                        <item.icon className="transition-transform duration-200 group-hover:scale-105" />
                                                        <span>
                                                            {item.title}
                                                        </span>
                                                    </a>
                                                </SidebarMenuButton>
                                            </motion.div>
                                        </SidebarMenuItem>
                                        {/* <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                className={`border-b mb-3 pt-5 pb-5 pl-5 hover:border hover:bg-transparent hover:text-foreground`}
                                                tooltip={item.title}
                                            >
                                                <a href={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </a>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem> */}
                                    </motion.div>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>

                {/* --- FOOTER --- */}
                <SidebarFooter>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="px-4 py-2"
                    >
                        <p className="text-xs text-muted-foreground">
                            © 2025 TalentFlow
                        </p>
                    </motion.div>
                </SidebarFooter>
            </Sidebar>
        </motion.div>
    );
}
