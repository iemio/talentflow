import type { Route } from "./+types/assessments.$jobId.preview";
import { useState } from "react";
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

    if (!assessment) {
        throw new Response("Assessment not found", { status: 404 });
    }

    return { job, assessment };
}

export default function AssessmentPreview({
    loaderData,
}: Route.ComponentProps) {
    const navigate = useNavigate();
    const { job, assessment } = loaderData;

    const [responses, setResponses] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allQuestions = assessment.sections.flatMap((s: any) => s.questions);
    const answeredCount = Object.keys(responses).length;
    const progressPercentage = (answeredCount / allQuestions.length) * 100;

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

        // Clear error when user starts typing
        if (errors[questionId]) {
            const newErrors = { ...errors };
            delete newErrors[questionId];
            setErrors(newErrors);
        }

        // Real-time validation
        const error = validateQuestion(question, value);
        if (error) {
            setErrors({ ...errors, [questionId]: error });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all visible required questions
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
            // Submit assessment (storing in demo mode with fake candidate ID)
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
            navigate(`/jobs/${job.id}`);
        } catch (error) {
            toast.error("Failed to submit assessment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link to={`/assessments/${job.id}`}>
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Builder
                    </Button>
                </Link>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {job.title}
                    </h1>
                    <p className="text-gray-600 mt-1">Assessment Preview</p>
                </div>

                {/* Progress */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                Progress
                            </span>
                            <span className="text-sm text-gray-600">
                                {answeredCount} of {allQuestions.length}{" "}
                                questions
                            </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Preview Mode Alert */}
            <Alert className="mb-6 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
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
                                                <span className="text-red-500">
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
                                                            className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
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
                                                                className="text-blue-600"
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
                                                            className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
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
                                                                className="text-blue-600 rounded"
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
                                                            ? "border-red-500"
                                                            : ""
                                                    }
                                                />
                                                {question.maxLength && (
                                                    <p className="text-xs text-gray-500 mt-1">
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
                                                            ? "border-red-500"
                                                            : ""
                                                    }
                                                />
                                                {question.maxLength && (
                                                    <p className="text-xs text-gray-500 mt-1">
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
                                                            ? "border-red-500"
                                                            : ""
                                                    }
                                                />
                                                {(question.minValue !==
                                                    undefined ||
                                                    question.maxValue !==
                                                        undefined) && (
                                                    <p className="text-xs text-gray-500 mt-1">
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
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
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
                                                    <div className="text-gray-600">
                                                        {responses[
                                                            question.id
                                                        ] ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                                <span className="font-medium">
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
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors[question.id]}
                                            </p>
                                        )}

                                        {/* Conditional Indicator */}
                                        {question.conditionalOn && (
                                            <p className="text-xs text-blue-600 flex items-center gap-1">
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
                            <p className="text-sm text-gray-600">
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
