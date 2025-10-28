import type { Route } from "./+types/_index";
import { Link } from "react-router";
import { db } from "@/lib/db";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Briefcase,
    Users,
    CheckCircle,
    Clock,
    TrendingUp,
    Activity,
} from "lucide-react";

export async function clientLoader() {
    const [jobs, candidates] = await Promise.all([
        db.jobs.toArray(),
        db.candidates.toArray(),
    ]);

    const activeJobs = jobs.filter((j) => j.status === "active").length;
    const totalCandidates = candidates.length;
    const recentApplications = candidates.filter((c) => {
        const daysSinceApplication =
            (Date.now() - c.appliedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceApplication <= 7;
    }).length;

    const candidatesByStage = candidates.reduce((acc, c) => {
        acc[c.stage] = (acc[c.stage] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        stats: {
            activeJobs,
            totalCandidates,
            recentApplications,
            candidatesByStage,
        },
        recentJobs: jobs.slice(0, 5),
    };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
    const stats = loaderData.stats;

    const statsCards = [
        {
            title: "Active Jobs",
            value: stats.activeJobs,
            icon: Briefcase,
            description: "Currently open positions",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Total Candidates",
            value: stats.totalCandidates,
            icon: Users,
            description: "All time applicants",
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Recent Applications",
            value: stats.recentApplications,
            icon: Clock,
            description: "Last 7 days",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            title: "Hired",
            value: stats.candidatesByStage.hired || 0,
            icon: CheckCircle,
            description: "Successfully placed",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
        },
    ];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">
                    Welcome to TalentFlow - Your hiring command center
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon
                                    className={`w-5 h-5 ${stat.color}`}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {stat.value}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pipeline Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Candidate Pipeline
                        </CardTitle>
                        <CardDescription>
                            Distribution across hiring stages
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(stats.candidatesByStage).map(
                                ([stage, count]) => (
                                    <div
                                        key={stage}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-3 h-3 rounded-full ${
                                                    stage === "hired"
                                                        ? "bg-green-500"
                                                        : stage === "rejected"
                                                        ? "bg-red-500"
                                                        : stage === "offer"
                                                        ? "bg-purple-500"
                                                        : stage === "tech"
                                                        ? "bg-blue-500"
                                                        : stage === "screen"
                                                        ? "bg-yellow-500"
                                                        : "bg-gray-500"
                                                }`}
                                            />
                                            <span className="text-sm font-medium capitalize">
                                                {stage}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold">
                                            {count}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Recent Jobs
                        </CardTitle>
                        <CardDescription>Latest job openings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {loaderData.recentJobs.map((job: any) => (
                                <Link
                                    key={job.id}
                                    to={`/jobs/${job.id}`}
                                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-sm">
                                                {job.title}
                                            </h4>
                                            <div className="flex gap-2 mt-1">
                                                {job.tags.map((tag: string) => (
                                                    <span
                                                        key={tag}
                                                        className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${
                                                job.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {job.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                            <Link
                                to="/jobs"
                                className="block text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View all jobs →
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Common tasks to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            to="/jobs?action=create"
                            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <Briefcase className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                            <h4 className="font-medium">Create New Job</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Post a new position
                            </p>
                        </Link>
                        <Link
                            to="/candidates"
                            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <Users className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                            <h4 className="font-medium">Review Candidates</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                View all applicants
                            </p>
                        </Link>
                        <Link
                            to="/jobs"
                            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <CheckCircle className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                            <h4 className="font-medium">Setup Assessment</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Create job assessments
                            </p>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
