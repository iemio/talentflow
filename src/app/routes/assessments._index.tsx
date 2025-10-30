import type { Route } from "./+types/assessments._index";
import { Link } from "react-router";
import { db, type Assessment, type Job } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Clock,
    Eye,
    Edit,
    Plus,
    CheckCircle,
    FileQuestion,
} from "lucide-react";

// Extended type for assessments with computed properties
interface AssessmentWithDetails extends Assessment {
    job?: Job;
    totalQuestions: number;
    requiredQuestions: number;
}

export async function clientLoader() {
    const [assessments, jobs] = await Promise.all([
        db.assessments.toArray(),
        db.jobs.toArray(),
    ]);

    // Create a map of assessments with job details
    const assessmentsWithJobs: AssessmentWithDetails[] = assessments.map(
        (assessment) => {
            const job = jobs.find((j) => j.id === assessment.jobId);
            const totalQuestions = assessment.sections.reduce(
                (acc, s) => acc + s.questions.length,
                0
            );
            const requiredQuestions = assessment.sections
                .flatMap((s) => s.questions)
                .filter((q) => q.required).length;

            return {
                ...assessment,
                job,
                totalQuestions,
                requiredQuestions,
            };
        }
    );

    // Separate by status
    const published = assessmentsWithJobs.filter(
        (a) => a.status === "published"
    );
    const drafts = assessmentsWithJobs.filter((a) => a.status === "draft");

    // Get jobs without assessments
    const jobsWithoutAssessments = jobs.filter(
        (job) =>
            !assessments.some((a) => a.jobId === job.id) &&
            job.status === "active"
    );

    return { published, drafts, jobsWithoutAssessments };
}

export default function AssessmentsPage({ loaderData }: Route.ComponentProps) {
    const { published, drafts, jobsWithoutAssessments } = loaderData;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Assessments</h1>
                <p className="text-muted-foreground">
                    Manage job assessments and questionnaires
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Published
                                </p>
                                <p className="text-2xl font-bold">
                                    {published.length}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Drafts
                                </p>
                                <p className="text-2xl font-bold">
                                    {drafts.length}
                                </p>
                            </div>
                            <FileText className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Questions
                                </p>
                                <p className="text-2xl font-bold">
                                    {[...published, ...drafts].reduce(
                                        (acc, a) => acc + a.totalQuestions,
                                        0
                                    )}
                                </p>
                            </div>
                            <FileQuestion className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Needs Assessment
                                </p>
                                <p className="text-2xl font-bold">
                                    {jobsWithoutAssessments.length}
                                </p>
                            </div>
                            <Plus className="w-8 h-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Published Assessments */}
            {published.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Published Assessments
                    </h2>
                    <div className="grid gap-4">
                        {published.map((assessment: AssessmentWithDetails) => (
                            <Card
                                key={assessment.id}
                                className="hover:shadow-md transition-shadow"
                            >
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">
                                                    {assessment.job?.title ||
                                                        "Unknown Job"}
                                                </h3>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                                                >
                                                    Published
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    {assessment.sections.length}{" "}
                                                    section
                                                    {assessment.sections
                                                        .length !== 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileQuestion className="w-4 h-4" />
                                                    {assessment.totalQuestions}{" "}
                                                    questions (
                                                    {
                                                        assessment.requiredQuestions
                                                    }{" "}
                                                    required)
                                                </span>
                                                {assessment.timeLimit && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {assessment.timeLimit}{" "}
                                                        min limit
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                Last updated:{" "}
                                                {new Date(
                                                    assessment.updatedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                to={`/assessments/${assessment.jobId}/preview`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </Button>
                                            </Link>
                                            <Link
                                                to={`/assessments/${assessment.jobId}`}
                                            >
                                                <Button size="sm">
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Draft Assessments */}
            {drafts.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        Draft Assessments
                    </h2>
                    <div className="grid gap-4">
                        {drafts.map((assessment: AssessmentWithDetails) => (
                            <Card
                                key={assessment.id}
                                className="hover:shadow-md transition-shadow border-dashed"
                            >
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">
                                                    {assessment.job?.title ||
                                                        "Unknown Job"}
                                                </h3>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                                                >
                                                    Draft
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    {assessment.sections.length}{" "}
                                                    section
                                                    {assessment.sections
                                                        .length !== 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileQuestion className="w-4 h-4" />
                                                    {assessment.totalQuestions}{" "}
                                                    questions (
                                                    {
                                                        assessment.requiredQuestions
                                                    }{" "}
                                                    required)
                                                </span>
                                                {assessment.timeLimit && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {assessment.timeLimit}{" "}
                                                        min limit
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                Last updated:{" "}
                                                {new Date(
                                                    assessment.updatedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                to={`/assessments/${assessment.jobId}/preview`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </Button>
                                            </Link>
                                            <Link
                                                to={`/assessments/${assessment.jobId}`}
                                            >
                                                <Button size="sm">
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Continue Editing
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Jobs Without Assessments */}
            {jobsWithoutAssessments.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-muted-foreground" />
                        Jobs Needing Assessments
                    </h2>
                    <div className="grid gap-4">
                        {jobsWithoutAssessments.map((job: Job) => (
                            <Card
                                key={job.id}
                                className="hover:shadow-md transition-shadow border-dashed"
                            >
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-1">
                                                {job.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                No assessment created yet
                                            </p>
                                        </div>
                                        <Link to={`/assessments/${job.id}`}>
                                            <Button>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create Assessment
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {published.length === 0 &&
                drafts.length === 0 &&
                jobsWithoutAssessments.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileQuestion className="w-16 h-16 text-muted-foreground mb-4" />
                            <h2 className="text-2xl font-bold mb-2">
                                No Assessments Yet
                            </h2>
                            <p className="text-muted-foreground mb-6 text-center max-w-md">
                                Create jobs first, then you can build
                                assessments for them.
                            </p>
                            <Link to="/jobs">
                                <Button size="lg">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Go to Jobs
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
        </div>
    );
}
