import type { Route } from "./+types/candidates._index";
import { useRef, useState, useMemo, useEffect } from "react";
import { Form, Link, useSearchParams } from "react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Non-blocking loader
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage") || "all";
    const jobId = url.searchParams.get("jobId");

    const dataPromise = (async () => {
        let query = db.candidates.toCollection();

        if (stage && stage !== "all") {
            query = db.candidates.where("stage").equals(stage);
        }

        let candidates = await query.toArray();

        if (jobId) {
            candidates = candidates.filter((c) => c.jobId === jobId);
        }

        // Fetch job titles for display
        const jobIds = [...new Set(candidates.map((c) => c.jobId))];
        const jobs = await db.jobs.bulkGet(jobIds);
        const jobMap = new Map(
            jobs.filter(Boolean).map((j) => [j!.id, j!.title])
        );

        return {
            candidates: candidates.map((c) => ({
                ...c,
                jobTitle: jobMap.get(c.jobId) || "Unknown Job",
            })),
            totalCount: candidates.length,
        };
    })();

    return { dataPromise };
}

function CandidatesSkeleton() {
    return (
        <div className="p-8">
            {/* Header Skeleton */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <Skeleton className="h-9 w-48 mb-2" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-10 w-36" />
                </div>
            </div>

            {/* Filters Skeleton */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-[200px]" />
                    </div>
                </CardContent>
            </Card>

            {/* Stage Pills Skeleton */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-6 w-20" />
                ))}
            </div>

            {/* List Skeleton */}
            <Card>
                <div className="h-[calc(100vh-400px)] overflow-hidden">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 p-4 border-b"
                        >
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function CandidateRow({ candidate }: { candidate: any }) {
    const stageColors: Record<string, string> = {
        applied:
            "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
        screen: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300",
        tech: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300",
        offer: "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300",
        hired: "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300",
        rejected:
            "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300",
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Link
            to={`/dashboard/candidates/${candidate.id}`}
            className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors border-b border-border"
        >
            <Avatar>
                <AvatarFallback className="bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    {getInitials(candidate.name)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate text-foreground">
                    {candidate.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                    {candidate.email}
                </p>
            </div>

            <div className="hidden md:block flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                    {candidate.jobTitle}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Badge className={stageColors[candidate.stage]}>
                    {candidate.stage}
                </Badge>
                <span className="text-xs text-muted-foreground hidden lg:block">
                    {new Date(candidate.appliedAt).toLocaleDateString()}
                </span>
            </div>
        </Link>
    );
}

export default function CandidatesIndex({ loaderData }: Route.ComponentProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const parentRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [stageFilter, setStageFilter] = useState(
        searchParams.get("stage") || "all"
    );
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (loaderData?.dataPromise) {
            loaderData.dataPromise
                .then((result: any) => {
                    setData(result);
                    setIsLoading(false);
                })
                .catch((error: any) => {
                    console.error("Failed to load candidates:", error);
                    setIsLoading(false);
                });
        }
    }, [loaderData]);

    // Client-side filtering for name/email search
    const filteredCandidates = useMemo(() => {
        if (!data) return [];
        if (!searchTerm) return data.candidates;

        const lowerSearch = searchTerm.toLowerCase();
        return data.candidates.filter(
            (candidate: any) =>
                candidate.name.toLowerCase().includes(lowerSearch) ||
                candidate.email.toLowerCase().includes(lowerSearch)
        );
    }, [data, searchTerm]);

    const virtualizer = useVirtualizer({
        count: filteredCandidates.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80,
        overscan: 10,
    });

    const stages = [
        { value: "all", label: "All Stages", count: data?.totalCount },
        { value: "applied", label: "Applied" },
        { value: "screen", label: "Screening" },
        { value: "tech", label: "Technical" },
        { value: "offer", label: "Offer" },
        { value: "hired", label: "Hired" },
        { value: "rejected", label: "Rejected" },
    ];

    const currentStage = searchParams.get("stage") || "all";

    const handleStageChange = (value: string) => {
        setStageFilter(value);
        const newParams = new URLSearchParams(searchParams);
        newParams.set("stage", value);
        setSearchParams(newParams);
    };

    if (isLoading || !data) {
        return <CandidatesSkeleton />;
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Users className="w-8 h-8" />
                            Candidates
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {filteredCandidates.length} candidate
                            {filteredCandidates.length !== 1 ? "s" : ""} found
                        </p>
                    </div>
                    <Link to="/dashboard/candidates/kanban">
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Kanban View
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or email..."
                                className="pl-10"
                            />
                        </div>

                        {/* Stage Filter */}
                        <div className="flex gap-2">
                            <Select
                                value={stageFilter}
                                onValueChange={handleStageChange}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stages.map((stage) => (
                                        <SelectItem
                                            key={stage.value}
                                            value={stage.value}
                                        >
                                            {stage.label}
                                            {stage.count !== undefined &&
                                                ` (${stage.count})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stage Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
                {stages.map((stage) => (
                    <Link
                        key={stage.value}
                        to={`/dashboard/candidates?stage=${stage.value}`}
                    >
                        <Badge
                            variant={
                                currentStage === stage.value
                                    ? "default"
                                    : "outline"
                            }
                            className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        >
                            {stage.label}
                        </Badge>
                    </Link>
                ))}
            </div>

            {/* Virtualized List */}
            <Card>
                <div
                    ref={parentRef}
                    className="h-[calc(100vh-400px)] overflow-auto"
                >
                    {filteredCandidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <Users className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                No candidates found
                            </h3>
                            <p className="text-muted-foreground">
                                {searchTerm
                                    ? "Try adjusting your search terms"
                                    : "No candidates match the selected filters"}
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: "100%",
                                position: "relative",
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const candidate =
                                    filteredCandidates[virtualRow.index];
                                return (
                                    <div
                                        key={candidate.id}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <CandidateRow candidate={candidate} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>

            {/* Stats Footer */}
            <div className="mt-4 text-sm text-muted-foreground text-center">
                Showing {filteredCandidates.length} of {data.totalCount} total
                candidates
            </div>
        </div>
    );
}
