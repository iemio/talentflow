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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
        tags: job.tags?.join(", "),
        status: job.status,
        location: job.location || "",
        locationType: job.locationType || "onsite",
        department: job.department || "",
        employmentType: job.employmentType || "full-time",

        // Requirements
        requiredQualifications: job.requirements?.required?.join("\n") || "",
        preferredQualifications: job.requirements?.preferred?.join("\n") || "",
        education: job.requirements?.education || "",
        experience: job.requirements?.experience || "",
        certifications: job.requirements?.certifications?.join(", ") || "",
        technicalSkills: job.requirements?.skills?.technical?.join(", ") || "",
        softSkills: job.requirements?.skills?.soft?.join(", ") || "",

        // Compensation
        salaryMin: job.compensation?.salaryMin?.toString() || "",
        salaryMax: job.compensation?.salaryMax?.toString() || "",
        currency: job.compensation?.currency || "USD",
        payPeriod: job.compensation?.payPeriod || "annual",
        bonusStructure: job.compensation?.bonusStructure || "",
        equity: job.compensation?.equity || "",
        commission: job.compensation?.commission || "",

        // Benefits
        healthBenefits: job.benefits?.health?.join(", ") || "",
        retirement: job.benefits?.retirement || "",
        pto: job.benefits?.pto || "",
        otherBenefits: job.benefits?.other?.join("\n") || "",

        // Hiring Process
        hiringManager: job.hiringProcess?.hiringManager || "",
        recruiter: job.hiringProcess?.recruiter || "",
        positionsAvailable:
            job.hiringProcess?.positionsAvailable?.toString() || "1",

        // Legal
        visaSponsorshipAvailable: job.legal?.visaSponsorshipAvailable || false,
        backgroundCheckRequired: job.legal?.backgroundCheckRequired || false,
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

        // Validate salary range
        if (formData.salaryMin && formData.salaryMax) {
            const min = parseFloat(formData.salaryMin);
            const max = parseFloat(formData.salaryMax);
            if (min > max) {
                newErrors.salaryMin =
                    "Minimum salary cannot be greater than maximum";
            }
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
            const jobData = {
                ...formData,
                tags: (formData.tags ?? "")
                    .split(",")
                    .map((t: any) => t.trim())
                    .filter(Boolean),

                requirements: {
                    required: formData.requiredQualifications
                        .split("\n")
                        .filter(Boolean),
                    preferred: formData.preferredQualifications
                        .split("\n")
                        .filter(Boolean),
                    education: formData.education || undefined,
                    experience: formData.experience || undefined,
                    certifications: formData.certifications
                        ? formData.certifications
                              .split(",")
                              .map((c) => c.trim())
                              .filter(Boolean)
                        : [],
                    skills: {
                        technical: formData.technicalSkills
                            ? formData.technicalSkills
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                            : [],
                        soft: formData.softSkills
                            ? formData.softSkills
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                            : [],
                    },
                },

                compensation: {
                    salaryMin: formData.salaryMin
                        ? parseFloat(formData.salaryMin)
                        : undefined,
                    salaryMax: formData.salaryMax
                        ? parseFloat(formData.salaryMax)
                        : undefined,
                    currency: formData.currency,
                    payPeriod: formData.payPeriod as "hourly" | "annual",
                    bonusStructure: formData.bonusStructure || undefined,
                    equity: formData.equity || undefined,
                    commission: formData.commission || undefined,
                },

                benefits: {
                    health: formData.healthBenefits
                        ? formData.healthBenefits
                              .split(",")
                              .map((b) => b.trim())
                              .filter(Boolean)
                        : [],
                    retirement: formData.retirement || undefined,
                    pto: formData.pto || undefined,
                    other: formData.otherBenefits
                        ? formData.otherBenefits.split("\n").filter(Boolean)
                        : [],
                },

                hiringProcess: {
                    hiringManager: formData.hiringManager || undefined,
                    recruiter: formData.recruiter || undefined,
                    positionsAvailable: formData.positionsAvailable
                        ? parseInt(formData.positionsAvailable)
                        : 1,
                },

                legal: {
                    visaSponsorshipAvailable: formData.visaSponsorshipAvailable,
                    backgroundCheckRequired: formData.backgroundCheckRequired,
                },
            };

            const response = await fetch(`/api/jobs/${job.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jobData),
            });

            if (!response.ok) {
                throw new Error("Failed to update job");
            }

            toast.success("Job updated successfully");
            navigate(`/dashboard/jobs/${job.id}`);
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
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-6">
                <Link to={`/dashboard/jobs/${job.id}`}>
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Job
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-foreground">Edit Job</h1>
                <p className="text-muted-foreground mt-1">
                    Update job details, requirements, and compensation
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>
                            Core job details and posting information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    className={
                                        errors.title ? "border-red-500" : ""
                                    }
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-500">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">
                                    Slug <span className="text-red-500">*</span>
                                </Label>
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
                                {errors.slug && (
                                    <p className="text-sm text-red-500">
                                        {errors.slug}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            department: e.target.value,
                                        })
                                    }
                                    placeholder="Engineering"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="employmentType">
                                    Employment Type
                                </Label>
                                <Select
                                    value={formData.employmentType}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            employmentType: value as
                                                | "full-time"
                                                | "part-time"
                                                | "contract"
                                                | "temporary"
                                                | "internship",
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full-time">
                                            Full-time
                                        </SelectItem>
                                        <SelectItem value="part-time">
                                            Part-time
                                        </SelectItem>
                                        <SelectItem value="contract">
                                            Contract
                                        </SelectItem>
                                        <SelectItem value="temporary">
                                            Temporary
                                        </SelectItem>
                                        <SelectItem value="internship">
                                            Internship
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: e.target.value,
                                        })
                                    }
                                    placeholder="San Francisco, CA"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="locationType">
                                    Location Type
                                </Label>
                                <Select
                                    value={formData.locationType}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            locationType: value as
                                                | "onsite"
                                                | "hybrid"
                                                | "remote",
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="onsite">
                                            On-site
                                        </SelectItem>
                                        <SelectItem value="hybrid">
                                            Hybrid
                                        </SelectItem>
                                        <SelectItem value="remote">
                                            Remote
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Job Description</Label>
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
                                rows={6}
                                className="resize-none"
                            />
                        </div>

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
                            <p className="text-sm text-muted-foreground">
                                Comma-separated tags
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        status: value as "active" | "archived",
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        Archived
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Requirements & Qualifications */}
                <Card>
                    <CardHeader>
                        <CardTitle>Requirements & Qualifications</CardTitle>
                        <CardDescription>
                            Define what candidates need to succeed in this role
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="requiredQualifications">
                                Required Qualifications
                            </Label>
                            <Textarea
                                id="requiredQualifications"
                                value={formData.requiredQualifications}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        requiredQualifications: e.target.value,
                                    })
                                }
                                placeholder="5+ years of React experience&#10;Strong JavaScript fundamentals&#10;Experience with TypeScript"
                                rows={5}
                                className="resize-none font-mono text-sm"
                            />
                            <p className="text-sm text-muted-foreground">
                                One requirement per line
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="preferredQualifications">
                                Preferred Qualifications
                            </Label>
                            <Textarea
                                id="preferredQualifications"
                                value={formData.preferredQualifications}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        preferredQualifications: e.target.value,
                                    })
                                }
                                placeholder="Experience with Next.js&#10;Knowledge of design systems&#10;Open source contributions"
                                rows={4}
                                className="resize-none font-mono text-sm"
                            />
                            <p className="text-sm text-muted-foreground">
                                One qualification per line
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="education">Education</Label>
                                <Input
                                    id="education"
                                    value={formData.education}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            education: e.target.value,
                                        })
                                    }
                                    placeholder="Bachelor's degree in Computer Science"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experience">
                                    Experience Level
                                </Label>
                                <Input
                                    id="experience"
                                    value={formData.experience}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            experience: e.target.value,
                                        })
                                    }
                                    placeholder="5+ years of relevant experience"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="certifications">
                                Certifications
                            </Label>
                            <Input
                                id="certifications"
                                value={formData.certifications}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        certifications: e.target.value,
                                    })
                                }
                                placeholder="AWS Certified Developer, PMP"
                            />
                            <p className="text-sm text-muted-foreground">
                                Comma-separated list
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="technicalSkills">
                                    Technical Skills
                                </Label>
                                <Textarea
                                    id="technicalSkills"
                                    value={formData.technicalSkills}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            technicalSkills: e.target.value,
                                        })
                                    }
                                    placeholder="React, TypeScript, Node.js, PostgreSQL"
                                    rows={3}
                                    className="resize-none"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Comma-separated
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="softSkills">Soft Skills</Label>
                                <Textarea
                                    id="softSkills"
                                    value={formData.softSkills}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            softSkills: e.target.value,
                                        })
                                    }
                                    placeholder="Leadership, Communication, Problem-solving"
                                    rows={3}
                                    className="resize-none"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Comma-separated
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Compensation Package */}
                <Card>
                    <CardHeader>
                        <CardTitle>Compensation Package</CardTitle>
                        <CardDescription>
                            Salary ranges and benefits information
                            <Badge variant="outline" className="ml-2">
                                Required in many states
                            </Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="salaryMin">
                                    Minimum Salary
                                </Label>
                                <Input
                                    id="salaryMin"
                                    type="number"
                                    value={formData.salaryMin}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            salaryMin: e.target.value,
                                        })
                                    }
                                    placeholder="80000"
                                    className={
                                        errors.salaryMin ? "border-red-500" : ""
                                    }
                                />
                                {errors.salaryMin && (
                                    <p className="text-sm text-red-500">
                                        {errors.salaryMin}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="salaryMax">
                                    Maximum Salary
                                </Label>
                                <Input
                                    id="salaryMax"
                                    type="number"
                                    value={formData.salaryMax}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            salaryMax: e.target.value,
                                        })
                                    }
                                    placeholder="120000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select
                                    value={formData.currency}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            currency: value,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="INR">INR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payPeriod">Pay Period</Label>
                                <Select
                                    value={formData.payPeriod}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            payPeriod: value as
                                                | "annual"
                                                | "hourly",
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="annual">
                                            Annual
                                        </SelectItem>
                                        <SelectItem value="hourly">
                                            Hourly
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="bonusStructure">
                                    Bonus Structure
                                </Label>
                                <Input
                                    id="bonusStructure"
                                    value={formData.bonusStructure}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            bonusStructure: e.target.value,
                                        })
                                    }
                                    placeholder="Up to 20% performance bonus"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="equity">Equity</Label>
                                <Input
                                    id="equity"
                                    value={formData.equity}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            equity: e.target.value,
                                        })
                                    }
                                    placeholder="Stock options available"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="commission">Commission</Label>
                                <Input
                                    id="commission"
                                    value={formData.commission}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            commission: e.target.value,
                                        })
                                    }
                                    placeholder="10-15% commission"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Benefits */}
                <Card>
                    <CardHeader>
                        <CardTitle>Benefits & Perks</CardTitle>
                        <CardDescription>
                            Employee benefits and additional compensation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="healthBenefits">
                                Health Benefits
                            </Label>
                            <Input
                                id="healthBenefits"
                                value={formData.healthBenefits}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        healthBenefits: e.target.value,
                                    })
                                }
                                placeholder="Medical, Dental, Vision"
                            />
                            <p className="text-sm text-muted-foreground">
                                Comma-separated list
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="retirement">
                                    Retirement Plan
                                </Label>
                                <Input
                                    id="retirement"
                                    value={formData.retirement}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            retirement: e.target.value,
                                        })
                                    }
                                    placeholder="401(k) with 5% company match"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pto">Paid Time Off</Label>
                                <Input
                                    id="pto"
                                    value={formData.pto}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            pto: e.target.value,
                                        })
                                    }
                                    placeholder="20 days PTO + 10 holidays"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="otherBenefits">
                                Other Benefits & Perks
                            </Label>
                            <Textarea
                                id="otherBenefits"
                                value={formData.otherBenefits}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        otherBenefits: e.target.value,
                                    })
                                }
                                placeholder="Remote work stipend&#10;Professional development budget&#10;Gym membership&#10;Flexible hours"
                                rows={4}
                                className="resize-none font-mono text-sm"
                            />
                            <p className="text-sm text-muted-foreground">
                                One benefit per line
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Hiring Process */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hiring Process</CardTitle>
                        <CardDescription>
                            Team members and process details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="hiringManager">
                                    Hiring Manager
                                </Label>
                                <Input
                                    id="hiringManager"
                                    value={formData.hiringManager}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            hiringManager: e.target.value,
                                        })
                                    }
                                    placeholder="John Smith"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="recruiter">Recruiter</Label>
                                <Input
                                    id="recruiter"
                                    value={formData.recruiter}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            recruiter: e.target.value,
                                        })
                                    }
                                    placeholder="Sarah Johnson"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="positionsAvailable">
                                    Positions Available
                                </Label>
                                <Input
                                    id="positionsAvailable"
                                    type="number"
                                    min="1"
                                    value={formData.positionsAvailable}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            positionsAvailable: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Legal & Compliance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Legal & Compliance</CardTitle>
                        <CardDescription>
                            Legal requirements and compliance information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="visaSponsorshipAvailable"
                                checked={formData.visaSponsorshipAvailable}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        visaSponsorshipAvailable:
                                            e.target.checked,
                                    })
                                }
                                className="w-4 h-4"
                            />
                            <Label
                                htmlFor="visaSponsorshipAvailable"
                                className="font-normal cursor-pointer"
                            >
                                Visa sponsorship available
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="backgroundCheckRequired"
                                checked={formData.backgroundCheckRequired}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        backgroundCheckRequired:
                                            e.target.checked,
                                    })
                                }
                                className="w-4 h-4"
                            />
                            <Label
                                htmlFor="backgroundCheckRequired"
                                className="font-normal cursor-pointer"
                            >
                                Background check required
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <Link to={`/dashboard/jobs/${job.id}`}>
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
        </div>
    );
}
