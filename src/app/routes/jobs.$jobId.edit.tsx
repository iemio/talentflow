import type { Route } from "./+types/jobs.$jobId.edit";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    const job = await db.jobs.get(params.jobId);

    if (!job) {
        throw new Response("Job not found", { status: 404 });
    }

    return { job };
}

export default function EditJob({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();
    const { job } = loaderData;

    const [formData, setFormData] = useState({
        title: job.title,
        slug: job.slug,
        description: job.description || "",
        tags: job.tags.join(", "),
        status: job.status,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }

        if (!formData.slug.trim()) {
            newErrors.slug = "Slug is required";
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug =
                "Slug can only contain lowercase letters, numbers, and hyphens";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/jobs/${job.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags
                        .split(",")
                        .map((t: any) => t.trim())
                        .filter(Boolean),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update job");
            }

            toast.success("Job updated successfully");
            navigate(`/jobs/${job.id}`);
        } catch (error) {
            toast.error("Failed to update job");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTitleChange = (value: string) => {
        setFormData({
            ...formData,
            title: value,
            // Auto-generate slug from title if slug hasn't been manually edited
            slug:
                formData.slug === job.slug
                    ? value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "")
                    : formData.slug,
        });
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link to={`/jobs/${job.id}`}>
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Job
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
                <p className="text-gray-600 mt-1">
                    Update job details and settings
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Information</CardTitle>
                        <CardDescription>
                            Update the basic information about this job opening
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Job Title{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    handleTitleChange(e.target.value)
                                }
                                placeholder="Senior React Developer"
                                className={errors.title ? "border-red-500" : ""}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Slug */}
                        <div className="space-y-2">
                            <Label htmlFor="slug">
                                Slug <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">/</span>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            slug: e.target.value,
                                        })
                                    }
                                    placeholder="senior-react-developer"
                                    className={
                                        errors.slug ? "border-red-500" : ""
                                    }
                                />
                            </div>
                            {errors.slug && (
                                <p className="text-sm text-red-500">
                                    {errors.slug}
                                </p>
                            )}
                            <p className="text-sm text-gray-500">
                                URL-friendly identifier for this job (lowercase,
                                numbers, and hyphens only)
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Detailed job description..."
                                rows={8}
                                className="resize-none"
                            />
                            <p className="text-sm text-gray-500">
                                Provide a comprehensive description of the role,
                                responsibilities, and requirements
                            </p>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        tags: e.target.value,
                                    })
                                }
                                placeholder="remote, full-time, senior, react"
                            />
                            <p className="text-sm text-gray-500">
                                Comma-separated tags to categorize this job
                                (e.g., remote, full-time, senior)
                            </p>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        status: e.target.value as
                                            | "active"
                                            | "archived",
                                    })
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                            <p className="text-sm text-gray-500">
                                Active jobs are visible to candidates, archived
                                jobs are hidden
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <Link to={`/jobs/${job.id}`}>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Danger Zone */}
            <Card className="mt-8 border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible and destructive actions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Archive this job</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                This will hide the job from candidates but
                                preserve all data
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (
                                    confirm(
                                        "Are you sure you want to archive this job?"
                                    )
                                ) {
                                    try {
                                        await fetch(`/api/jobs/${job.id}`, {
                                            method: "PATCH",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                            body: JSON.stringify({
                                                status: "archived",
                                            }),
                                        });
                                        toast.success("Job archived");
                                        navigate(`/jobs/${job.id}`);
                                    } catch (error) {
                                        toast.error("Failed to archive job");
                                    }
                                }
                            }}
                        >
                            Archive Job
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
