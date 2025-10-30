import type { Route } from "./+types/assessments.$jobId";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
    db,
    type Assessment,
    type AssessmentSection,
    type Question,
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Eye,
    Save,
    Loader2,
    ChevronDown,
    ChevronUp,
    Clock,
    FileText,
} from "lucide-react";
import { toast } from "sonner";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    const jobId = params.jobId;

    const [job, assessment] = await Promise.all([
        db.jobs.get(jobId),
        db.assessments.where("jobId").equals(jobId).first(),
    ]);

    if (!job) {
        throw new Response("Job not found", { status: 404 });
    }

    return {
        job,
        assessment: assessment || {
            jobId,
            status: "draft" as const,
            timeLimit: undefined,
            sections: [
                {
                    id: crypto.randomUUID(),
                    title: "Section 1",
                    questions: [],
                },
            ],
            updatedAt: new Date(),
        },
    };
}

function QuestionEditor({
    question,
    sectionId,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    allQuestions,
}: {
    question: Question;
    sectionId: string;
    onUpdate: (q: Question) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
    allQuestions: Question[];
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [dragOver, setDragOver] = useState(false);

    const questionTypes = [
        { value: "single", label: "Single Choice" },
        { value: "multi", label: "Multiple Choice" },
        { value: "text", label: "Short Text" },
        { value: "longtext", label: "Long Text" },
        { value: "number", label: "Number" },
        { value: "file", label: "File Upload" },
    ];

    return (
        <Card
            className={`mb-4 transition-all ${
                dragOver ? "ring-2 ring-primary" : ""
            }`}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("questionId", question.id);
            }}
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                // Handle drop in parent component
            }}
        >
            <CardHeader
                className="cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                        <span className="font-medium">
                            {question.text || "New Question"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveUp();
                            }}
                            disabled={isFirst}
                        >
                            ↑
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveDown();
                            }}
                            disabled={isLast}
                        >
                            ↓
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        >
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                        ) : (
                            <ChevronDown className="w-5 h-5" />
                        )}
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Question Text *</Label>
                        <Textarea
                            value={question.text}
                            onChange={(e) =>
                                onUpdate({ ...question, text: e.target.value })
                            }
                            placeholder="Enter your question..."
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Question Type</Label>
                            <Select
                                value={question.type}
                                onValueChange={(value) =>
                                    onUpdate({
                                        ...question,
                                        type: value as any,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {questionTypes.map((type) => (
                                        <SelectItem
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={(e) =>
                                        onUpdate({
                                            ...question,
                                            required: e.target.checked,
                                        })
                                    }
                                    className="rounded"
                                />
                                Required
                            </Label>
                        </div>
                    </div>

                    {(question.type === "single" ||
                        question.type === "multi") && (
                        <div className="space-y-2">
                            <Label>Options (one per line)</Label>
                            <Textarea
                                value={question.options?.join("\n") || ""}
                                onChange={(e) => {
                                    const lines = e.target.value.split("\n");
                                    onUpdate({
                                        ...question,
                                        options: lines,
                                    });
                                }}
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                                rows={4}
                            />
                        </div>
                    )}

                    {question.type === "number" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Min Value</Label>
                                <Input
                                    type="number"
                                    value={question.minValue || ""}
                                    onChange={(e) =>
                                        onUpdate({
                                            ...question,
                                            minValue: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Value</Label>
                                <Input
                                    type="number"
                                    value={question.maxValue || ""}
                                    onChange={(e) =>
                                        onUpdate({
                                            ...question,
                                            maxValue: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {(question.type === "text" ||
                        question.type === "longtext") && (
                        <div className="space-y-2">
                            <Label>Max Length (characters)</Label>
                            <Input
                                type="number"
                                value={question.maxLength || ""}
                                onChange={(e) =>
                                    onUpdate({
                                        ...question,
                                        maxLength: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                }
                                placeholder="Optional"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Show Conditionally</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                value={
                                    question.conditionalOn?.questionId || "none"
                                }
                                onValueChange={(value) => {
                                    if (value === "none") {
                                        onUpdate({
                                            ...question,
                                            conditionalOn: undefined,
                                        });
                                    } else {
                                        onUpdate({
                                            ...question,
                                            conditionalOn: {
                                                questionId: value,
                                                value:
                                                    question.conditionalOn
                                                        ?.value || "",
                                            },
                                        });
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Always show" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Always show
                                    </SelectItem>
                                    {allQuestions
                                        .filter((q) => q.id !== question.id)
                                        .map((q) => (
                                            <SelectItem key={q.id} value={q.id}>
                                                When: {q.text.slice(0, 30)}...
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {question.conditionalOn && (
                                <Input
                                    value={question.conditionalOn.value}
                                    onChange={(e) =>
                                        onUpdate({
                                            ...question,
                                            conditionalOn: {
                                                ...question.conditionalOn!,
                                                value: e.target.value,
                                            },
                                        })
                                    }
                                    placeholder="equals value..."
                                />
                            )}
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

export default function AssessmentBuilder({
    loaderData,
}: Route.ComponentProps) {
    const { job, assessment: initialAssessment } = loaderData;
    const [assessment, setAssessment] = useState<Assessment>(initialAssessment);
    const [isSaving, setIsSaving] = useState(false);
    const [hasTimeLimit, setHasTimeLimit] = useState(
        !!initialAssessment.timeLimit
    );

    const addSection = () => {
        setAssessment({
            ...assessment,
            sections: [
                ...assessment.sections,
                {
                    id: crypto.randomUUID(),
                    title: `Section ${assessment.sections.length + 1}`,
                    questions: [],
                },
            ],
        });
    };

    const updateSection = (
        sectionId: string,
        updates: Partial<AssessmentSection>
    ) => {
        setAssessment({
            ...assessment,
            sections: assessment.sections.map((s) =>
                s.id === sectionId ? { ...s, ...updates } : s
            ),
        });
    };

    const deleteSection = (sectionId: string) => {
        if (assessment.sections.length === 1) {
            toast.error("Cannot delete the last section");
            return;
        }
        setAssessment({
            ...assessment,
            sections: assessment.sections.filter((s) => s.id !== sectionId),
        });
    };

    const addQuestion = (sectionId: string) => {
        setAssessment({
            ...assessment,
            sections: assessment.sections.map((s) =>
                s.id === sectionId
                    ? {
                          ...s,
                          questions: [
                              ...s.questions,
                              {
                                  id: crypto.randomUUID(),
                                  type: "text",
                                  text: "",
                                  required: false,
                              },
                          ],
                      }
                    : s
            ),
        });
    };

    const updateQuestion = (
        sectionId: string,
        questionId: string,
        updates: Question
    ) => {
        setAssessment({
            ...assessment,
            sections: assessment.sections.map((s) =>
                s.id === sectionId
                    ? {
                          ...s,
                          questions: s.questions.map((q) =>
                              q.id === questionId ? updates : q
                          ),
                      }
                    : s
            ),
        });
    };

    const deleteQuestion = (sectionId: string, questionId: string) => {
        setAssessment({
            ...assessment,
            sections: assessment.sections.map((s) =>
                s.id === sectionId
                    ? {
                          ...s,
                          questions: s.questions.filter(
                              (q) => q.id !== questionId
                          ),
                      }
                    : s
            ),
        });
    };

    const moveQuestion = (
        sectionId: string,
        questionId: string,
        direction: "up" | "down"
    ) => {
        setAssessment({
            ...assessment,
            sections: assessment.sections.map((s) => {
                if (s.id !== sectionId) return s;

                const idx = s.questions.findIndex((q) => q.id === questionId);
                if (idx === -1) return s;

                const newQuestions = [...s.questions];
                if (direction === "up" && idx > 0) {
                    [newQuestions[idx - 1], newQuestions[idx]] = [
                        newQuestions[idx],
                        newQuestions[idx - 1],
                    ];
                } else if (
                    direction === "down" &&
                    idx < newQuestions.length - 1
                ) {
                    [newQuestions[idx], newQuestions[idx + 1]] = [
                        newQuestions[idx + 1],
                        newQuestions[idx],
                    ];
                }

                return { ...s, questions: newQuestions };
            }),
        });
    };

    const handleSave = async (saveAs: "draft" | "published") => {
        const hasEmptyQuestions = assessment.sections.some((s) =>
            s.questions.some((q) => !q.text.trim())
        );

        if (hasEmptyQuestions) {
            toast.error("Please fill in all question texts");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`/api/assessments/${job.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sections: assessment.sections,
                    status: saveAs,
                    timeLimit: hasTimeLimit ? assessment.timeLimit : undefined,
                }),
            });

            if (!response.ok) throw new Error("Failed to save");

            setAssessment({ ...assessment, status: saveAs });
            toast.success(
                saveAs === "draft"
                    ? "Assessment saved as draft"
                    : "Assessment published successfully"
            );
        } catch (error) {
            toast.error("Failed to save assessment");
        } finally {
            setIsSaving(false);
        }
    };

    const allQuestions = assessment.sections.flatMap((s) => s.questions);
    const totalQuestions = allQuestions.length;
    const navigate = useNavigate();

    return (
        <div className="p-8">
            <div className="mb-6">
                <Link to={`/jobs/${job.id}`}>
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Job
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">
                                Assessment Builder
                            </h1>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    assessment.status === "published"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                }`}
                            >
                                {assessment.status === "published"
                                    ? "✓ Published"
                                    : "📝 Draft"}
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            {job.title} • {totalQuestions} question
                            {totalQuestions !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (totalQuestions > 0) {
                                    navigate(`/assessments/${job.id}/preview`);
                                }
                            }}
                            disabled={totalQuestions === 0}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                        </Button>
                        <Button
                            onClick={() => handleSave("draft")}
                            disabled={isSaving || totalQuestions === 0}
                            variant="outline"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Save as Draft
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => handleSave("published")}
                            disabled={isSaving || totalQuestions === 0}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Publish
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Time Limit Settings */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <Label className="text-base font-medium">
                                    Time Limit
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Set a time limit for completing this
                                    assessment
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {hasTimeLimit && (
                                <Input
                                    type="number"
                                    min={5}
                                    max={240}
                                    value={assessment.timeLimit || 60}
                                    onChange={(e) =>
                                        setAssessment({
                                            ...assessment,
                                            timeLimit: Number(e.target.value),
                                        })
                                    }
                                    className="w-24"
                                    placeholder="60"
                                />
                            )}
                            {hasTimeLimit && (
                                <span className="text-sm text-muted-foreground">
                                    minutes
                                </span>
                            )}
                            <Switch
                                checked={hasTimeLimit}
                                onCheckedChange={(checked) => {
                                    setHasTimeLimit(checked);
                                    if (!checked) {
                                        setAssessment({
                                            ...assessment,
                                            timeLimit: undefined,
                                        });
                                    } else {
                                        setAssessment({
                                            ...assessment,
                                            timeLimit: 60,
                                        });
                                    }
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {assessment.sections.map((section) => (
                        <Card key={section.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <Input
                                            value={section.title}
                                            onChange={(e) =>
                                                updateSection(section.id, {
                                                    title: e.target.value,
                                                })
                                            }
                                            className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0 pl-4"
                                            placeholder="Section Title"
                                        />
                                    </div>
                                    {assessment.sections.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                deleteSection(section.id)
                                            }
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {section.questions.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                                        <p className="text-muted-foreground mb-3">
                                            No questions in this section
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                addQuestion(section.id)
                                            }
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add First Question
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {section.questions.map(
                                            (question, idx) => (
                                                <QuestionEditor
                                                    key={question.id}
                                                    question={question}
                                                    sectionId={section.id}
                                                    onUpdate={(q) =>
                                                        updateQuestion(
                                                            section.id,
                                                            question.id,
                                                            q
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        deleteQuestion(
                                                            section.id,
                                                            question.id
                                                        )
                                                    }
                                                    onMoveUp={() =>
                                                        moveQuestion(
                                                            section.id,
                                                            question.id,
                                                            "up"
                                                        )
                                                    }
                                                    onMoveDown={() =>
                                                        moveQuestion(
                                                            section.id,
                                                            question.id,
                                                            "down"
                                                        )
                                                    }
                                                    isFirst={idx === 0}
                                                    isLast={
                                                        idx ===
                                                        section.questions
                                                            .length -
                                                            1
                                                    }
                                                    allQuestions={allQuestions}
                                                />
                                            )
                                        )}
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() =>
                                                addQuestion(section.id)
                                            }
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Question
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={addSection}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                    </Button>
                </div>

                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Assessment Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Status:
                                </span>
                                <span className="font-medium capitalize">
                                    {assessment.status}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Time Limit:
                                </span>
                                <span className="font-medium">
                                    {assessment.timeLimit
                                        ? `${assessment.timeLimit} min`
                                        : "No limit"}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Sections:
                                </span>
                                <span className="font-medium">
                                    {assessment.sections.length}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Total Questions:
                                </span>
                                <span className="font-medium">
                                    {totalQuestions}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Required Questions:
                                </span>
                                <span className="font-medium">
                                    {
                                        allQuestions.filter((q) => q.required)
                                            .length
                                    }
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Conditional Questions:
                                </span>
                                <span className="font-medium">
                                    {
                                        allQuestions.filter(
                                            (q) => q.conditionalOn
                                        ).length
                                    }
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-sm">💡 Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                            <p>
                                • Drag questions using the grip icon to reorder
                            </p>
                            <p>
                                • Use conditional questions to create dynamic
                                assessments
                            </p>
                            <p>
                                • Save as draft to keep working, publish when
                                ready
                            </p>
                            <p>• Preview your assessment before publishing</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
