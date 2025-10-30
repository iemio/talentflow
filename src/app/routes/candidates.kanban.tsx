import type { Route } from "./+types/candidates.kanban";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { List, Search, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Non-blocking loader
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId");

    const dataPromise = (async () => {
        let candidates = await db.candidates.toArray();

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
        };
    })();

    return { dataPromise };
}

// Skeleton component
function KanbanSkeleton() {
    return (
        <div className="p-8">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <Skeleton className="h-9 w-64 mb-2" />
                        <Skeleton className="h-5 w-80" />
                    </div>
                    <Skeleton className="h-10 w-28" />
                </div>
                <Skeleton className="h-10 w-96" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="flex-1">
                        <CardHeader className="bg-gray-100 dark:bg-gray-800 border-b">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-6 w-8 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="mb-3">
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-full" />
                                                    <Skeleton className="h-3 w-24" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

interface KanbanColumn {
    id: string;
    title: string;
    color: string;
}

const columns: KanbanColumn[] = [
    { id: "applied", title: "Applied", color: "bg-gray-100 dark:bg-gray-800" },
    {
        id: "screen",
        title: "Screening",
        color: "bg-yellow-100 dark:bg-yellow-950/40",
    },
    {
        id: "tech",
        title: "Technical",
        color: "bg-blue-100 dark:bg-blue-950/40",
    },
    {
        id: "offer",
        title: "Offer",
        color: "bg-purple-100 dark:bg-purple-950/40",
    },
    { id: "hired", title: "Hired", color: "bg-green-100 dark:bg-green-950/40" },
    {
        id: "rejected",
        title: "Rejected",
        color: "bg-red-100 dark:bg-red-950/40",
    },
];

function CandidateCard({
    candidate,
    onDragStart,
}: {
    candidate: any;
    onDragStart: (e: React.DragEvent, candidate: any) => void;
}) {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Link to={`/candidates/${candidate.id}`}>
            <Card
                draggable
                onDragStart={(e) => onDragStart(e, candidate)}
                className="mb-3 cursor-move hover:shadow-md transition-shadow"
            >
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-sm">
                                {getInitials(candidate.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate text-foreground">
                                {candidate.name}
                            </h3>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">
                                    {candidate.email}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 truncate">
                                {candidate.jobTitle}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>
                                    {new Date(
                                        candidate.appliedAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function CandidatesKanban({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [draggedCandidate, setDraggedCandidate] = useState<any>(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(
        null
    );

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
                    toast.error("Failed to load candidates");
                });
        }
    }, [loaderData]);

    if (isLoading || !data) {
        return <KanbanSkeleton />;
    }

    // Filter candidates by search term
    const filteredCandidates = data.candidates.filter(
        (candidate: any) =>
            candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group candidates by stage
    const candidatesByStage = columns.reduce((acc, column) => {
        acc[column.id] = filteredCandidates.filter(
            (c: any) => c.stage === column.id
        );
        return acc;
    }, {} as Record<string, any[]>);

    const handleDragStart = (e: React.DragEvent, candidate: any) => {
        setDraggedCandidate(candidate);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDraggedOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDraggedOverColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, newStage: string) => {
        e.preventDefault();
        setDraggedOverColumn(null);

        if (!draggedCandidate || draggedCandidate.stage === newStage) {
            setDraggedCandidate(null);
            return;
        }

        try {
            const response = await fetch(
                `/api/candidates/${draggedCandidate.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stage: newStage }),
                }
            );

            if (!response.ok) throw new Error("Failed to update stage");

            toast.success(`Moved ${draggedCandidate.name} to ${newStage}`);

            // Reload the page to reflect changes
            navigate(`/candidates/kanban`, { replace: true });
        } catch (error) {
            toast.error("Failed to update candidate stage");
        } finally {
            setDraggedCandidate(null);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Candidate Pipeline
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Drag and drop candidates between stages
                        </p>
                    </div>
                    <Link to="/candidates">
                        <Button variant="outline">
                            <List className="w-4 h-4 mr-2" />
                            List View
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search candidates..."
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {columns.map((column) => {
                    const candidates = candidatesByStage[column.id] || [];
                    const isDraggedOver = draggedOverColumn === column.id;

                    return (
                        <div
                            key={column.id}
                            className="flex flex-col"
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            <Card
                                className={`flex-1 ${
                                    isDraggedOver
                                        ? "ring-2 ring-blue-500 dark:ring-blue-400"
                                        : ""
                                }`}
                            >
                                <CardHeader
                                    className={`${column.color} border-b border-border`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-semibold text-sm text-foreground">
                                            {column.title}
                                        </h2>
                                        <Badge
                                            variant="secondary"
                                            className="bg-white dark:bg-gray-900"
                                        >
                                            {candidates.length}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
                                    {candidates.length === 0 ? (
                                        <div className="text-center text-muted-foreground text-sm mt-8">
                                            No candidates
                                        </div>
                                    ) : (
                                        candidates.map((candidate) => (
                                            <CandidateCard
                                                key={candidate.id}
                                                candidate={candidate}
                                                onDragStart={handleDragStart}
                                            />
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>

            {/* Stats */}
            <div className="mt-6 text-sm text-muted-foreground text-center">
                Total candidates: {filteredCandidates.length}
            </div>
        </div>
    );
}
