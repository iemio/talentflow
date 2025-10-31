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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Mail,
    Calendar,
    Briefcase,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    Phone,
    FileText,
    Plus,
    Video,
    MapPin,
    Award,
    Timer,
    Download,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { SimpleResumeViewer as ResumeViewer } from "@/components/resume-viewer";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    const candidateId = params.id;

    const [candidate, timeline, job, notes, interviews, assessmentResponse] =
        await Promise.all([
            db.candidates.get(candidateId),
            db.statusChanges
                .where("candidateId")
                .equals(candidateId)
                .sortBy("timestamp"),
            db.candidates
                .get(candidateId)
                .then((c) => (c ? db.jobs.get(c.jobId) : null)),
            db.notes
                .where("candidateId")
                .equals(candidateId)
                .reverse()
                .sortBy("createdAt"),
            db.interviews
                .where("candidateId")
                .equals(candidateId)
                .sortBy("date"),
            db.assessmentResponses
                .where("candidateId")
                .equals(candidateId)
                .first(),
        ]);

    if (!candidate) {
        throw new Response("Candidate not found", { status: 404 });
    }

    return {
        candidate,
        job,
        timeline: timeline || [],
        notes: notes || [],
        interviews: interviews || [],
        assessmentResponse: assessmentResponse || null,
    };
}

export default function CandidateDetail({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();
    const { candidate, job, timeline, notes, interviews, assessmentResponse } =
        loaderData;
    const [newNote, setNewNote] = useState("");
    const [isUpdatingStage, setIsUpdatingStage] = useState(false);
    const [isSchedulingInterview, setIsSchedulingInterview] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Interview form state
    const [interviewForm, setInterviewForm] = useState({
        type: "video" as
            | "phone"
            | "video"
            | "onsite"
            | "technical"
            | "behavioral",
        title: "",
        interviewers: "",
        date: "",
        time: "",
        duration: "60",
        notes: "",
    });

    const stageColors: Record<string, string> = {
        applied:
            "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
        screen: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300",
        interview:
            "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300",
        tech: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300",
        offer: "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300",
        hired: "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300",
        rejected:
            "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300",
    };

    const stages = [
        "applied",
        "screen",
        "interview",
        "tech",
        "offer",
        "hired",
        "rejected",
    ];

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
                return (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                );
            case "rejected":
                return (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                );
            default:
                return (
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                );
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
            navigate(`/dashboard/candidates/${candidate.id}`, {
                replace: true,
            });
        } catch (error) {
            toast.error("Failed to update candidate stage");
        } finally {
            setIsUpdatingStage(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            // Extract mentions from note (words starting with @)
            const mentions =
                newNote.match(/@(\w+)/g)?.map((m) => m.substring(1)) || [];

            const response = await fetch(
                `/api/candidates/${candidate.id}/notes`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: newNote, mentions }),
                }
            );

            if (!response.ok) throw new Error("Failed to add note");

            toast.success("Note added");
            setNewNote("");
            navigate(`/dashboard/candidates/${candidate.id}`, {
                replace: true,
            });
        } catch (error) {
            toast.error("Failed to add note");
        }
    };

    const handleScheduleInterview = async () => {
        if (
            !interviewForm.title ||
            !interviewForm.date ||
            !interviewForm.time
        ) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSchedulingInterview(true);
        try {
            const interviewDate = new Date(
                `${interviewForm.date}T${interviewForm.time}`
            );

            const response = await fetch(
                `/api/candidates/${candidate.id}/interviews`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: interviewForm.type,
                        title: interviewForm.title,
                        interviewers: interviewForm.interviewers
                            .split(",")
                            .map((i) => i.trim()),
                        date: interviewDate,
                        duration: parseInt(interviewForm.duration),
                        notes: interviewForm.notes,
                        status: "scheduled",
                    }),
                }
            );

            if (!response.ok) throw new Error("Failed to schedule interview");

            toast.success("Interview scheduled successfully");
            setIsDialogOpen(false);
            setInterviewForm({
                type: "video",
                title: "",
                interviewers: "",
                date: "",
                time: "",
                duration: "60",
                notes: "",
            });
            navigate(`/dashboard/candidates/${candidate.id}`, {
                replace: true,
            });
        } catch (error) {
            toast.error("Failed to schedule interview");
        } finally {
            setIsSchedulingInterview(false);
        }
    };

    const getInterviewIcon = (type: string) => {
        switch (type) {
            case "phone":
                return <Phone className="w-4 h-4" />;
            case "video":
                return <Video className="w-4 h-4" />;
            case "onsite":
                return <MapPin className="w-4 h-4" />;
            default:
                return <Briefcase className="w-4 h-4" />;
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <Link to="/dashboard/candidates">
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
                                    <AvatarFallback className="bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xl">
                                        {getInitials(candidate.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold text-foreground">
                                                {candidate.name}
                                            </h1>
                                            <div className="space-y-1 mt-1">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="w-4 h-4" />
                                                    <span>
                                                        {candidate.email}
                                                    </span>
                                                </div>
                                                {candidate.phone && (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Phone className="w-4 h-4" />
                                                        <span>
                                                            {candidate.phone}
                                                        </span>
                                                    </div>
                                                )}
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
                                            to={`/dashboard/jobs/${job.id}`}
                                            className="flex items-center gap-2 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            <Briefcase className="w-4 h-4" />
                                            {job.title}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    Applied on{" "}
                                    {new Date(
                                        candidate.appliedAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            {assessmentResponse && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                                    <p className="text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                                        <Award className="w-4 h-4" />
                                        Assessment completed
                                    </p>
                                    <div className="flex gap-3 text-sm text-green-700 dark:text-green-400">
                                        {assessmentResponse.score && (
                                            <span className="font-medium">
                                                Score:{" "}
                                                {assessmentResponse.score}%
                                            </span>
                                        )}
                                        {assessmentResponse.completionTime && (
                                            <span className="flex items-center gap-1">
                                                <Timer className="w-3 h-3" />
                                                {
                                                    assessmentResponse.completionTime
                                                }{" "}
                                                min
                                            </span>
                                        )}
                                    </div>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

                    {/* Tabs for organized content */}
                    <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="interviews">
                                Interviews ({interviews.length})
                            </TabsTrigger>
                            <TabsTrigger value="notes">
                                Notes ({notes.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Timeline Tab */}
                        <TabsContent value="timeline">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity Timeline</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {timeline.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No activity yet
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                                                        {getStageIcon(
                                                            "applied"
                                                        )}
                                                    </div>
                                                    {timeline.length > 0 && (
                                                        <div className="w-0.5 h-full bg-border mt-2" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <p className="font-medium text-foreground">
                                                        Applied to position
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(
                                                            candidate.appliedAt
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {timeline.map(
                                                (
                                                    change: any,
                                                    index: number
                                                ) => (
                                                    <div
                                                        key={change.id}
                                                        className="flex gap-4"
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                                                                {getStageIcon(
                                                                    change.to
                                                                )}
                                                            </div>
                                                            {index <
                                                                timeline.length -
                                                                    1 && (
                                                                <div className="w-0.5 h-full bg-border mt-2" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <p className="font-medium text-foreground">
                                                                Moved from{" "}
                                                                <span className="capitalize">
                                                                    {
                                                                        change.from
                                                                    }
                                                                </span>{" "}
                                                                to{" "}
                                                                <span className="capitalize">
                                                                    {change.to}
                                                                </span>
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(
                                                                    change.timestamp
                                                                ).toLocaleString()}
                                                            </p>
                                                            {change.note && (
                                                                <p className="text-sm mt-2 p-2 bg-muted rounded">
                                                                    {
                                                                        change.note
                                                                    }
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
                        </TabsContent>

                        {/* Interviews Tab */}
                        <TabsContent value="interviews">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Scheduled Interviews</CardTitle>
                                    <Dialog
                                        open={isDialogOpen}
                                        onOpenChange={setIsDialogOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button size="sm">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Schedule Interview
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Schedule Interview
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>
                                                            Interview Type*
                                                        </Label>
                                                        <Select
                                                            value={
                                                                interviewForm.type
                                                            }
                                                            onValueChange={(
                                                                value: any
                                                            ) =>
                                                                setInterviewForm(
                                                                    {
                                                                        ...interviewForm,
                                                                        type: value,
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="phone">
                                                                    Phone
                                                                </SelectItem>
                                                                <SelectItem value="video">
                                                                    Video
                                                                </SelectItem>
                                                                <SelectItem value="onsite">
                                                                    On-site
                                                                </SelectItem>
                                                                <SelectItem value="technical">
                                                                    Technical
                                                                </SelectItem>
                                                                <SelectItem value="behavioral">
                                                                    Behavioral
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>
                                                            Duration (minutes)*
                                                        </Label>
                                                        <Select
                                                            value={
                                                                interviewForm.duration
                                                            }
                                                            onValueChange={(
                                                                value
                                                            ) =>
                                                                setInterviewForm(
                                                                    {
                                                                        ...interviewForm,
                                                                        duration:
                                                                            value,
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="30">
                                                                    30 minutes
                                                                </SelectItem>
                                                                <SelectItem value="45">
                                                                    45 minutes
                                                                </SelectItem>
                                                                <SelectItem value="60">
                                                                    1 hour
                                                                </SelectItem>
                                                                <SelectItem value="90">
                                                                    1.5 hours
                                                                </SelectItem>
                                                                <SelectItem value="120">
                                                                    2 hours
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>
                                                        Interview Title*
                                                    </Label>
                                                    <Input
                                                        value={
                                                            interviewForm.title
                                                        }
                                                        onChange={(e) =>
                                                            setInterviewForm({
                                                                ...interviewForm,
                                                                title: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        placeholder="e.g., Technical Round 1"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Date*</Label>
                                                        <Input
                                                            type="date"
                                                            value={
                                                                interviewForm.date
                                                            }
                                                            onChange={(e) =>
                                                                setInterviewForm(
                                                                    {
                                                                        ...interviewForm,
                                                                        date: e
                                                                            .target
                                                                            .value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Time*</Label>
                                                        <Input
                                                            type="time"
                                                            value={
                                                                interviewForm.time
                                                            }
                                                            onChange={(e) =>
                                                                setInterviewForm(
                                                                    {
                                                                        ...interviewForm,
                                                                        time: e
                                                                            .target
                                                                            .value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>
                                                        Interviewers
                                                        (comma-separated)
                                                    </Label>
                                                    <Input
                                                        value={
                                                            interviewForm.interviewers
                                                        }
                                                        onChange={(e) =>
                                                            setInterviewForm({
                                                                ...interviewForm,
                                                                interviewers:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        placeholder="e.g., John Smith, Sarah Johnson"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Notes</Label>
                                                    <Textarea
                                                        value={
                                                            interviewForm.notes
                                                        }
                                                        onChange={(e) =>
                                                            setInterviewForm({
                                                                ...interviewForm,
                                                                notes: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        placeholder="Additional notes or instructions..."
                                                        rows={3}
                                                    />
                                                </div>

                                                <Button
                                                    onClick={
                                                        handleScheduleInterview
                                                    }
                                                    disabled={
                                                        isSchedulingInterview
                                                    }
                                                    className="w-full"
                                                >
                                                    {isSchedulingInterview && (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    )}
                                                    Schedule Interview
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent>
                                    {interviews.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No interviews scheduled yet
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {interviews.map(
                                                (interview: any) => (
                                                    <div
                                                        key={interview.id}
                                                        className="p-4 border rounded-lg space-y-2"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {getInterviewIcon(
                                                                    interview.type
                                                                )}
                                                                <div>
                                                                    <p className="font-medium text-foreground">
                                                                        {
                                                                            interview.title
                                                                        }
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground capitalize">
                                                                        {
                                                                            interview.type
                                                                        }{" "}
                                                                        Interview
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                variant={
                                                                    interview.status ===
                                                                    "completed"
                                                                        ? "default"
                                                                        : interview.status ===
                                                                          "cancelled"
                                                                        ? "destructive"
                                                                        : "secondary"
                                                                }
                                                            >
                                                                {
                                                                    interview.status
                                                                }
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(
                                                                    interview.date
                                                                ).toLocaleDateString()}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(
                                                                    interview.date
                                                                ).toLocaleTimeString(
                                                                    [],
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    }
                                                                )}{" "}
                                                                (
                                                                {
                                                                    interview.duration
                                                                }{" "}
                                                                min)
                                                            </span>
                                                        </div>
                                                        {interview.interviewers
                                                            .length > 0 && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Interviewers:{" "}
                                                                {interview.interviewers.join(
                                                                    ", "
                                                                )}
                                                            </p>
                                                        )}
                                                        {interview.notes && (
                                                            <p className="text-sm p-2 bg-muted rounded mt-2">
                                                                {
                                                                    interview.notes
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notes Tab */}
                        <TabsContent value="notes">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Textarea
                                            value={newNote}
                                            onChange={(e) =>
                                                setNewNote(e.target.value)
                                            }
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
                                    {notes.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No notes yet
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {notes.map((note: any) => (
                                                <div
                                                    key={note.id}
                                                    className="p-3 bg-muted rounded-lg space-y-2"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-foreground">
                                                            {note.createdBy}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(
                                                                note.createdAt
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-foreground whitespace-pre-wrap">
                                                        {note.content}
                                                    </p>
                                                    {note.mentions.length >
                                                        0 && (
                                                        <div className="flex gap-1 flex-wrap">
                                                            {note.mentions.map(
                                                                (
                                                                    mention: string
                                                                ) => (
                                                                    <Badge
                                                                        key={
                                                                            mention
                                                                        }
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        @
                                                                        {
                                                                            mention
                                                                        }
                                                                    </Badge>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
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
                            {candidate.phone && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <a href={`tel:${candidate.phone}`}>
                                        <Phone className="w-4 h-4 mr-2" />
                                        Call Candidate
                                    </a>
                                </Button>
                            )}
                            {job && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link to={`/dashboard/jobs/${job.id}`}>
                                        <Briefcase className="w-4 h-4 mr-2" />
                                        View Job
                                    </Link>
                                </Button>
                            )}
                            {candidate.resumeUrl && (
                                <ResumeViewer
                                    resumeUrl={candidate.resumeUrl}
                                    candidateName={candidate.name}
                                />
                            )}
                            {assessmentResponse && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() =>
                                        toast.info(
                                            "Assessment response viewer coming soon"
                                        )
                                    }
                                >
                                    <Award className="w-4 h-4 mr-2" />
                                    View Assessment
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assessment Score Card */}
                    {assessmentResponse && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assessment Results</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {assessmentResponse.score && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            Score
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${assessmentResponse.score}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="font-bold text-lg">
                                                {assessmentResponse.score}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Completion Time
                                    </p>
                                    <p className="font-medium text-foreground flex items-center gap-1">
                                        <Timer className="w-4 h-4" />
                                        {assessmentResponse.completionTime ||
                                            "N/A"}{" "}
                                        minutes
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Submitted On
                                    </p>
                                    <p className="font-medium text-foreground">
                                        {new Date(
                                            assessmentResponse.submittedAt
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Candidate Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">
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
                                <p className="text-sm text-muted-foreground">
                                    Applied Date
                                </p>
                                <p className="font-medium text-foreground">
                                    {new Date(
                                        candidate.appliedAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Days in Pipeline
                                </p>
                                <p className="font-medium text-foreground">
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
                            {interviews.filter(
                                (i: any) => i.status === "scheduled"
                            ).length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Upcoming Interviews
                                        </p>
                                        <p className="font-medium text-foreground">
                                            {
                                                interviews.filter(
                                                    (i: any) =>
                                                        i.status === "scheduled"
                                                ).length
                                            }
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
