import type { Route } from "./+types/candidates._index";
import { useRef, useState, useMemo } from "react";
import { Form, Link, useSearchParams } from "react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Users } from "lucide-react";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage") || "all";
    const jobId = url.searchParams.get("jobId");

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
    const jobMap = new Map(jobs.filter(Boolean).map((j) => [j!.id, j!.title]));

    return {
        candidates: candidates.map((c) => ({
            ...c,
            jobTitle: jobMap.get(c.jobId) || "Unknown Job",
        })),
        totalCount: candidates.length,
    };
}

function CandidateRow({ candidate }: { candidate: any }) {
    const stageColors: Record<string, string> = {
        applied: "bg-gray-100 text-gray-800",
        screen: "bg-yellow-100 text-yellow-800",
        tech: "bg-blue-100 text-blue-800",
        offer: "bg-purple-100 text-purple-800",
        hired: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
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
            to={`/candidates/${candidate.id}`}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b"
        >
            <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getInitials(candidate.name)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{candidate.name}</h3>
                <p className="text-sm text-gray-600 truncate">
                    {candidate.email}
                </p>
            </div>

            <div className="hidden md:block flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                    {candidate.jobTitle}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Badge className={stageColors[candidate.stage]}>
                    {candidate.stage}
                </Badge>
                <span className="text-xs text-gray-500 hidden lg:block">
                    {new Date(candidate.appliedAt).toLocaleDateString()}
                </span>
            </div>
        </Link>
    );
}

export default function CandidatesIndex({ loaderData }: Route.ComponentProps) {
    const [searchParams] = useSearchParams();
    const parentRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Client-side filtering for name/email search
    const filteredCandidates = useMemo(() => {
        if (!searchTerm) return loaderData.candidates;

        const lowerSearch = searchTerm.toLowerCase();
        return loaderData.candidates.filter(
            (candidate: any) =>
                candidate.name.toLowerCase().includes(lowerSearch) ||
                candidate.email.toLowerCase().includes(lowerSearch)
        );
    }, [loaderData.candidates, searchTerm]);

    const virtualizer = useVirtualizer({
        count: filteredCandidates.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80,
        overscan: 10,
    });

    const stages = [
        { value: "all", label: "All Stages", count: loaderData.totalCount },
        { value: "applied", label: "Applied" },
        { value: "screen", label: "Screening" },
        { value: "tech", label: "Technical" },
        { value: "offer", label: "Offer" },
        { value: "hired", label: "Hired" },
        { value: "rejected", label: "Rejected" },
    ];

    const currentStage = searchParams.get("stage") || "all";

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="w-8 h-8" />
                            Candidates
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {filteredCandidates.length} candidate
                            {filteredCandidates.length !== 1 ? "s" : ""} found
                        </p>
                    </div>
                    <Link to="/candidates/kanban">
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or email..."
                                className="pl-10"
                            />
                        </div>

                        {/* Stage Filter */}
                        <Form className="flex gap-2">
                            <select
                                name="stage"
                                defaultValue={currentStage}
                                className="border border-gray-300 rounded-md px-4 py-2 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {stages.map((stage) => (
                                    <option
                                        key={stage.value}
                                        value={stage.value}
                                    >
                                        {stage.label}
                                        {stage.count !== undefined &&
                                            ` (${stage.count})`}
                                    </option>
                                ))}
                            </select>
                            <Button type="submit">Apply</Button>
                        </Form>
                    </div>
                </CardContent>
            </Card>

            {/* Stage Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
                {stages.map((stage) => (
                    <Link
                        key={stage.value}
                        to={`/candidates?stage=${stage.value}`}
                    >
                        <Badge
                            variant={
                                currentStage === stage.value
                                    ? "default"
                                    : "outline"
                            }
                            className="cursor-pointer hover:bg-blue-50"
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
                            <Users className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No candidates found
                            </h3>
                            <p className="text-gray-600">
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
            <div className="mt-4 text-sm text-gray-600 text-center">
                Showing {filteredCandidates.length} of {loaderData.totalCount}{" "}
                total candidates
            </div>
        </div>
    );
}
