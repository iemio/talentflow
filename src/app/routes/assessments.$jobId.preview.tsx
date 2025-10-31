import type { Route } from "./+types/assessments.$jobId.preview";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { db, type Question } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    ArrowLeft,
    Send,
    Loader2,
    AlertCircle,
    CheckCircle,
    Clock,
    FileQuestion,
    Plus,
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

    return { job, assessment: assessment || null };
}

export default function AssessmentPreview({
    loaderData,
}: Route.ComponentProps) {
    const navigate = useNavigate();
    const { job, assessment } = loaderData;

    const [responses, setResponses] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(
        assessment?.timeLimit ? assessment.timeLimit * 60 : null
    );

    // Timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    toast.error("Time's up! Auto-submitting...");
                    setTimeout(
                        () => handleSubmit(new Event("submit") as any),
                        1000
                    );
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);

    // Show empty state if no assessment
    if (!assessment) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <Link to={`/dashboard/assessments/${job.id}`}>
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Builder
                    </Button>
                </Link>

                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FileQuestion className="w-16 h-16 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">
                            No Assessment Found
                        </h2>
                        <p className="text-muted-foreground mb-6 text-center max-w-md">
                            This job doesn't have an assessment yet. Create one
                            to start evaluating candidates.
                        </p>
                        <Link to={`/dashboard/assessments/${job.id}`}>
                            <Button size="lg">
                                <Plus className="w-5 h-5 mr-2" />
                                Create Assessment
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const allQuestions = assessment.sections.flatMap((s: any) => s.questions);
    const answeredCount = Object.keys(responses).length;
    const progressPercentage = (answeredCount / allQuestions.length) * 100;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const shouldShowQuestion = (question: Question) => {
        if (!question.conditionalOn) return true;

        const dependentAnswer = responses[question.conditionalOn.questionId];
        return dependentAnswer === question.conditionalOn.value;
    };

    const validateQuestion = (
        question: Question,
        value: any
    ): string | null => {
        if (
            question.required &&
            (!value || (Array.isArray(value) && value.length === 0))
        ) {
            return "This field is required";
        }

        if (question.type === "number" && value) {
            const numValue = Number(value);
            if (
                question.minValue !== undefined &&
                numValue < question.minValue
            ) {
                return `Value must be at least ${question.minValue}`;
            }
            if (
                question.maxValue !== undefined &&
                numValue > question.maxValue
            ) {
                return `Value must be at most ${question.maxValue}`;
            }
        }

        if (
            (question.type === "text" || question.type === "longtext") &&
            value
        ) {
            if (question.maxLength && value.length > question.maxLength) {
                return `Maximum ${question.maxLength} characters allowed`;
            }
        }

        return null;
    };

    const handleInputChange = (
        questionId: string,
        value: any,
        question: Question
    ) => {
        setResponses({ ...responses, [questionId]: value });

        if (errors[questionId]) {
            const newErrors = { ...errors };
            delete newErrors[questionId];
            setErrors(newErrors);
        }

        const error = validateQuestion(question, value);
        if (error) {
            setErrors({ ...errors, [questionId]: error });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        allQuestions.forEach((question: any) => {
            if (shouldShowQuestion(question)) {
                const error = validateQuestion(
                    question,
                    responses[question.id]
                );
                if (error) {
                    newErrors[question.id] = error;
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fix the errors before submitting");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/assessments/${job.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidateId: "preview-" + Date.now(),
                    responses,
                }),
            });

            if (!response.ok) throw new Error("Failed to submit");

            toast.success("Assessment submitted successfully!");
            navigate(`/dashboard/jobs/${job.id}`);
        } catch (error) {
            toast.error("Failed to submit assessment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link to={`/dashboard/assessments/${job.id}`}>
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Builder
                    </Button>
                </Link>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        Assessment Preview
                    </p>
                </div>

                {/* Timer */}
                {timeRemaining !== null && (
                    <Alert
                        className={`mb-4 ${
                            timeRemaining < 300
                                ? "border-destructive/50 bg-destructive/10"
                                : "border-primary/20 bg-primary/5"
                        }`}
                    >
                        <Clock
                            className={`h-4 w-4 ${
                                timeRemaining < 300
                                    ? "text-destructive"
                                    : "text-primary"
                            }`}
                        />
                        <AlertDescription
                            className={
                                timeRemaining < 300
                                    ? "text-destructive"
                                    : "text-primary"
                            }
                        >
                            Time Remaining:{" "}
                            <strong>{formatTime(timeRemaining)}</strong>
                            {timeRemaining < 300 && " - Hurry up!"}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Progress */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                Progress
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {answeredCount} of {allQuestions.length}{" "}
                                questions
                            </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Preview Mode Alert */}
            <Alert className="mb-6 border-primary/20 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">
                    This is a preview mode. Fill out the form to test validation
                    and conditional logic.
                </AlertDescription>
            </Alert>

            {/* Assessment Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {assessment.sections.map((section: any) => {
                    const visibleQuestions =
                        section.questions.filter(shouldShowQuestion);

                    if (visibleQuestions.length === 0) return null;

                    return (
                        <Card key={section.id}>
                            <CardHeader>
                                <CardTitle>{section.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {visibleQuestions.map((question: any) => (
                                    <div
                                        key={question.id}
                                        className="space-y-2"
                                    >
                                        <Label className="flex items-start gap-1">
                                            <span>{question.text}</span>
                                            {question.required && (
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            )}
                                        </Label>

                                        {/* Single Choice */}
                                        {question.type === "single" && (
                                            <div className="space-y-2">
                                                {question.options?.map(
                                                    (option: any) => (
                                                        <label
                                                            key={option}
                                                            className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/50"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={
                                                                    question.id
                                                                }
                                                                value={option}
                                                                checked={
                                                                    responses[
                                                                        question
                                                                            .id
                                                                    ] === option
                                                                }
                                                                onChange={(e) =>
                                                                    handleInputChange(
                                                                        question.id,
                                                                        e.target
                                                                            .value,
                                                                        question
                                                                    )
                                                                }
                                                                className="text-primary"
                                                            />
                                                            <span>
                                                                {option}
                                                            </span>
                                                        </label>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* Multiple Choice */}
                                        {question.type === "multi" && (
                                            <div className="space-y-2">
                                                {question.options?.map(
                                                    (option: any) => (
                                                        <label
                                                            key={option}
                                                            className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/50"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                value={option}
                                                                checked={responses[
                                                                    question.id
                                                                ]?.includes(
                                                                    option
                                                                )}
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const current =
                                                                        responses[
                                                                            question
                                                                                .id
                                                                        ] || [];
                                                                    const updated =
                                                                        e.target
                                                                            .checked
                                                                            ? [
                                                                                  ...current,
                                                                                  option,
                                                                              ]
                                                                            : current.filter(
                                                                                  (
                                                                                      v: string
                                                                                  ) =>
                                                                                      v !==
                                                                                      option
                                                                              );
                                                                    handleInputChange(
                                                                        question.id,
                                                                        updated,
                                                                        question
                                                                    );
                                                                }}
                                                                className="text-primary rounded"
                                                            />
                                                            <span>
                                                                {option}
                                                            </span>
                                                        </label>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* Short Text */}
                                        {question.type === "text" && (
                                            <div>
                                                <Input
                                                    value={
                                                        responses[
                                                            question.id
                                                        ] || ""
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            question.id,
                                                            e.target.value,
                                                            question
                                                        )
                                                    }
                                                    placeholder="Your answer..."
                                                    maxLength={
                                                        question.maxLength
                                                    }
                                                    className={
                                                        errors[question.id]
                                                            ? "border-destructive"
                                                            : ""
                                                    }
                                                />
                                                {question.maxLength && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {
                                                            (
                                                                responses[
                                                                    question.id
                                                                ] || ""
                                                            ).length
                                                        }{" "}
                                                        / {question.maxLength}{" "}
                                                        characters
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Long Text */}
                                        {question.type === "longtext" && (
                                            <div>
                                                <Textarea
                                                    value={
                                                        responses[
                                                            question.id
                                                        ] || ""
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            question.id,
                                                            e.target.value,
                                                            question
                                                        )
                                                    }
                                                    placeholder="Your detailed answer..."
                                                    rows={5}
                                                    maxLength={
                                                        question.maxLength
                                                    }
                                                    className={
                                                        errors[question.id]
                                                            ? "border-destructive"
                                                            : ""
                                                    }
                                                />
                                                {question.maxLength && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {
                                                            (
                                                                responses[
                                                                    question.id
                                                                ] || ""
                                                            ).length
                                                        }{" "}
                                                        / {question.maxLength}{" "}
                                                        characters
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Number */}
                                        {question.type === "number" && (
                                            <div>
                                                <Input
                                                    type="number"
                                                    value={
                                                        responses[
                                                            question.id
                                                        ] || ""
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            question.id,
                                                            e.target.value,
                                                            question
                                                        )
                                                    }
                                                    placeholder={
                                                        question.minValue !==
                                                            undefined &&
                                                        question.maxValue !==
                                                            undefined
                                                            ? `Enter a number between ${question.minValue} and ${question.maxValue}`
                                                            : "Enter a number"
                                                    }
                                                    min={question.minValue}
                                                    max={question.maxValue}
                                                    className={
                                                        errors[question.id]
                                                            ? "border-destructive"
                                                            : ""
                                                    }
                                                />
                                                {(question.minValue !==
                                                    undefined ||
                                                    question.maxValue !==
                                                        undefined) && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Range:{" "}
                                                        {question.minValue ??
                                                            "−∞"}{" "}
                                                        to{" "}
                                                        {question.maxValue ??
                                                            "∞"}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* File Upload */}
                                        {question.type === "file" && (
                                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    id={question.id}
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files?.[0];
                                                        if (file) {
                                                            handleInputChange(
                                                                question.id,
                                                                file.name,
                                                                question
                                                            );
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={question.id}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="text-muted-foreground">
                                                        {responses[
                                                            question.id
                                                        ] ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                                <span className="font-medium text-foreground">
                                                                    {
                                                                        responses[
                                                                            question
                                                                                .id
                                                                        ]
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="font-medium">
                                                                    Click to
                                                                    upload or
                                                                    drag and
                                                                    drop
                                                                </p>
                                                                <p className="text-sm mt-1">
                                                                    PDF, DOC,
                                                                    DOCX up to
                                                                    10MB
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                        )}

                                        {/* Error Message */}
                                        {errors[question.id] && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors[question.id]}
                                            </p>
                                        )}

                                        {/* Conditional Indicator */}
                                        {question.conditionalOn && (
                                            <p className="text-xs text-primary flex items-center gap-1">
                                                ⚡ This question appeared based
                                                on your previous answer
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Submit Button */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {
                                    allQuestions.filter(
                                        (q: any) =>
                                            shouldShowQuestion(q) && q.required
                                    ).length
                                }{" "}
                                required questions
                            </p>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Submit Assessment
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
