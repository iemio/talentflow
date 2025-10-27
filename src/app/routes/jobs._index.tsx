// src/app/routes/jobs._index.tsx
import type { Route } from "./+types/jobs._index";
import { useState, useEffect } from "react";
import { Form, Link, useSearchParams, useNavigate } from "react-router";
import {
    DndContext,
    closestCenter,
    type DragEndEvent,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    GripVertical,
    Edit,
    Archive,
    Eye,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { db, type Job } from "@/lib/db";
import { toast } from "sonner";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";
    const page = url.searchParams.get("page") || "1";

    const response = await fetch(
        `/api/jobs?search=${search}&status=${status}&page=${page}&pageSize=10&sort=order`
    );

    if (!response.ok) {
        throw new Error("Failed to load jobs");
    }

    return response.json();
}

function SortableJobCard({
    job,
    onEdit,
    onArchive,
}: {
    job: Job;
    onEdit: () => void;
    onArchive: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: job.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="hover:shadow-md transition-shadow"
        >
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    <button
                        {...attributes}
                        {...listeners}
                        className="mt-1 cursor-grab active:cursor-grabbing touch-none"
                    >
                        <GripVertical className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <Link
                                    to={`/jobs/${job.id}`}
                                    className="text-lg font-semibold hover:text-blue-600"
                                >
                                    {job.title}
                                </Link>
                                <p className="text-sm text-gray-500 mt-1">
                                    /{job.slug}
                                </p>
                            </div>
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
                        {job.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {job.description}
                            </p>
                        )}
                        <div className="flex gap-2 mt-3">
                            {job.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onEdit}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                    </Button>
                    <Link to={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={onArchive}>
                        <Archive className="w-4 h-4 mr-1" />
                        {job.status === "active" ? "Archive" : "Unarchive"}
                    </Button>
                    <Link to={`/assessments/${job.id}`}>
                        <Button variant="outline" size="sm">
                            Assessment
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

function JobFormDialog({
    open,
    onOpenChange,
    job,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    job?: Job | null;
    onSubmit: (data: any) => Promise<void>;
}) {
    const [formData, setFormData] = useState({
        title: job?.title || "",
        slug: job?.slug || "",
        description: job?.description || "",
        tags: job?.tags?.join(", ") || "",
        status: job?.status || "active",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (job) {
            setFormData({
                title: job.title,
                slug: job.slug,
                description: job.description || "",
                tags: job.tags.join(", "),
                status: job.status,
            });
        } else {
            setFormData({
                title: "",
                slug: "",
                description: "",
                tags: "",
                status: "active",
            });
        }
    }, [job, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({
                ...formData,
                tags: formData.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to submit:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {job ? "Edit Job" : "Create New Job"}
                    </DialogTitle>
                    <DialogDescription>
                        {job ? "Update job details" : "Add a new job opening"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        title: e.target.value,
                                        slug:
                                            formData.slug ||
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/\s+/g, "-")
                                                .replace(/[^a-z0-9-]/g, ""),
                                    });
                                }}
                                placeholder="Senior React Developer"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug *</Label>
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
                                required
                            />
                        </div>
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
                                placeholder="Job description..."
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        tags: e.target.value,
                                    })
                                }
                                placeholder="remote, full-time, senior"
                            />
                        </div>
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
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            {job ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function JobsIndex({ loaderData }: Route.ComponentProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [optimisticJobs, setOptimisticJobs] = useState(loaderData.data);
    const [isReordering, setIsReordering] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        setOptimisticJobs(loaderData.data);
    }, [loaderData.data]);

    const handleCreateOrUpdate = async (data: any) => {
        try {
            if (editingJob) {
                await fetch(`/api/jobs/${editingJob.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                toast.success("Job updated successfully");
            } else {
                const maxOrder = await db.jobs.orderBy("order").last();
                await fetch("/api/jobs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...data,
                        order: (maxOrder?.order || 0) + 1,
                    }),
                });
                toast.success("Job created successfully");
            }
            navigate("/jobs");
        } catch (error) {
            toast.error("Failed to save job");
            throw error;
        }
    };

    const handleArchive = async (job: Job) => {
        try {
            await fetch(`/api/jobs/${job.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: job.status === "active" ? "archived" : "active",
                }),
            });
            toast.success(
                `Job ${job.status === "active" ? "archived" : "unarchived"}`
            );
            navigate("/jobs");
        } catch (error) {
            toast.error("Failed to update job");
        }
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const oldIndex = optimisticJobs.findIndex(
            (j: Job) => j.id === active.id
        );
        const newIndex = optimisticJobs.findIndex((j: Job) => j.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // Optimistic update
        const newJobs = [...optimisticJobs];
        const [movedJob] = newJobs.splice(oldIndex, 1);
        newJobs.splice(newIndex, 0, movedJob);
        setOptimisticJobs(newJobs);
        setIsReordering(true);

        try {
            const response = await fetch(`/api/jobs/${active.id}/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fromOrder: optimisticJobs[oldIndex].order,
                    toOrder: optimisticJobs[newIndex].order,
                }),
            });

            if (!response.ok) {
                throw new Error("Reorder failed");
            }

            toast.success("Jobs reordered successfully");
            //navigate("/jobs");
        } catch (error) {
            // Rollback on failure
            setOptimisticJobs(loaderData.data);
            toast.error("Failed to reorder jobs. Changes reverted.");
        } finally {
            setIsReordering(false);
        }
    };

    const activeJob = optimisticJobs.find((j: Job) => j.id === activeId);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
                    <p className="text-gray-600 mt-1">
                        Manage your job openings
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingJob(null);
                        setIsModalOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Job
                </Button>
            </div>

            {isReordering && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-800">
                        Reordering jobs...
                    </span>
                </div>
            )}

            <Card className="mb-6">
                <CardContent className="pt-6">
                    <Form className="flex gap-4">
                        <Input
                            name="search"
                            placeholder="Search jobs..."
                            defaultValue={searchParams.get("search") || ""}
                            className="flex-1"
                        />
                        <select
                            name="status"
                            defaultValue={searchParams.get("status") || "all"}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                        <Button type="submit">Filter</Button>
                    </Form>
                </CardContent>
            </Card>

            {optimisticJobs.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No jobs found
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Get started by creating your first job opening
                        </p>
                        <Button
                            onClick={() => {
                                setEditingJob(null);
                                setIsModalOpen(true);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Job
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={optimisticJobs.map((j: Job) => j.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {optimisticJobs.map((job: Job) => (
                                <SortableJobCard
                                    key={job.id}
                                    job={job}
                                    onEdit={() => {
                                        setEditingJob(job);
                                        setIsModalOpen(true);
                                    }}
                                    onArchive={() => handleArchive(job)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    <DragOverlay>
                        {activeJob && (
                            <Card className="shadow-lg">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-3">
                                        <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {activeJob.title}
                                            </h3>
                                            <Badge
                                                variant={
                                                    activeJob.status ===
                                                    "active"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {activeJob.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        )}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Pagination - UPDATED */}
            {loaderData.meta && loaderData.meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loaderData.meta.page === 1}
                        onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set(
                                "page",
                                String(loaderData.meta.page - 1)
                            );
                            setSearchParams(newParams);
                        }}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                    </Button>

                    <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                        Page {loaderData.meta.page} of{" "}
                        {loaderData.meta.totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={
                            loaderData.meta.page === loaderData.meta.totalPages
                        }
                        onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set(
                                "page",
                                String(parseInt(loaderData.meta.page) + 1)
                            );
                            setSearchParams(newParams);
                        }}
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}

            <JobFormDialog
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                job={editingJob}
                onSubmit={handleCreateOrUpdate}
            />
        </div>
    );
}
