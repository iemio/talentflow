import type { Route } from "./+types/jobs.$jobId";
import { Link } from "react-router";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Users, ClipboardList, Calendar } from "lucide-react";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    const jobId = params.jobId;

    const [job, candidates, assessment] = await Promise.all([
        db.jobs.get(jobId),
        db.candidates.where("jobId").equals(jobId).toArray(),
        db.assessments.where("jobId").equals(jobId).first(),
    ]);

    if (!job) {
        throw new Response("Job not found", { status: 404 });
    }

    // Group candidates by stage
    const candidatesByStage = candidates.reduce((acc, candidate) => {
        acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        job,
        candidates,
        candidatesByStage,
        hasAssessment: !!assessment,
        stats: {
            total: candidates.length,
            hired: candidatesByStage.hired || 0,
            inProgress: Object.entries(candidatesByStage)
                .filter(([stage]) => !["hired", "rejected"].includes(stage))
                .reduce((sum, [, count]) => sum + count, 0),
            rejected: candidatesByStage.rejected || 0,
        },
    };
}

export default function JobDetail({ loaderData }: Route.ComponentProps) {
    const { job, candidatesByStage, hasAssessment, stats } = loaderData;

    const stageOrder = [
        "applied",
        "screen",
        "tech",
        "offer",
        "hired",
        "rejected",
    ];
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

    const progressBarColors: Record<string, string> = {
        applied: "bg-gray-500 dark:bg-gray-400",
        screen: "bg-yellow-500 dark:bg-yellow-400",
        tech: "bg-blue-500 dark:bg-blue-400",
        offer: "bg-purple-500 dark:bg-purple-400",
        hired: "bg-green-500 dark:bg-green-400",
        rejected: "bg-red-500 dark:bg-red-400",
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <Link to="/jobs">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Jobs
                    </Button>
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-foreground">
                                {job.title}
                            </h1>
                            <Badge
                                variant={
                                    job.status === "active"
                                        ? "default"
                                        : "secondary"
                                }
                                className="text-sm"
                            >
                                {job.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">/{job.slug}</p>
                        <div className="flex items-center gap-2 mt-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Created{" "}
                                {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to={`/jobs/${job.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Job
                            </Button>
                        </Link>
                        <Link to={`/assessments/${job.id}`}>
                            <Button variant="outline">
                                <ClipboardList className="w-4 h-4 mr-2" />
                                {hasAssessment
                                    ? "Edit Assessment"
                                    : "Create Assessment"}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Candidates</CardDescription>
                        <CardTitle className="text-3xl text-foreground">
                            {stats.total}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>In Progress</CardDescription>
                        <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
                            {stats.inProgress}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Hired</CardDescription>
                        <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                            {stats.hired}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Rejected</CardDescription>
                        <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                            {stats.rejected}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Job Details */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {job.description && (
                            <div>
                                <h3 className="font-semibold mb-2 text-foreground">
                                    Description
                                </h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {job.description}
                                </p>
                            </div>
                        )}

                        <Separator />

                        <div>
                            <h3 className="font-semibold mb-3 text-foreground">
                                Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {job.tags.map((tag: any) => (
                                    <Badge key={tag} variant="secondary">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-semibold mb-3 text-foreground">
                                Candidate Pipeline
                            </h3>
                            <div className="space-y-2">
                                {stageOrder.map((stage) => {
                                    const count = candidatesByStage[stage] || 0;
                                    const percentage =
                                        stats.total > 0
                                            ? (count / stats.total) * 100
                                            : 0;

                                    return (
                                        <div key={stage}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium capitalize text-foreground">
                                                    {stage}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {count} (
                                                    {percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${progressBarColors[stage]}`}
                                                    style={{
                                                        width: `${percentage}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link
                            to={`/candidates?jobId=${job.id}`}
                            className="block"
                        >
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                View All Candidates ({stats.total})
                            </Button>
                        </Link>

                        <Link to={`/assessments/${job.id}`} className="block">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                            >
                                <ClipboardList className="w-4 h-4 mr-2" />
                                {hasAssessment
                                    ? "Manage Assessment"
                                    : "Create Assessment"}
                            </Button>
                        </Link>

                        {hasAssessment && (
                            <Link
                                to={`/assessments/${job.id}/preview`}
                                className="block"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    Preview Assessment
                                </Button>
                            </Link>
                        )}

                        <Separator />

                        <div className="pt-2">
                            <h4 className="text-sm font-semibold mb-3 text-foreground">
                                Assessment Status
                            </h4>
                            <div
                                className={`p-3 rounded-lg ${
                                    hasAssessment
                                        ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                                        : "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800"
                                }`}
                            >
                                <p
                                    className={`text-sm ${
                                        hasAssessment
                                            ? "text-green-800 dark:text-green-300"
                                            : "text-yellow-800 dark:text-yellow-300"
                                    }`}
                                >
                                    {hasAssessment
                                        ? "✓ Assessment configured for this job"
                                        : "⚠ No assessment set up yet"}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="pt-2">
                            <h4 className="text-sm font-semibold mb-2 text-foreground">
                                Job Information
                            </h4>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Status:
                                    </dt>
                                    <dd className="font-medium capitalize text-foreground">
                                        {job.status}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Created:
                                    </dt>
                                    <dd className="font-medium text-foreground">
                                        {new Date(
                                            job.createdAt
                                        ).toLocaleDateString()}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Last Updated:
                                    </dt>
                                    <dd className="font-medium text-foreground">
                                        {new Date(
                                            job.updatedAt
                                        ).toLocaleDateString()}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Candidates */}
            {loaderData.candidates.length > 0 && (
                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Candidates</CardTitle>
                            <Link to={`/candidates?jobId=${job.id}`}>
                                <Button variant="ghost" size="sm">
                                    View All →
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {loaderData.candidates
                                .slice(0, 5)
                                .map((candidate: any) => (
                                    <Link
                                        key={candidate.id}
                                        to={`/candidates/${candidate.id}`}
                                        className="block p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-foreground">
                                                    {candidate.name}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {candidate.email}
                                                </p>
                                            </div>
                                            <Badge
                                                className={
                                                    stageColors[candidate.stage]
                                                }
                                            >
                                                {candidate.stage}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
