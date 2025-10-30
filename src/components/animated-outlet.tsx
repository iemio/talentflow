import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Outlet, useNavigation } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

// Loading skeleton component
function LoadingSkeleton() {
    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-200">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Search/Filter bar skeleton */}
            <div className="border rounded-lg p-6">
                <div className="flex gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-20" />
                </div>
            </div>

            {/* Content cards skeleton */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-6">
                        <div className="flex gap-4">
                            <Skeleton className="h-6 w-6 shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between">
                                    <Skeleton className="h-6 w-64" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <div className="flex gap-2 mt-3">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Skeleton className="h-9 w-20" />
                                    <Skeleton className="h-9 w-20" />
                                    <Skeleton className="h-9 w-24" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AnimatedOutlet() {
    const location = useLocation();
    const navigation = useNavigation();
    const [showSkeleton, setShowSkeleton] = useState(false);

    // Show skeleton immediately when navigation starts
    useEffect(() => {
        if (navigation.state === "loading") {
            // Show skeleton immediately without delay
            setShowSkeleton(true);
        } else {
            // Small delay before hiding to prevent flash
            const timer = setTimeout(() => setShowSkeleton(false), 50);
            return () => clearTimeout(timer);
        }
    }, [navigation.state]);

    // Always show content, overlay skeleton when loading
    return (
        <div className="relative flex flex-1 flex-col">
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: showSkeleton ? 0 : 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex flex-1 flex-col"
                >
                    <Outlet />
                </motion.div>
            </AnimatePresence>

            {/* Overlay skeleton during loading */}
            <AnimatePresence>
                {showSkeleton && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-background z-10"
                    >
                        <LoadingSkeleton />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
