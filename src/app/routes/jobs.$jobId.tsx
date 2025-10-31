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
import {
    ArrowLeft,
    Edit,
    Users,
    ClipboardList,
    Calendar,
    MapPin,
    Briefcase,
    DollarSign,
    GraduationCap,
    Shield,
    Check,
    TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    const jobId = params.jobId;

    const dataPromise = Promise.all([
        db.jobs.get(jobId),
        db.candidates.where("jobId").equals(jobId).toArray(),
        db.assessments.where("jobId").equals(jobId).first(),
    ]).then(([job, candidates, assessment]) => {
        if (!job) {
            throw new Response("Job not found", { status: 404 });
        }

        const candidatesByStage = candidates.reduce((acc, candidate) => {
            acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Count candidates by source
        const candidatesBySource = candidates.reduce((acc, candidate) => {
            const source = candidate.source || "Direct";
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            job,
            candidates,
            candidatesByStage,
            candidatesBySource,
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
    });

    return { dataPromise };
}

function JobDetailSkeleton() {
    return (
        <div className="p-8">
            <div className="mb-6">
                <Skeleton className="h-9 w-32 mb-4" />
                <div className="flex items-start justify-between">
                    <div>
                        <Skeleton className="h-9 w-64 mb-2" />
                        <Skeleton className="h-5 w-32 mb-3" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-3">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-9 w-16" />
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function JobDetail({ loaderData }: Route.ComponentProps) {
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
                    console.error("Failed to load job:", error);
                    setIsLoading(false);
                });
        }
    }, [loaderData]);

    if (isLoading || !data) {
        return <JobDetailSkeleton />;
    }

    const { job, candidatesByStage, candidatesBySource, hasAssessment, stats } =
        data;

    const formatSalary = (
        min?: number,
        max?: number,
        currency = "USD",
        period = "annual"
    ) => {
        if (!min && !max) return null;
        const formatter = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
        if (min && max) {
            return `${formatter.format(min)} - ${formatter.format(max)} ${
                period === "hourly" ? "/hr" : "/year"
            }`;
        }
        return formatter.format(min || max!);
    };

    const stageOrder = [
        "applied",
        "screen",
        "tech",
        "offer",
        "hired",
        "rejected",
    ];
    const progressBarColors: Record<string, string> = {
        applied: "bg-gray-500",
        screen: "bg-yellow-500",
        tech: "bg-blue-500",
        offer: "bg-purple-500",
        hired: "bg-green-500",
        rejected: "bg-red-500",
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <Link to="/dashbaord/jobs">
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
                            >
                                {job.status}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
                            {job.department && (
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{job.department}</span>
                                </div>
                            )}
                            {job.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{job.location}</span>
                                    {job.locationType && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {job.locationType}
                                        </Badge>
                                    )}
                                </div>
                            )}
                            {job.employmentType && (
                                <Badge
                                    variant="outline"
                                    className="text-xs capitalize"
                                >
                                    {job.employmentType}
                                </Badge>
                            )}
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    Posted{" "}
                                    {new Date(
                                        job.createdAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to={`/dashboard/jobs/${job.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Job
                            </Button>
                        </Link>
                        <Link to={`/dashboard/assessments/${job.id}`}>
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
                        <CardTitle className="text-3xl">
                            {stats.total}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>In Progress</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">
                            {stats.inProgress}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Hired</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                            {stats.hired}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Rejected</CardDescription>
                        <CardTitle className="text-3xl text-red-600">
                            {stats.rejected}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Job Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {job.description && (
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {job.description}
                                </p>
                            )}

                            {job.tags.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold mb-3">
                                            Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {job.tags.map((tag: string) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Compensation */}
                    {job.compensation &&
                        (job.compensation.salaryMin ||
                            job.compensation.salaryMax) && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        <CardTitle>
                                            Compensation & Benefits
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            Salary Range
                                        </h4>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatSalary(
                                                job.compensation.salaryMin,
                                                job.compensation.salaryMax,
                                                job.compensation.currency,
                                                job.compensation.payPeriod
                                            )}
                                        </p>
                                    </div>

                                    {(job.compensation.bonusStructure ||
                                        job.compensation.equity ||
                                        job.compensation.commission) && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">
                                                    Additional Compensation
                                                </h4>
                                                {job.compensation
                                                    .bonusStructure && (
                                                    <div className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 mt-1 text-green-600" />
                                                        <span className="text-sm">
                                                            Bonus:{" "}
                                                            {
                                                                job.compensation
                                                                    .bonusStructure
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                                {job.compensation.equity && (
                                                    <div className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 mt-1 text-green-600" />
                                                        <span className="text-sm">
                                                            Equity:{" "}
                                                            {
                                                                job.compensation
                                                                    .equity
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                                {job.compensation
                                                    .commission && (
                                                    <div className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 mt-1 text-green-600" />
                                                        <span className="text-sm">
                                                            Commission:{" "}
                                                            {
                                                                job.compensation
                                                                    .commission
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {job.benefits &&
                                        (job.benefits.health?.length > 0 ||
                                            job.benefits.retirement ||
                                            job.benefits.pto) && (
                                            <>
                                                <Separator />
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold">
                                                        Benefits
                                                    </h4>
                                                    {job.benefits.health &&
                                                        job.benefits.health
                                                            .length > 0 && (
                                                            <div>
                                                                <p className="text-sm font-medium mb-1">
                                                                    Health
                                                                    Benefits
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {job.benefits.health.map(
                                                                        (
                                                                            benefit: string
                                                                        ) => (
                                                                            <Badge
                                                                                key={
                                                                                    benefit
                                                                                }
                                                                                variant="outline"
                                                                            >
                                                                                {
                                                                                    benefit
                                                                                }
                                                                            </Badge>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    {job.benefits
                                                        .retirement && (
                                                        <div className="flex items-start gap-2">
                                                            <Check className="w-4 h-4 mt-1 text-blue-600" />
                                                            <span className="text-sm">
                                                                {
                                                                    job.benefits
                                                                        .retirement
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                    {job.benefits.pto && (
                                                        <div className="flex items-start gap-2">
                                                            <Check className="w-4 h-4 mt-1 text-blue-600" />
                                                            <span className="text-sm">
                                                                {
                                                                    job.benefits
                                                                        .pto
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                    {job.benefits.other &&
                                                        job.benefits.other
                                                            .length > 0 && (
                                                            <div>
                                                                <p className="text-sm font-medium mb-1">
                                                                    Other Perks
                                                                </p>
                                                                <ul className="space-y-1">
                                                                    {job.benefits.other.map(
                                                                        (
                                                                            perk: string,
                                                                            index: number
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="flex items-start gap-2"
                                                                            >
                                                                                <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                                                                                <span className="text-sm">
                                                                                    {
                                                                                        perk
                                                                                    }
                                                                                </span>
                                                                            </li>
                                                                        )
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                </div>
                                            </>
                                        )}
                                </CardContent>
                            </Card>
                        )}

                    {/* Requirements */}
                    {job.requirements && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    <CardTitle>
                                        Requirements & Qualifications
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {job.requirements.required &&
                                    job.requirements.required.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                Required Qualifications
                                            </h4>
                                            <ul className="space-y-1">
                                                {job.requirements.required.map(
                                                    (
                                                        req: string,
                                                        index: number
                                                    ) => (
                                                        <li
                                                            key={index}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="text-red-500 font-bold">
                                                                •
                                                            </span>
                                                            <span className="text-sm">
                                                                {req}
                                                            </span>
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                {job.requirements.preferred &&
                                    job.requirements.preferred.length > 0 && (
                                        <>
                                            <Separator />
                                            <div>
                                                <h4 className="font-semibold mb-2">
                                                    Preferred Qualifications
                                                </h4>
                                                <ul className="space-y-1">
                                                    {job.requirements.preferred.map(
                                                        (
                                                            pref: string,
                                                            index: number
                                                        ) => (
                                                            <li
                                                                key={index}
                                                                className="flex items-start gap-2"
                                                            >
                                                                <Check className="w-4 h-4 mt-0.5 text-green-600" />
                                                                <span className="text-sm">
                                                                    {pref}
                                                                </span>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        </>
                                    )}

                                {(job.requirements.education ||
                                    job.requirements.experience) && (
                                    <>
                                        <Separator />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {job.requirements.education && (
                                                <div>
                                                    <p className="text-sm font-semibold mb-1">
                                                        Education
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            job.requirements
                                                                .education
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {job.requirements.experience && (
                                                <div>
                                                    <p className="text-sm font-semibold mb-1">
                                                        Experience
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            job.requirements
                                                                .experience
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {job.requirements.skills &&
                                    (job.requirements.skills.technical?.length >
                                        0 ||
                                        job.requirements.skills.soft?.length >
                                            0) && (
                                        <>
                                            <Separator />
                                            <div className="space-y-3">
                                                {job.requirements.skills
                                                    .technical &&
                                                    job.requirements.skills
                                                        .technical.length >
                                                        0 && (
                                                        <div>
                                                            <h4 className="font-semibold mb-2">
                                                                Technical Skills
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {job.requirements.skills.technical.map(
                                                                    (
                                                                        skill: string
                                                                    ) => (
                                                                        <Badge
                                                                            key={
                                                                                skill
                                                                            }
                                                                            variant="secondary"
                                                                        >
                                                                            {
                                                                                skill
                                                                            }
                                                                        </Badge>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                {job.requirements.skills.soft &&
                                                    job.requirements.skills.soft
                                                        .length > 0 && (
                                                        <div>
                                                            <h4 className="font-semibold mb-2">
                                                                Soft Skills
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {job.requirements.skills.soft.map(
                                                                    (
                                                                        skill: string
                                                                    ) => (
                                                                        <Badge
                                                                            key={
                                                                                skill
                                                                            }
                                                                            variant="outline"
                                                                        >
                                                                            {
                                                                                skill
                                                                            }
                                                                        </Badge>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        </>
                                    )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Pipeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                                                <span className="text-sm font-medium capitalize">
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
                            <Link
                                to={`/dashboard/candidates?jobId=${job.id}`}
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

                            <Link
                                to={`/dashboard/assessments/${job.id}`}
                                className="block"
                            >
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
                        </CardContent>
                    </Card>

                    {/* Application Sources */}
                    {Object.keys(candidatesBySource).length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    <CardTitle>Application Sources</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(candidatesBySource)
                                        .sort(
                                            ([, a], [, b]) =>
                                                (b as number) - (a as number)
                                        )
                                        .map(([source, count]) => {
                                            const percentage =
                                                stats.total > 0
                                                    ? ((count as number) /
                                                          stats.total) *
                                                      100
                                                    : 0;
                                            return (
                                                <div key={source}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium capitalize">
                                                            {source}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {count as number} (
                                                            {percentage.toFixed(
                                                                0
                                                            )}
                                                            %)
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-1.5">
                                                        <div
                                                            className="h-1.5 rounded-full bg-blue-500"
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Hiring Team */}
                    {job.hiringProcess &&
                        (job.hiringProcess.hiringManager ||
                            job.hiringProcess.recruiter) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hiring Team</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {job.hiringProcess.hiringManager && (
                                        <div>
                                            <p className="text-sm font-medium">
                                                Hiring Manager
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {
                                                    job.hiringProcess
                                                        .hiringManager
                                                }
                                            </p>
                                        </div>
                                    )}
                                    {job.hiringProcess.recruiter && (
                                        <div>
                                            <p className="text-sm font-medium">
                                                Recruiter
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {job.hiringProcess.recruiter}
                                            </p>
                                        </div>
                                    )}
                                    {job.hiringProcess.positionsAvailable &&
                                        job.hiringProcess.positionsAvailable >
                                            1 && (
                                            <div>
                                                <p className="text-sm font-medium">
                                                    Positions Available
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {
                                                        job.hiringProcess
                                                            .positionsAvailable
                                                    }
                                                </p>
                                            </div>
                                        )}
                                </CardContent>
                            </Card>
                        )}

                    {/* Legal Info */}
                    {job.legal &&
                        (job.legal.visaSponsorshipAvailable ||
                            job.legal.backgroundCheckRequired) && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        <CardTitle>
                                            Legal & Compliance
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {job.legal.visaSponsorshipAvailable && (
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span className="text-sm">
                                                Visa sponsorship available
                                            </span>
                                        </div>
                                    )}
                                    {job.legal.backgroundCheckRequired && (
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm">
                                                Background check required
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                    {/* Job Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Status:
                                    </dt>
                                    <dd className="font-medium capitalize">
                                        {job.status}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Created:
                                    </dt>
                                    <dd className="font-medium">
                                        {new Date(
                                            job.createdAt
                                        ).toLocaleDateString()}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Last Updated:
                                    </dt>
                                    <dd className="font-medium">
                                        {new Date(
                                            job.updatedAt
                                        ).toLocaleDateString()}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
