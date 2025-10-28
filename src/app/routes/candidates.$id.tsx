import type { Route } from "./+types/candidates.$id";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Mail,
    Calendar,
    Briefcase,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    const candidateId = params.id;

    const [candidate, timeline, job] = await Promise.all([
        db.candidates.get(candidateId),
        db.statusChanges
            .where("candidateId")
            .equals(candidateId)
            .sortBy("timestamp"),
        db.candidates
            .get(candidateId)
            .then((c) => (c ? db.jobs.get(c.jobId) : null)),
    ]);

    if (!candidate) {
        throw new Response("Candidate not found", { status: 404 });
    }

    // Get assessment responses
    const assessmentResponse = await db.assessmentResponses
        .where("candidateId")
        .equals(candidateId)
        .first();

    return {
        candidate,
        job,
        timeline: timeline || [],
        hasAssessment: !!assessmentResponse,
    };
}

export default function CandidateDetail({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();
    const { candidate, job, timeline, hasAssessment } = loaderData;
    const [newNote, setNewNote] = useState("");
    const [isUpdatingStage, setIsUpdatingStage] = useState(false);

    const stageColors: Record<string, string> = {
        applied: "bg-gray-100 text-gray-800",
        screen: "bg-yellow-100 text-yellow-800",
        tech: "bg-blue-100 text-blue-800",
        offer: "bg-purple-100 text-purple-800",
        hired: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
    };

    const stages = ["applied", "screen", "tech", "offer", "hired", "rejected"];

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getStageIcon = (stage: string) => {
        switch (stage) {
            case "hired":
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "rejected":
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-blue-600" />;
        }
    };

    const handleStageChange = async (newStage: string) => {
        if (newStage === candidate.stage) return;

        setIsUpdatingStage(true);
        try {
            const response = await fetch(`/api/candidates/${candidate.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stage: newStage }),
            });

            if (!response.ok) throw new Error("Failed to update stage");

            toast.success(`Candidate moved to ${newStage}`);
            navigate(`/candidates/${candidate.id}`, { replace: true });
        } catch (error) {
            toast.error("Failed to update candidate stage");
        } finally {
            setIsUpdatingStage(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            // For now, just log the note (could extend to store in DB)
            console.log("Adding note:", newNote);
            toast.success("Note added");
            setNewNote("");
        } catch (error) {
            toast.error("Failed to add note");
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <Link to="/candidates">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Candidates
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Candidate Info Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <Avatar className="w-16 h-16">
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                                        {getInitials(candidate.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">
                                                {candidate.name}
                                            </h1>
                                            <div className="flex items-center gap-2 mt-1 text-gray-600">
                                                <Mail className="w-4 h-4" />
                                                <span>{candidate.email}</span>
                                            </div>
                                        </div>
                                        <Badge
                                            className={
                                                stageColors[candidate.stage]
                                            }
                                            variant="secondary"
                                        >
                                            {candidate.stage}
                                        </Badge>
                                    </div>
                                    {job && (
                                        <Link
                                            to={`/jobs/${job.id}`}
                                            className="flex items-center gap-2 mt-3 text-sm text-blue-600 hover:underline"
                                        >
                                            <Briefcase className="w-4 h-4" />
                                            {job.title}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    Applied on{" "}
                                    {new Date(
                                        candidate.appliedAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            {hasAssessment && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">
                                        ✓ Assessment completed
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stage Management */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Update Stage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {stages.map((stage) => (
                                    <Button
                                        key={stage}
                                        variant={
                                            candidate.stage === stage
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() => handleStageChange(stage)}
                                        disabled={
                                            isUpdatingStage ||
                                            candidate.stage === stage
                                        }
                                        className="capitalize"
                                    >
                                        {isUpdatingStage &&
                                            candidate.stage === stage && (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            )}
                                        {stage}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {timeline.length === 0 ? (
                                <p className="text-sm text-gray-600 text-center py-8">
                                    No activity yet
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {/* Initial application */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                {getStageIcon("applied")}
                                            </div>
                                            {timeline.length > 0 && (
                                                <div className="w-0.5 h-full bg-gray-200 mt-2" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="font-medium">
                                                Applied to position
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(
                                                    candidate.appliedAt
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status changes */}
                                    {timeline.map(
                                        (change: any, index: number) => (
                                            <div
                                                key={change.id}
                                                className="flex gap-4"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        {getStageIcon(
                                                            change.to
                                                        )}
                                                    </div>
                                                    {index <
                                                        timeline.length - 1 && (
                                                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <p className="font-medium">
                                                        Moved from{" "}
                                                        <span className="capitalize">
                                                            {change.from}
                                                        </span>{" "}
                                                        to{" "}
                                                        <span className="capitalize">
                                                            {change.to}
                                                        </span>
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(
                                                            change.timestamp
                                                        ).toLocaleString()}
                                                    </p>
                                                    {change.note && (
                                                        <p className="text-sm mt-2 p-2 bg-gray-50 rounded">
                                                            {change.note}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                asChild
                            >
                                <a href={`mailto:${candidate.email}`}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Send Email
                                </a>
                            </Button>
                            {job && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link to={`/jobs/${job.id}`}>
                                        <Briefcase className="w-4 h-4 mr-2" />
                                        View Job
                                    </Link>
                                </Button>
                            )}
                            {hasAssessment && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    View Assessment Response
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add a note... Use @name to mention team members"
                                    rows={4}
                                />
                                <Button
                                    onClick={handleAddNote}
                                    className="w-full"
                                    disabled={!newNote.trim()}
                                >
                                    Add Note
                                </Button>
                            </div>
                            <Separator />
                            <p className="text-sm text-gray-500 text-center">
                                No notes yet
                            </p>
                        </CardContent>
                    </Card>

                    {/* Candidate Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Current Stage
                                </p>
                                <Badge
                                    className={stageColors[candidate.stage]}
                                    variant="secondary"
                                >
                                    {candidate.stage}
                                </Badge>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm text-gray-600">
                                    Applied Date
                                </p>
                                <p className="font-medium">
                                    {new Date(
                                        candidate.appliedAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm text-gray-600">
                                    Days in Pipeline
                                </p>
                                <p className="font-medium">
                                    {Math.floor(
                                        (Date.now() -
                                            new Date(
                                                candidate.appliedAt
                                            ).getTime()) /
                                            (1000 * 60 * 60 * 24)
                                    )}{" "}
                                    days
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
